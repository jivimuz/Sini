import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    TextInput,
    Switch,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { UserStatus } from '@/types/userStatus.type';
import { CategoryKey, CATEGORIES, ALL_CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import Toast from '@/utils/Toast';
import { useLocationStore } from '@/stores/location.store';
import { useLang } from '@/stores/lang.store';
import locales from '../../locales';
import { getPostDurations, PostDuration } from '../../_api/durations';

type ScheduleDay = { dayOfWeek: number; startTime: string; endTime: string };

/** ISO weekday (1=Senin..7=Minggu), matching `Post::isCurrentlyActive()` on the backend. */
const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7];

/** Backend seeds more presets (30min, 2h, 3h, ...) than the product wants exposed here --
 * only these four survive the filter, in display order. */
const ALLOWED_DURATION_MINUTES = [60, 360, 720, 1440];
const DEFAULT_DURATION_MINUTES = 1440; // 24 jam

const formatDurationLabel = (minutes: number, lang: 'idID' | 'enGB') => {
    if (minutes < 60) return lang === 'idID' ? `${minutes} Menit` : `${minutes} Minutes`;
    const hours = minutes / 60;
    if (lang === 'idID') return `${hours} Jam`;
    return hours === 1 ? '1 Hour' : `${hours} Hours`;
};

const timeStringToDate = (time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

const dateToTimeString = (date: Date): string => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const EditPostView = ({
    post,
    onPost,
    onCancel,
    onDataChange,
    isSubmitting = false,
}: {
    post: Partial<UserStatus>;
    onPost: () => void;
    onCancel: () => void;
    onDataChange: (field: keyof UserStatus, value: any) => void;
    isSubmitting?: boolean;
}) => {
    const { lang } = useLang();
    const t = locales[lang].editPostScreen;
    const availableCategories = ALL_CATEGORIES.filter(cat => cat !== 'all');
    const { latitude, longitude, currentCity, currentCountry } = useLocationStore()

    const [durations, setDurations] = useState<PostDuration[]>([]);
    const [editingTime, setEditingTime] = useState<{ dayOfWeek: number; field: 'startTime' | 'endTime' } | null>(null);

    useEffect(() => {
        getPostDurations().catch(() => []).then((data) => {
            if (!data) return;
            setDurations(data.filter((d) => ALLOWED_DURATION_MINUTES.includes(d.minutes)));
        });
    }, []);

    // Default ke preset 24 jam begitu durasi termuat, kalau pengguna belum memilih sendiri.
    useEffect(() => {
        if (post.postDurationId || durations.length === 0) return;
        const defaultDuration = durations.find((d) => d.minutes === DEFAULT_DURATION_MINUTES);
        if (defaultDuration) onDataChange('postDurationId', defaultDuration.id);
    }, [durations]);

    const schedule = post.schedule ?? [];
    const scheduleForDay = (dayOfWeek: number) => schedule.find((d) => d.dayOfWeek === dayOfWeek);

    const handleToggleDay = (dayOfWeek: number, enabled: boolean) => {
        const next: ScheduleDay[] = enabled
            ? [...schedule, { dayOfWeek, startTime: '09:00', endTime: '17:00' }]
            : schedule.filter((d) => d.dayOfWeek !== dayOfWeek);
        onDataChange('schedule', next.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    };

    const handleChangeDayTime = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
        onDataChange('schedule', schedule.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)));
    };

    const handleDeleteImage = (index: number) => {
        if (post.statusImageUrls && post.statusImageUrls.length > 1) {
            const newImages = [...post.statusImageUrls];
            newImages.splice(index, 1);
            onDataChange('statusImageUrls', newImages);
        } else {
            onCancel();
            Toast.info(t.cancelledTitle, t.cancelledMessage);
        }
    };

    const handleAddImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Toast.info(t.addImagePermissionTitle, t.addImagePermissionMessage);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            const newImageUris = result.assets.map(asset => ({ uri: asset.uri }));
            const existingImages = post.statusImageUrls || [];

            onDataChange('statusImageUrls', [...existingImages, ...newImageUris]);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-neutral-900" edges={['top', 'left', 'right']}>

            {/* Header Section */}
            <View className="flex-row justify-between items-center p-4">
                <TouchableOpacity onPress={onCancel} disabled={isSubmitting}>
                    <Ionicons name="close" size={28} color={isSubmitting ? '#525252' : 'white'} />
                </TouchableOpacity>

                <Text className="text-white font-bold text-lg">{t.title}</Text>

                <TouchableOpacity
                    onPress={onPost}
                    disabled={isSubmitting}
                    className={`bg-primary px-5 py-2 rounded-full flex-row items-center ${isSubmitting ? 'opacity-70' : ''}`}
                >
                    {isSubmitting ? (
                        <>
                            <ActivityIndicator size="small" color="#171717" />
                            <Text className="text-black font-bold ml-2">{t.postingButton}</Text>
                        </>
                    ) : (
                        <Text className="text-black font-bold">{t.postButton}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">

                {/* Photo Section */}
                <View className="p-4">
                    <Text className="text-neutral-400 text-sm font-semibold mb-3">{t.photoLabel}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {post.statusImageUrls?.map((image, index) => (
                            <View key={index} className="w-24 h-24 rounded-lg mr-3 overflow-hidden">
                                <ImageBackground source={image} className="w-full h-full">
                                    <TouchableOpacity
                                        onPress={() => handleDeleteImage(index)}
                                        disabled={isSubmitting}
                                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full"
                                    >
                                        <Ionicons name="close" size={16} color="white" />
                                    </TouchableOpacity>
                                </ImageBackground>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={handleAddImages}
                            disabled={isSubmitting}
                            className="w-24 h-24 bg-neutral-800 rounded-lg items-center justify-center border-2 border-dashed border-neutral-700"
                        >
                            <Ionicons name="add" size={32} color="#737373" />
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Input Details Section */}
                <View className="px-4 pb-8 space-y-5">

                    {/* Category Selector */}
                    <View>
                        <Text className="text-neutral-400 text-sm font-semibold mb-3">{t.categoryLabel}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {availableCategories.map(catKey => {
                                const category = CATEGORIES.find(c => c.key === catKey);
                                const isSelected = post.category === catKey;

                                return (
                                    <TouchableOpacity
                                        key={catKey}
                                        onPress={() => onDataChange('category', catKey)}
                                        disabled={isSubmitting}
                                        style={{ backgroundColor: isSelected ? category?.color : '#262626' }}
                                        className="px-4 py-2 rounded-full mr-2"
                                    >
                                        <Text className="text-white font-bold text-sm">{category?.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Conditional Selling Inputs */}
                    {post.is_selling && (
                        <TextInput
                            placeholder={t.itemTitlePlaceholder}
                            placeholderTextColor="#737373"
                            value={post.title || ''}
                            onChangeText={(text) => onDataChange('title', text)}
                            editable={!isSubmitting}
                            className="text-white text-base bg-neutral-800 rounded-lg px-4 py-3 mt-3"
                        />
                    )}

                    {post.is_selling && (
                        <View className="flex-row items-center bg-neutral-800 rounded-lg px-4 mt-3">
                            <Text className="text-white font-bold mr-2">{t.currencyPrefix}</Text>
                            <TextInput
                                placeholder={t.pricePlaceholder}
                                placeholderTextColor="#737373"
                                value={post.price ? String(post.price) : ''}
                                onChangeText={(text) => onDataChange('price', text.replace(/[^0-9]/g, ''))}
                                keyboardType="numeric"
                                editable={!isSubmitting}
                                className="text-white text-base pt-1 pb-4 flex-1"
                            />
                        </View>
                    )}

                    {/* Caption Input -- wajib hanya untuk kategori selling, lihat required_if di backend */}
                    <TextInput
                        placeholder={post.is_selling ? `${t.captionPlaceholder} *` : t.captionPlaceholder}
                        placeholderTextColor="#737373"
                        value={post.caption}
                        onChangeText={(text) => onDataChange('caption', text)}
                        multiline
                        editable={!isSubmitting}
                        className="text-white text-base h-24 bg-neutral-800 rounded-lg px-4 py-3 my-4"
                        style={{ textAlignVertical: 'top' }}
                    />

                    {/* Durasi Postingan -- independen dari switch Siaran Langsung di bawah */}
                    <View className="bg-neutral-800 rounded-lg p-4">
                        <Text className="text-white font-bold mb-3">{t.durationSectionTitle}</Text>

                        <View className="flex-row bg-neutral-900 rounded-full p-1 mb-4">
                            {(['one_time', 'repeat'] as const).map((type) => {
                                const isSelected = (post.postType ?? 'one_time') === type;
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => onDataChange('postType', type)}
                                        disabled={isSubmitting}
                                        className={`flex-1 py-2 rounded-full items-center ${isSelected ? 'bg-primary' : ''}`}
                                    >
                                        <Text className={`font-bold text-sm ${isSelected ? 'text-black' : 'text-neutral-400'}`}>
                                            {type === 'one_time' ? t.postTypeOneTime : t.postTypeRepeat}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {(post.postType ?? 'one_time') === 'one_time' ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {durations.map((duration) => {
                                    const isSelected = post.postDurationId === duration.id;
                                    return (
                                        <TouchableOpacity
                                            key={duration.id}
                                            onPress={() => onDataChange('postDurationId', duration.id)}
                                            disabled={isSubmitting}
                                            style={{ backgroundColor: isSelected ? Colors.light.primary : '#262626' }}
                                            className="px-4 py-2 rounded-full mr-2"
                                        >
                                            <Text className={`font-bold text-sm ${isSelected ? 'text-black' : 'text-white'}`}>
                                                {formatDurationLabel(duration.minutes, lang)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View>
                                {ISO_DAYS.map((dayOfWeek) => {
                                    const day = scheduleForDay(dayOfWeek);
                                    const isEnabled = !!day;

                                    return (
                                        <View key={dayOfWeek} className="mb-2">
                                            <View className="flex-row justify-between items-center">
                                                <Text className="text-white font-semibold">{t.dayNames[dayOfWeek - 1]}</Text>
                                                <Switch
                                                    trackColor={{ false: "#525252", true: Colors.light.primary }}
                                                    thumbColor={isEnabled ? "white" : "#f4f3f4"}
                                                    ios_backgroundColor="#3e3e3e"
                                                    disabled={isSubmitting}
                                                    onValueChange={(value) => handleToggleDay(dayOfWeek, value)}
                                                    value={isEnabled}
                                                />
                                            </View>
                                            {day && (
                                                <View className="flex-row items-center mt-2 gap-2">
                                                    <TouchableOpacity
                                                        onPress={() => setEditingTime({ dayOfWeek, field: 'startTime' })}
                                                        disabled={isSubmitting}
                                                        className="flex-1 bg-neutral-900 rounded-lg px-3 py-2"
                                                    >
                                                        <Text className="text-neutral-400 text-xs">{t.startTimeLabel}</Text>
                                                        <Text className="text-white font-semibold">{day.startTime}</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => setEditingTime({ dayOfWeek, field: 'endTime' })}
                                                        disabled={isSubmitting}
                                                        className="flex-1 bg-neutral-900 rounded-lg px-3 py-2"
                                                    >
                                                        <Text className="text-neutral-400 text-xs">{t.endTimeLabel}</Text>
                                                        <Text className="text-white font-semibold">{day.endTime}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {editingTime && (() => {
                        const day = scheduleForDay(editingTime.dayOfWeek);
                        if (!day) return null;

                        return (
                            <View className="bg-neutral-800 rounded-lg mt-2 pb-2">
                                <DateTimePicker
                                    value={timeStringToDate(day[editingTime.field])}
                                    mode="time"
                                    is24Hour
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(_event, selectedDate) => {
                                        const stillEditing = Platform.OS === 'ios';
                                        if (selectedDate) {
                                            handleChangeDayTime(editingTime.dayOfWeek, editingTime.field, dateToTimeString(selectedDate));
                                        }
                                        if (!stillEditing) setEditingTime(null);
                                    }}
                                />
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity onPress={() => setEditingTime(null)} className="self-center bg-primary px-5 py-2 rounded-full mt-1">
                                        <Text className="text-black font-bold">{t.doneButton}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })()}

                    {/* Live Switch */}
                    <View className="flex-row justify-between items-center bg-neutral-800 rounded-lg px-4 py-3 mt-5 ">
                        <View className="flex-1 pr-3">
                            <Text className="text-white font-bold">{t.liveSwitchTitle}</Text>
                            <Text className="text-neutral-400 text-xs mt-1">
                                {post.is_live ? t.liveSwitchSubtitle : `${t.currentLocationLabel}: ${currentCity ?? '-'}, ${currentCountry ?? ''}`}
                            </Text>
                            <Text className="text-neutral-500 text-xs mt-1">
                                {t.coordinateLabel}: {latitude != null && longitude != null
                                    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                                    : t.coordinateUnavailable}
                            </Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: Colors.light.primary }}
                            thumbColor={post.is_live ? "white" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            disabled={isSubmitting}
                            onValueChange={(value) => onDataChange('is_live', value)}
                            value={post.is_live}
                        />
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default EditPostView;
