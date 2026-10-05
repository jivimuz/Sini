import { View, Text, TouchableOpacity, ImageBackground, Alert, ImageSourcePropType, FlatList, ActivityIndicator, Animated } from 'react-native'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useShowNavbar } from '@/stores/showNavBar.store'
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import Toast from '@/utils/Toast'
import { useLocationStore } from '@/stores/location.store'
import { useCurrentUser } from '@/stores/currentUser.store'
import { useLang } from '@/stores/lang.store'
import locales from './locales'
import { UserStatus } from '@/types/userStatus.type'
import { CategoryKey, CATEGORIES } from '@/constants/categories'
import { createPost } from './_api/create'
import { getPostHistory } from './_api/history'
import { endLivePost } from './_api/end-live'
import { getPostDetail } from './_api/detail'
import { togglePostLike } from './_api/like'
import { deletePost } from './_api/delete'
import { ApiError } from '../api/types'
import EditPostView from './screens/editPost'
import { useStatusStore } from '@/components/Status/stores/status.store'

/**
 * Backend mengembalikan `statusImageUrls` sebagai array string URL biasa (bukan `{uri}`),
 * sementara foto yang baru dipilih dari galeri/kamera dibungkus `{uri: asset.uri}` secara
 * lokal sebelum diunggah -- Image/ImageBackground RN butuh `{uri}`, bukan string mentah,
 * jadi harus dinormalisasi di titik render supaya kedua bentuk itu sama-sama tampil.
 */
const toImageSource = (value: ImageSourcePropType | string): ImageSourcePropType =>
    typeof value === 'string' ? { uri: value } : value;

type HistoryItemData = {
    id: string;
    post: UserStatus;
    image: ImageSourcePropType;
    date: string;
};

// --- Satu baris pada daftar "Aktif" -- gaya daftar status WhatsApp: thumbnail dengan ring
// live/aktif, info singkat, lalu tap untuk membuka detail lengkap di StatusBottomSheet
// (komponen yang sama dipakai kartu Riwayat), yang juga menyediakan tombol akhiri postingan.
const ActiveStatusListItem = ({ post, onPress, t }: {
    post: UserStatus,
    onPress: () => void,
    t: typeof locales['idID']['postScreen'],
}) => {
    const category = CATEGORIES.find((c) => c.key === post.category);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <View className="relative mr-3">
                <ImageBackground
                    source={toImageSource(post.statusImageUrls[0])}
                    resizeMode="cover"
                    style={{ borderColor: post.is_live ? '#22c55e' : (category?.color ?? '#FFD84D') }}
                    className="h-14 w-14 rounded-full overflow-hidden border-2"
                />
                <View className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full ${post.is_live ? 'bg-green-500' : 'bg-primary'}`}>
                    <Text className={`text-[9px] font-bold ${post.is_live ? 'text-white' : 'text-black'}`}>
                        {post.is_live ? t.liveBadge : t.activeBadge}
                    </Text>
                </View>
            </View>
            <View className="flex-1">
                <Text className="font-bold text-neutral-800" numberOfLines={1}>
                    {category?.name}{post.caption ? ` · ${post.caption}` : ''}
                </Text>
                <Text className="text-neutral-400 text-xs mt-0.5">
                    {typeof post.viewCount === 'number' ? `${post.viewCount} ${t.viewedBy} · ` : ''}
                    {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
    );
};

// --- Komponen untuk bagian atas saat TIDAK ada postingan aktif ---
const CreatePostView = ({ onTakePhoto, onChooseFromGallery, t }: { onTakePhoto: () => void, onChooseFromGallery: () => void, t: typeof locales['idID']['postScreen'] }) => (
    <View className="flex-1 bg-gray-100 p-5 justify-center items-center">
        <View className="w-full p-8 border-2 border-dashed border-gray-300 rounded-2xl items-center">
            <MaterialIcons name="add-a-photo" size={48} color="#9CA3AF" />
            <Text className="text-lg font-bold text-neutral-700 mt-4">{t.createTitle}</Text>
            <Text className="text-neutral-500 text-center mt-1 mb-6">{t.createSubtitle}</Text>

            <TouchableOpacity onPress={onTakePhoto} className="bg-primary h-14 w-full rounded-full flex-row items-center justify-center shadow-md mb-3">
                <Ionicons name="camera" size={22} color="black" />
                <Text className="text-black font-bold ml-3 text-base">{t.takePhoto}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onChooseFromGallery} className="bg-white h-14 w-full rounded-full flex-row items-center justify-center shadow-sm border border-gray-200">
                <Ionicons name="image" size={22} color="#4B5563" />
                <Text className="text-neutral-800 font-bold ml-3 text-base">{t.chooseFromGallery}</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// --- Komponen untuk satu item riwayat ---
const HistoryItem = ({ item, onPress, onDelete }: { item: HistoryItemData, onPress: () => void, onDelete: () => void }) => (
    <TouchableOpacity className="w-1/2 p-1.5" activeOpacity={0.9} onPress={onPress}>
        <ImageBackground
            source={item.image}
            className="h-48 w-full rounded-xl overflow-hidden p-2"
            resizeMode="cover"
        >
            <View className="px-2 py-1 rounded-full self-start" style={{ backgroundColor: item.post.color }}>
                <Text className="text-white text-xs font-semibold">
                    {CATEGORIES.find((c) => c.key === item.post.category)?.name}
                </Text>
            </View>
            <View className="flex-1 justify-end">
                <View className="flex-row justify-between items-center">
                    <View className="bg-black/40 px-2 py-1 rounded-full self-start">
                        <Text className="text-white text-xs font-semibold">{item.date}</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        {typeof item.post.viewCount === 'number' && (
                            <View className="flex-row items-center bg-black/40 px-2 py-1 rounded-full h-7">
                                <Ionicons name="eye-outline" size={12} color="white" />
                                <Text className="text-white text-xs font-semibold ml-1">{item.post.viewCount}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={onDelete}
                            activeOpacity={0.7}
                            className="bg-black/40 h-7 w-7 rounded-full items-center justify-center"
                        >
                            <Ionicons name="trash-outline" size={15} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

        </ImageBackground>
    </TouchableOpacity>
);

// --- Tab selector "Aktif" / "Riwayat" -- dua tombol terpisah (ada jarak di antaranya),
// tapi yang meluncur (geser) adalah latar PUTIH si tombol aktif itu sendiri -- bukan garis
// terpisah di bawahnya. Latar putih itu satu Animated.View yang posisinya mengikuti posisi
// asli tombol yang aktif (diukur lewat onLayout), duduk DI BELAKANG tombol; tombol yang
// sedang aktif latarnya dibuat transparan supaya putih itu kelihatan "mengisi" di baliknya,
// sementara tombol yang tidak aktif tetap punya latar abu-abu sendiri sebagai kondisi diam.
const TabBar = ({ activeTab, onChange, t }: { activeTab: 'aktif' | 'riwayat', onChange: (tab: 'aktif' | 'riwayat') => void, t: typeof locales['idID']['postScreen'] }) => {
    const layoutsRef = useRef<Record<'aktif' | 'riwayat', { x: number; width: number } | null>>({ aktif: null, riwayat: null });
    const slideLeft = useRef(new Animated.Value(0)).current;
    const slideWidth = useRef(new Animated.Value(0)).current;
    const hasMeasuredRef = useRef(false);

    const slideTo = (tab: 'aktif' | 'riwayat') => {
        const layout = layoutsRef.current[tab];
        if (!layout) return;

        if (!hasMeasuredRef.current) {
            // Lompat langsung ke posisi awal tanpa animasi -- menghindari latar putih "meluncur
            // dari pojok kiri" saat pertama kali layar dibuka, sebelum ada interaksi nyata.
            hasMeasuredRef.current = true;
            slideLeft.setValue(layout.x);
            slideWidth.setValue(layout.width);
            return;
        }

        Animated.parallel([
            Animated.spring(slideLeft, { toValue: layout.x, useNativeDriver: false, friction: 9, tension: 60 }),
            Animated.spring(slideWidth, { toValue: layout.width, useNativeDriver: false, friction: 9, tension: 60 }),
        ]).start();
    };

    useEffect(() => {
        slideTo(activeTab);
    }, [activeTab]);

    return (
        <View className="flex-row gap-3 items-center justify-center mx-4 mt-3 mb-2" style={{ position: 'relative' }}>
            <Animated.View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: slideLeft,
                    width: slideWidth,
                    backgroundColor: '#fff',
                    borderRadius: 999,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
                    shadowRadius: 3,
                    elevation: 2,
                }}
            />
            {(['aktif', 'riwayat'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                    <View
                        key={tab}
                        onLayout={(e) => {
                            const { x, width } = e.nativeEvent.layout;
                            layoutsRef.current[tab] = { x, width };
                            if (tab === activeTab) slideTo(tab);
                        }}
                        style={{ flex: 1, borderRadius: 999 }}
                    >
                        <TouchableOpacity
                            onPress={() => onChange(tab)}
                            activeOpacity={0.75}
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 999,
                                paddingVertical: 11,
                                backgroundColor: 'transparent',
                            }}
                        >
                            <Text className={`font-bold text-sm ${isActive ? 'text-black' : 'text-neutral-500'}`}>
                                {tab === 'aktif' ? t.tabActive : t.tabHistory}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            })}
        </View>
    );
};

/** Kompres satu gambar lokal lalu bungkus jadi `File` -- sama seperti pola upload avatar
 * (fetch global Expo SDK 57 butuh Blob/File asli, bukan shorthand `{uri,name,type}` lama). */
const prepareImageForUpload = async (uri: string): Promise<InstanceType<typeof File>> => {
    try {
        const manipulated = await ImageManipulator.manipulate(uri).resize({ width: 1080 }).renderAsync();
        const saved = await manipulated.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
        return new File(saved.uri);
    } catch (error) {
        console.warn('[Post] gagal mengompres foto, kirim file asli:', error);
        return new File(uri);
    }
};

const PostScreen = () => {
    const { lang } = useLang();
    const t = locales[lang].postScreen;

    // Bisa lebih dari satu postingan aktif sekaligus (misalnya satu live + satu lagi masih
    // dalam jendela durasi) -- ditampilkan sebagai FlatList vertikal yang bisa digeser.
    const [activePosts, setActivePosts] = useState<UserStatus[]>([]);
    const [postInCreation, setPostInCreation] = useState<Partial<UserStatus> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [history, setHistory] = useState<UserStatus[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [activeTab, setActiveTab] = useState<'aktif' | 'riwayat'>('aktif');

    const { setNavbar } = useShowNavbar();
    const { ensureLoaded } = useCurrentUser();
    const { latitude, longitude, currentCity, currentCountry } = useLocationStore();
    const { openStatus, closeStatus } = useStatusStore();

    const loadHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const data = await getPostHistory();
            setHistory(data);

            // Independen dari `is_live` -- postingan ditampilkan sebagai "aktif" kalau sedang
            // live ATAU masih dalam jendela waktu durasi/jadwalnya sendiri (lihat
            // Post::isCurrentlyActive() di backend). Bisa lebih dari satu sekaligus.
            const stillActive = data.filter((post) => post.is_live || post.isActive);
            setActivePosts(stillActive);
        } catch (error) {
            console.error('[Post] gagal memuat riwayat:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        ensureLoaded().catch(() => { });
        loadHistory();
    }, []);

    // Ref supaya interval di bawah selalu melihat daftar postingan aktif TERBARU tanpa perlu
    // di-restart tiap kali daftarnya berubah (lihat pola yang sama di nearby/index.tsx).
    const activePostsRef = useRef<UserStatus[]>([]);
    useEffect(() => {
        activePostsRef.current = activePosts;
    }, [activePosts]);

    // Selama ada postingan aktif, sinkronkan ulang SEMUANYA ke server tiap 30 detik -- ini yang
    // membuat jumlah penonton (viewCount) ikut bertambah saat orang lain melihatnya (lihat
    // PostController::show() di backend), bukan cuma angka statis dari saat post dibuat.
    useEffect(() => {
        const interval = setInterval(async () => {
            const current = activePostsRef.current;
            if (current.length === 0) return;

            const results = await Promise.all(
                current.map((post) => getPostDetail(post.id).catch(() => post))
            );
            setActivePosts(results.filter((post) => post.is_live || post.isActive));
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Sembunyikan navbar HANYA saat mode pembuatan/edit post (layar penuh) -- postingan
        // aktif sekarang cuma salah satu tab biasa (TabBar selalu ada), jadi navbar mengambang
        // harus tetap terlihat di tab Aktif, bukan ikut hilang hanya karena ada postingan aktif.
        setNavbar(!postInCreation);
    }, [postInCreation]);

    const handleEndPost = (post: UserStatus) => {
        Alert.alert(t.endPostConfirmTitle, t.endPostConfirmMessage, [
            { text: t.endPostConfirmCancel, style: 'cancel' },
            {
                text: t.endPostConfirmOk,
                style: 'destructive',
                onPress: async () => {
                    try {
                        await endLivePost(post.id);
                        setActivePosts((prev) => prev.filter((p) => p.id !== post.id));
                        // Ditutup di sini karena tombol "Akhiri Postingan" ini cuma bisa dipencet
                        // dari dalam StatusBottomSheet yang sedang menampilkan postingan ini.
                        closeStatus();
                        Toast.success(t.endPostSuccess);
                        loadHistory();
                    } catch {
                        Toast.error(t.endPostError);
                    }
                },
            },
        ]);
    };

    const handleDeletePost = (post: UserStatus) => {
        Alert.alert(t.deleteConfirmTitle, t.deleteConfirmMessage, [
            { text: t.deleteConfirmCancel, style: 'cancel' },
            {
                text: t.deleteConfirmOk,
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deletePost(post.id);
                        setHistory((prev) => prev.filter((p) => p.id !== post.id));
                        Toast.success(t.deleteSuccess);
                    } catch {
                        Toast.error(t.deleteError);
                    }
                },
            },
        ]);
    };

    // Dipakai sebagai `onToggleLike` dari kartu Aktif (langsung) dan dari StatusBottomSheet saat
    // dibuka dari kartu Riwayat -- sinkronkan state lokal manapun yang cocok (salah satu dari
    // activePosts atau salah satu item history), sama seperti pola optimistic-update di nearby/index.tsx.
    const handleToggleLike = async (post: UserStatus) => {
        const wasLiked = post.is_liked;
        const previousCount = post.like_count;

        const applyLike = (isLiked: boolean, likeCount: number) => {
            setActivePosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_liked: isLiked, like_count: likeCount } : p)));
            setHistory((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_liked: isLiked, like_count: likeCount } : p)));
        };

        applyLike(!wasLiked, previousCount + (wasLiked ? -1 : 1));

        try {
            const result = await togglePostLike(post.id);
            applyLike(result.isLiked, result.likeCount);
        } catch {
            applyLike(wasLiked, previousCount);
        }
    };

    const handleConfirmPost = async () => {
        if (!postInCreation) return;

        if (!latitude || !longitude) {
            Toast.error(t.postErrorTitle, t.locationNotFoundError);
            return;
        }

        const postType = postInCreation.postType ?? 'one_time';
        if (postType === 'one_time' && !postInCreation.postDurationId) {
            Toast.error(t.postErrorTitle, t.durationRequiredError);
            return;
        }
        if (postType === 'repeat' && !postInCreation.schedule?.length) {
            Toast.error(t.postErrorTitle, t.scheduleRequiredError);
            return;
        }

        setIsSubmitting(true);

        try {
            const images = postInCreation.statusImageUrls ?? [];
            const formData = new FormData();

            for (const image of images) {
                const uri = (image as { uri?: string }).uri;
                if (!uri) continue;
                const file = await prepareImageForUpload(uri);
                formData.append('images[]', file as unknown as Blob);
            }

            formData.append('caption', postInCreation.caption || '');
            formData.append('category', postInCreation.category || 'chill');
            formData.append('latitude', String(latitude));
            formData.append('longitude', String(longitude));
            // Laravel's `boolean` validation rule only accepts true/false/0/1/'0'/'1' --
            // NOT the strings "true"/"false" that String(bool) would produce, and every
            // multipart field arrives as a string regardless, so this must be '1'/'0'.
            formData.append('isLive', postInCreation.is_live ? '1' : '0');
            formData.append('isSelling', postInCreation.is_selling ? '1' : '0');
            if (postInCreation.title) formData.append('title', postInCreation.title);
            if (postInCreation.price) formData.append('price', String(postInCreation.price));
            if (postInCreation.aspect_ratio) {
                formData.append('aspectRatio[]', String(postInCreation.aspect_ratio[0]));
                formData.append('aspectRatio[]', String(postInCreation.aspect_ratio[1]));
            }
            formData.append('locationName', currentCity ? `${currentCity}, ${currentCountry ?? ''}`.trim() : t.nearYou);

            // Independen dari `isLive` di atas -- menentukan tab "Aktif"/"Riwayat" di Post screen.
            formData.append('postType', postType);
            if (postType === 'one_time' && postInCreation.postDurationId) {
                formData.append('postDurationId', postInCreation.postDurationId);
            }
            if (postType === 'repeat' && postInCreation.schedule) {
                postInCreation.schedule.forEach((day, index) => {
                    formData.append(`schedule[${index}][dayOfWeek]`, String(day.dayOfWeek));
                    formData.append(`schedule[${index}][startTime]`, day.startTime);
                    formData.append(`schedule[${index}][endTime]`, day.endTime);
                });
            }

            const created = await createPost(formData);

            if (created.is_live || created.isActive) {
                setActivePosts((prev) => [created, ...prev]);
            }
            setHistory((prev) => [created, ...prev]);
            setPostInCreation(null);
            Toast.success(t.postSuccess);
        } catch (error) {
            if (error instanceof ApiError && error.status === 413) {
                Toast.error(t.postErrorTitle, t.imageTooLargeError);
            } else if (error instanceof ApiError) {
                Toast.error(t.postErrorTitle, `${error.message} (${error.status})`);
            } else {
                console.error('[Post] gagal membuat postingan:', error);
                Toast.error(t.postErrorTitle, t.postGenericError);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelCreation = () => {
        setPostInCreation(null);
    };

    const handleDataChange = (field: keyof UserStatus, value: any) => {
        if (postInCreation) {
            const updatedPost = { ...postInCreation, [field]: value };

            // Logika tambahan saat kategori diubah
            if (field === 'category') {
                const categoryKey = value as CategoryKey;
                updatedPost.color = CATEGORIES.find(c => c.key === categoryKey)?.color;
                updatedPost.is_selling = categoryKey === 'selling';
                if (!updatedPost.is_selling) {
                    updatedPost.price = null;
                    updatedPost.title = '';
                }
            }

            setPostInCreation(updatedPost);
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Toast.info(t.cameraPermissionTitle, t.cameraPermissionMessage);
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [9, 16], // Default ke portrait, pengguna bisa krop
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            const asset = result.assets[0];
            const newPost: Partial<UserStatus> = {
                id: `post-${Date.now()}`,
                statusImageUrls: [{ uri: asset.uri }],
                aspect_ratio: [asset.width, asset.height],
                caption: '',
                title: '',
                category: 'chill',
                color: CATEGORIES.find(c => c.key === 'chill')?.color,
                is_live: false,
                is_selling: false,
                price: null,
                postType: 'one_time',
            };
            setPostInCreation(newPost);
        }
    };

    // FAB di tab Aktif saat sudah ada postingan aktif -- CreatePostView (dua tombol besar)
    // cuma tampil waktu belum ada yang aktif sama sekali, jadi ini satu-satunya jalan untuk
    // menambah postingan BARU selagi yang lain masih aktif.
    const handleAddStatusPress = () => {
        Alert.alert(t.addStatusTitle, t.addStatusMessage, [
            { text: t.addStatusCancel, style: 'cancel' },
            { text: t.takePhoto, onPress: handleTakePhoto },
            { text: t.chooseFromGallery, onPress: handleChooseFromGallery },
        ]);
    };

    const handleChooseFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.info(t.galleryPermissionTitle, t.galleryPermissionMessage);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true, // Izinkan memilih banyak foto
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const firstAsset = result.assets[0];
            const newPost: Partial<UserStatus> = {
                id: `post-${Date.now()}`,
                statusImageUrls: result.assets.map(asset => ({ uri: asset.uri })),
                // Gunakan rasio aspek dari gambar pertama untuk konsistensi
                aspect_ratio: [firstAsset.width, firstAsset.height],
                caption: '',
                title: '',
                category: 'chill',
                color: CATEGORIES.find(c => c.key === 'chill')?.color,
                is_live: false,
                is_selling: false,
                price: null,
                postType: 'one_time',
            };
            setPostInCreation(newPost);
        }
    };

    const historyItems: HistoryItemData[] = useMemo(() => {
        return history
            // Postingan yang sedang aktif tampil di tab "Aktif" sendiri -- jangan dobel di sini.
            .filter((post) => !(post.is_live || post.isActive))
            .filter((post) => post.statusImageUrls && post.statusImageUrls.length > 0)
            .map((post) => ({
                id: post.id,
                post,
                image: toImageSource(post.statusImageUrls[0]),
                date: new Date(post.created_at).toLocaleDateString(lang === 'idID' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short' }),
            }));
    }, [history, lang]);

    if (postInCreation) {
        return (
            <EditPostView
                post={postInCreation}
                onPost={handleConfirmPost}
                onCancel={handleCancelCreation}
                onDataChange={handleDataChange}
                isSubmitting={isSubmitting}
            />
        );
    }
    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'left', 'right']}>
            <TabBar activeTab={activeTab} onChange={setActiveTab} t={t} />

            {activeTab === 'aktif' ? (
                <View className="flex-1 bg-white">
                    {activePosts.length > 0 ? (
                        <FlatList
                            key="active-posts-list"
                            data={activePosts}
                            keyExtractor={(post) => post.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            renderItem={({ item }) => (
                                <ActiveStatusListItem
                                    post={item}
                                    t={t}
                                    onPress={() => openStatus(item, handleToggleLike, () => handleEndPost(item), true)}
                                />
                            )}
                        />
                    ) : (
                        <CreatePostView onTakePhoto={handleTakePhoto} onChooseFromGallery={handleChooseFromGallery} t={t} />
                    )}
                    {activePosts.length > 0 && (
                        // FloatingNavbar: bottom:25 + height:65 (lihat FloatingNavbar.tsx) -- jadi
                        // tepi atasnya ada di 90px dari bawah layar. +20px gap = bottom-[110px] di sini.
                        <TouchableOpacity
                            onPress={handleAddStatusPress}
                            activeOpacity={0.8}
                            className="absolute bottom-[110px] right-5 h-14 w-14 rounded-full bg-primary items-center justify-center shadow-lg"
                        >
                            <Ionicons name="add" size={28} color="black" />
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View className="flex-1 bg-white rounded-t-3xl">
                    {isLoadingHistory ? (
                        <View className="py-8 items-center">
                            <ActivityIndicator color="#FFD84D" />
                        </View>
                    ) : historyItems.length === 0 ? (
                        <Text className="text-neutral-400 text-center py-8">{t.historyEmpty}</Text>
                    ) : (
                        <FlatList
                            key="history-grid"
                            data={historyItems}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            contentContainerStyle={{ padding: 10.5, paddingBottom: 100 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <HistoryItem
                                    item={item}
                                    onPress={() => openStatus(item.post, handleToggleLike, undefined, true)}
                                    onDelete={() => handleDeletePost(item.post)}
                                />
                            )}
                        />
                    )}
                </View>
            )}
        </SafeAreaView>
    )
}

export default PostScreen
