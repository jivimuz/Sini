# Sini Mobile Context

## Stack

- Expo SDK 57
- React Native 0.86.3
- React 19.2.3
- TypeScript
- Expo Router
- NativeWind
- Zustand
- TanStack React Query is installed but not yet the universal server-state pattern
- Expo Secure Store for access/refresh tokens
- Laravel Echo and Pusher/Reverb dependencies for realtime
- MapLibre, Expo Location, Image Picker, and Image Manipulator

## Entry Points

- Routes/screens: `src/app/`
- Root navigation guard: `src/app/_layout.tsx`
- Central HTTP client: `src/app/api/client.ts`
- API types: `src/app/api/types.ts`
- Feature service facade: `src/api/index.ts`
- Auth state: `src/stores/auth.store.ts`
- Mobile feature context: `MOBILE_CONTEXT.md`
- Backend API contract: `../Sini-Backend/API_CONTRACT.md`

## API Client Rules

All API requests must use `apiRequest` from `src/app/api/client.ts`.

The client handles:

- `EXPO_PUBLIC_API_BASE_URL`
- URL normalization and query arrays
- JSON/FormData bodies
- `Accept: application/json`
- bearer access token from Secure Store
- `ApiError` with HTTP status and validation details

Token storage exposes access and refresh token operations. Login responses must use `tokenStorage.setSession`; logout must clear both tokens and auth state.

Development API URLs:

- Android emulator: `http://10.0.2.2:8000/api`
- iOS simulator: `http://localhost:8000/api`
- Physical device: `http://<laptop-ip>:8000/api`

## Routes and Features

Auth:

- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/refresh-token`

Product routes:

- `/` and `/home`: map/feed/location
- `/nearby`: nearby discovery
- `/post`: status creation/media
- `/chat` and `/chat/screens/chatRoom/[id]`: conversations/messages
- `/profile`: profile/avatar
- `/notification`: notifications

## Current Integration Gaps

- Auth store is still primarily in-memory; startup hydration and automatic refresh need completion.
- Register, forgot password, logout, and refresh services are not fully bound to UI flows.
- Feed/home, nearby, marker, profile, chat, and notification stores still contain dummy/local state in places.
- Echo is configured but not yet a complete event subscription lifecycle.
- Existing feed/history/nearby service types expect arrays; do not switch backend pagination to objects without changing these services and screens together.

## iOS Build Requirement

The workspace path contains a space: `/Users/jivimuz/Codes/Full stack/Sini`.

When native files are regenerated:

```bash
npx expo prebuild --no-install
cd ios && pod install --no-repo-update
```

Use `ios/Sini.xcworkspace`, not `Sini.xcodeproj`, when opening Xcode.

The `find: /Users/jivimuz/Codes/Full` messages from MapLibre post-install are warnings from another generated script; the blocking Constants script must remain fixed separately.

## Mobile Validation

```bash
npm install
npx tsc --noEmit
npx expo prebuild --no-install
npx expo run:ios
```

Do not accept Expo's prompt to clear/regenerate native files without checking whether the config plugin is present. The plugin is the source of truth for the path workaround.

## UI and State Rules

- Keep API calls in feature service files under `src/app/<feature>/api`.
- Bind API data through existing stores/hooks instead of adding screen-local duplicate fetch logic.
- Handle `401`, `422`, `429`, server, and network errors distinctly where the UI has appropriate states.
- Do not manually set `Content-Type` for FormData.
- Normalize backend media URLs before passing them to React Native image components.
- Preserve existing route names and auth guard behavior unless the task explicitly changes navigation.
