import { apiRequest } from "../../../api/client";
import { ProfileResponse } from "../me";

export interface UpdateProfileRequest {
    name?: string;
    username?: string;
    bio?: string;
    phone?: string;
    language?: "idID" | "enGB";
}

export const updateProfile = (payload: UpdateProfileRequest) => {
    return apiRequest<ProfileResponse, UpdateProfileRequest>({
        path: "/profile/me",
        method: "PATCH",
        body: payload,
    });
};