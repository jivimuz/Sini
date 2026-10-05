import { apiRequest } from "../../../api/client";

export interface ProfileResponse {
    id: string;
    name: string;
    username?: string;
    email?: string;
    avatarUrl?: string;
    bio?: string;
    phone?: string;
    language?: "idID" | "enGB";
    [key: string]: unknown;
}

export const getMe = () => {
    return apiRequest<ProfileResponse>({
        path: "/profile/me",
        method: "GET",
    });
};