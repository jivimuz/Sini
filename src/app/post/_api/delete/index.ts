import { apiRequest } from "../../../api/client";

export const deletePost = (postId: string) => {
    return apiRequest<{ deleted: boolean }>({
        path: `/posts/${postId}`,
        method: "DELETE",
    });
};
