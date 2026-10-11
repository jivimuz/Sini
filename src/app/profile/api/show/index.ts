import { apiRequest } from "../../../api/client";

export interface CustomerProfile {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    isOnline: boolean;
    lastSeen: string | null;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isSelf: boolean;
}

/** Public profile of ANY customer (not just the logged-in one) -- see profile/api/me for that. */
export const getCustomerProfile = (customerId: string) => {
    return apiRequest<CustomerProfile>({
        path: `/customers/${customerId}`,
        method: "GET",
    });
};
