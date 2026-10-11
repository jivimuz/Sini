import React, { useMemo, useRef, useEffect, useState } from 'react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { View, Text, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useProfileModalStore } from '@/stores/profileModal.store';
import { getCustomerProfile, CustomerProfile } from '@/app/profile/api/show';
import { followCustomer, unfollowCustomer } from '@/app/profile/api/follow';
import { useChatStore } from '@/app/chat/stores/chat.store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import localest from './locales';
import { useLang } from '@/stores/lang.store';
import Toast from '@/utils/Toast';

export default function UserProfileModal() {
    const sheetRef = useRef<BottomSheet>(null);
    const { selectedUserId, closeProfile } = useProfileModalStore();
    const { startConversationWith } = useChatStore();

    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFollowPending, setIsFollowPending] = useState(false);
    const [isStartingChat, setIsStartingChat] = useState(false);

    const { lang } = useLang()
    const t = localest[lang].userProfileModal;
    const snapPoints = useMemo(() => ['60%'], []);

    useEffect(() => {
        if (!selectedUserId) {
            sheetRef.current?.close();
            setProfile(null);
            return;
        }

        sheetRef.current?.expand();
        setIsLoading(true);
        getCustomerProfile(selectedUserId)
            .then(setProfile)
            .catch(() => Toast.error(t.loadErrorTitle, t.loadErrorMessage))
            .finally(() => setIsLoading(false));
    }, [selectedUserId]);

    const handleToggleFollow = async () => {
        if (!profile || isFollowPending) return;
        const wasFollowing = profile.isFollowing;

        setIsFollowPending(true);
        setProfile((prev) => prev && {
            ...prev,
            isFollowing: !wasFollowing,
            followersCount: prev.followersCount + (wasFollowing ? -1 : 1),
        });

        try {
            const result = wasFollowing ? await unfollowCustomer(profile.id) : await followCustomer(profile.id);
            setProfile(result);
        } catch {
            setProfile((prev) => prev && { ...prev, isFollowing: wasFollowing, followersCount: prev.followersCount });
            Toast.error(t.followErrorTitle, t.followErrorMessage);
        } finally {
            setIsFollowPending(false);
        }
    };

    const handleChat = async () => {
        if (!profile || isStartingChat) return;
        setIsStartingChat(true);
        try {
            const conversation = await startConversationWith(profile.id);
            closeProfile();
            router.navigate(`/chat/screens/chatRoom/${conversation.id}` as any);
        } catch {
            Toast.error(t.followErrorTitle, t.followErrorMessage);
        } finally {
            setIsStartingChat(false);
        }
    };

    const content = isLoading ? (
        <BottomSheetView className="flex-1 bg-gray-50 items-center justify-center py-20">
            <ActivityIndicator color="#FFD84D" />
        </BottomSheetView>
    ) : profile ? (
        <BottomSheetView className="flex-1 bg-gray-50 px-6 pt-5 pb-20">

            {/* Avatar */}
            <View className="flex-row justify-end">
                <TouchableOpacity onPress={closeProfile}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
            </View>

            <View className="items-center">

                <View className="relative">

                    <Image
                        source={{
                            uri: profile.avatarUrl ?? undefined,
                        }}
                        className="
                    w-28
                    h-28
                    rounded-full
                    border-4
                    border-[#FFD84D]
                    "
                    />

                    {profile.isOnline && (
                        <View
                            className="
                        absolute
                        bottom-1
                        right-1
                        w-5
                        h-5
                        rounded-full
                        bg-green-500
                        border-2
                        border-white
                        "
                        />
                    )}

                </View>

                <Text
                    className="
                mt-4
                text-2xl
                font-bold
                text-neutral-800
                "
                >
                    {profile.name}
                </Text>

                <Text className="text-neutral-500">
                    @{profile.username}
                </Text>

            </View>

            {/* Bio */}

            <View
                className="
            mt-6
            bg-white
            rounded-3xl
            p-5
            "
            >
                <Text className="font-semibold ">
                    {t.bio}
                </Text>


                <Text
                    className="
                text-neutral-700
                leading-6
                "
                >
                    {profile.bio || t.noBio}
                </Text>

            </View>

            {/* Stats */}

            <View
                className="
            mt-5
            bg-white
            rounded-3xl
            p-5
            flex-row
            justify-around
            "
            >

                <View className="items-center">

                    <Text className="text-2xl font-bold">
                        {profile.followersCount}
                    </Text>

                    <Text className="text-neutral-500">
                        {t.followers}
                    </Text>

                </View>

                <View className="items-center">

                    <Text className="text-2xl font-bold">
                        {profile.followingCount}
                    </Text>

                    <Text className="text-neutral-500">
                        {t.following}
                    </Text>

                </View>

            </View>

            {/* Button */}

            {!profile.isSelf && (
                <View className="flex-row mt-6 gap-3">

                    <TouchableOpacity
                        onPress={handleToggleFollow}
                        disabled={isFollowPending}
                        className={`flex-1 h-14 rounded-full items-center justify-center flex-row ${profile.isFollowing ? 'bg-white border border-gray-200' : 'bg-[#FFD84D]'}`}
                        style={{ opacity: isFollowPending ? 0.7 : 1 }}
                    >
                        {isFollowPending ? (
                            <ActivityIndicator size="small" color={profile.isFollowing ? '#171717' : 'black'} />
                        ) : (
                            <Text className={`font-bold ${profile.isFollowing ? 'text-neutral-800' : 'text-black'}`}>
                                {profile.isFollowing ? t.unfollow : t.follow}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleChat}
                        disabled={isStartingChat}
                        className="flex-1 h-14 rounded-full bg-white border border-gray-200 items-center justify-center"
                        style={{ opacity: isStartingChat ? 0.7 : 1 }}
                    >
                        {isStartingChat ? (
                            <ActivityIndicator size="small" color="#171717" />
                        ) : (
                            <Text className="font-bold text-neutral-800">
                                {t.chat}
                            </Text>
                        )}
                    </TouchableOpacity>

                </View>
            )}

        </BottomSheetView>
    ) : (
        <View />
    );

    return (
        <BottomSheet
            ref={sheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={closeProfile}
            handleIndicatorStyle={{ backgroundColor: '#D1D5DB' }}
            backgroundStyle={{ backgroundColor: '#FFFFFF' }}
        >
            {content}
        </BottomSheet>
    );
}
