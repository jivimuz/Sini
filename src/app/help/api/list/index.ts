import { apiRequest } from "../../../api/client";

export interface HelpTopic {
    id: string;
    category: string;
    title: string;
    order: number;
}

/** Already filtered to active topics and sorted by `order` ascending by the backend. */
export const listHelpTopics = () => {
    return apiRequest<HelpTopic[]>({
        path: "/help-topics",
        method: "GET",
    });
};
