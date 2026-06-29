import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";

export const AppleButton = ({ onPress }: { onPress: () => void }) => {
    return (
        <TouchableOpacity
            className="flex-1 h-14 border border-neutral-200 rounded-2xl flex-row items-center justify-center bg-white active:bg-neutral-50"
            onPress={onPress}
        >
            <Ionicons name="logo-apple" size={20} color="#808080" />
            <Text className="text-sm font-bold text-neutral-700 ml-2">Apple</Text>
        </TouchableOpacity>
    );
}