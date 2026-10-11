import { apiRequest } from "../../../api/client";
import { CustomerProfile } from "../show";

export const followCustomer = (customerId: string) => {
    return apiRequest<CustomerProfile>({
        path: `/customers/${customerId}/follow`,
        method: "POST",
    });
};

export const unfollowCustomer = (customerId: string) => {
    return apiRequest<CustomerProfile>({
        path: `/customers/${customerId}/follow`,
        method: "DELETE",
    });
};
