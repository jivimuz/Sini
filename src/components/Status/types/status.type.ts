import { ImageSourcePropType } from "react-native";

interface StatusData {
    id: string;
    user_name: string;
    avatarUrl: string;
    statusImageUrl: ImageSourcePropType;
    caption: string;
    location_name: string;
    distance: string;
    created_at: string;
}

export type { StatusData };