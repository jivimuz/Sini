import { apiRequest } from "../../../api/client";

export interface PostViewer {
    id: string;
    name: string;
    avatarUrl: string;
    viewedAt: string;
}

export const getPostViewers = (postId: string) => {
    return apiRequest<PostViewer[]>({
        path: `/posts/${postId}/viewers`,
        method: "GET",
    });
};
