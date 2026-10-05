import { apiRequest } from "../../../api/client";
import { UserStatus } from "@/types/userStatus.type";

/** Ends a live post early (before `liveUntil` naturally passes). Only the post's own customer may call this. */
export const endLivePost = (postId: string) => {
    return apiRequest<UserStatus>({
        path: `/posts/${postId}/end-live`,
        method: "POST",
    });
};
