import { apiRequest } from "../../../api/client";

export interface HelpTopicDetail {
    id: string;
    category: string;
    title: string;
    order: number;
    content: string;
}

/** 404s (`ApiError.status === 404`) when the id is unknown or the topic is inactive. */
export const getHelpTopic = (id: string) => {
    return apiRequest<HelpTopicDetail>({
        path: `/help-topics/${id}`,
        method: "GET",
    });
};
