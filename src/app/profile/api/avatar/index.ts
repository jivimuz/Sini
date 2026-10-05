import { apiRequest } from "../../../api/client";
import { ProfileResponse } from "../me";

export const updateAvatar = (formData: FormData) => {
    return apiRequest<ProfileResponse, FormData>({
        path: "/profile/avatar",
        method: "PATCH",
        body: formData,
    });
};