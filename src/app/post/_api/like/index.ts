import { apiRequest } from "../../../api/client";

export interface LikeResponse {
    isLiked: boolean;
    likeCount: number;
}

export const togglePostLike = (postId: string) => {
    return apiRequest<LikeResponse>({
        path: `/posts/${postId}/like`,
        method: "POST",
    });
};