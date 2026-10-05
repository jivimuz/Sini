import Echo from "laravel-echo";
import * as PusherModule from "pusher-js";
import { tokenStorage } from "@/app/api/client";

// pusher-js's React Native build (dist/react-native/pusher.js, picked up automatically by
// Metro via the package's "react-native" field) exports the class as `module.exports.Pusher`,
// not as a default export -- but its own .d.ts still declares a `default` export. Under
// Metro's CJS interop that mismatch makes `import Pusher from "pusher-js"` resolve to the
// whole exports object instead of the class, so `new Pusher(...)` fails with "Object cannot
// be used as a constructor." Unwrap defensively rather than relying on either shape.
const Pusher: typeof PusherModule.default = (PusherModule as any).Pusher ?? (PusherModule as any).default ?? PusherModule;

/**
 * EXPO_PUBLIC_API_BASE_URL is the REST API origin (e.g. "localhost:8000/api"). Laravel's
 * broadcasting auth route lives at the app root (`/broadcasting/auth`), not under `/api`,
 * so strip that suffix to get the origin Echo's authorizer should POST to.
 */
const normalizeOrigin = (value: string) => {
    const trimmed = value.trim().replace(/\/+$/, "");
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    return withScheme.replace(/\/api$/, "");
};

const API_ORIGIN = normalizeOrigin(process.env.EXPO_PUBLIC_API_BASE_URL ?? "");
const BROADCASTING_AUTH_ENDPOINT = `${API_ORIGIN}/broadcasting/auth`;
const REVERB_SCHEME = process.env.EXPO_PUBLIC_REVERB_SCHEME ?? "http";
const REVERB_PORT = Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 80);

// pusher-js doesn't export its `ChannelAuthorizationCallback` type from the package's public
// entry point, so this is typed loosely rather than fighting a deep internal import path.
type AuthorizeCallback = (error: Error | null, data: any) => void;

let echoInstance: Echo<"reverb"> | null = null;

/**
 * Private channels (every chat channel is private) require a bearer token on
 * `/broadcasting/auth`, but the token lives in SecureStore and can only be read
 * asynchronously -- Echo's static `auth.headers` option can't express that, so this
 * authorizer fetches it itself for every subscribe attempt instead.
 */
const authorizer = (channel: { name: string }) => ({
    authorize: async (socketId: string, callback: AuthorizeCallback) => {
        try {
            const token = await tokenStorage.get();
            const response = await fetch(BROADCASTING_AUTH_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
            });

            if (!response.ok) {
                throw new Error(`Broadcasting auth failed with status ${response.status}`);
            }

            callback(null, await response.json());
        } catch (error) {
            callback(error instanceof Error ? error : new Error(String(error)), null);
        }
    },
});

/**
 * Lazily creates a single shared Echo/Reverb connection. Lazy so the app never opens a
 * websocket before there's a logged-in session to authorize channels for.
 */
export const getEcho = (): Echo<"reverb"> => {
    if (echoInstance) return echoInstance;

    echoInstance = new Echo({
        broadcaster: "reverb",
        Pusher,
        key: process.env.EXPO_PUBLIC_REVERB_APP_KEY!,
        wsHost: process.env.EXPO_PUBLIC_REVERB_HOST!,
        wsPort: REVERB_PORT,
        wssPort: REVERB_PORT,
        forceTLS: REVERB_SCHEME === "https",
        enabledTransports: ["ws", "wss"],
        authEndpoint: BROADCASTING_AUTH_ENDPOINT,
        authorizer,
    });

    return echoInstance;
};

/** Call on logout so a leftover connection doesn't keep authorizing with a stale/cleared token. */
export const disconnectEcho = () => {
    echoInstance?.disconnect();
    echoInstance = null;
};
