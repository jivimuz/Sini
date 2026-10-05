import { apiRequest } from "../../../api/client";
import { UserStatus } from "@/types/userStatus.type";

export const getPostDetail = (postId: string) => {
    return apiRequest<UserStatus>({
        path: `/posts/${postId}`,
        method: "GET",
    });
};