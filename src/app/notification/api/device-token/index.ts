import { apiRequest } from "../../../api/client";

export interface DeviceTokenRequest {
    token: string;
    platform?: "ios" | "android";
}

export const registerDeviceToken = (payload: DeviceTokenRequest) => {
    return apiRequest<{ success: boolean }, DeviceTokenRequest>({
        path: "/device-tokens",
        method: "POST",
        body: payload,
    });
};

export const unregisterDeviceToken = (token: string) => {
    return apiRequest<{ success: boolean }, { token: string }>({
        path: "/device-tokens",
        method: "DELETE",
        body: { token },
    });
};
