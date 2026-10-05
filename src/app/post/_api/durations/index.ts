import { apiRequest } from "../../../api/client";

export interface PostDuration {
    id: string;
    minutes: number;
}

export const getPostDurations = () => {
    return apiRequest<PostDuration[]>({
        path: "/post-durations",
        method: "GET",
    });
};
