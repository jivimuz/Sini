import { View, Text, TouchableOpacity, ScrollView, ImageBackground, Alert, ImageSourcePropType } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useShowNavbar } from '@/stores/showNavBar.store'
import * as ImagePicker from 'expo-image-picker';
import Toast from '@/utils/Toast'
import { useUserStore } from '@/stores/user.store'
import { useLocationStore } from '@/stores/location.store'
import { UserStatus } from '@/types/userStatus.type'
import { CategoryKey, CATEGORIES } from '@/constants/categories'
import EditPostView from './screens/editPost'
import Animated, { Extrapolation, FadeInDown, FadeOutUp, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

// Tipe untuk post yang aktif, menambahkan expiresIn untuk tampilan
type ActivePost = UserStatus & { expiresIn: string };

type HistoryItemData = {
    id: string;
    image: ImageSourcePropType;
    date: string;
};

// Data tiruan untuk riwayat postingan
const dummyHistory: HistoryItemData[] = [
    { id: 'hist-1', image: require('@/../assets/images/dummy/images-2.jpeg'), date: 'Kemarin' },
    { id: 'hist-2', image: require('@/../assets/images/dummy/images-3.jpeg'), date: '2 hari lalu' },
    { id: 'hist-3', image: require('@/../assets/images/dummy/images-4.jpeg'), date: '5 hari lalu' },
    { id: 'hist-4', image: require('@/../assets/images/dummy/images-1.jpeg'), date: '1 minggu lalu' },
];

// --- Komponen untuk bagian atas saat ada postingan aktif ---
const ActivePostView = ({ post, onEndPost }: { post: ActivePost, onEndPost: () => void }) => {


    // Hitung rasio aspek dari data post, atau gunakan default jika tidak ada
    const imageAspectRatio = post.aspect_ratio ? post.aspect_ratio[0] / post.aspect_ratio[1] : 9 / 16;

    return (
        <View className="flex-1 bg-neutral-800 items-center justify-center">
            {/* Container ini akan memiliki rasio aspek yang benar */}
            <View style={{ width: '100%', aspectRatio: imageAspectRatio }}>
                <ImageBackground source={post.statusImageUrl} resizeMode="cover" className="flex-1 justify-between p-5">
                    {/* Header */}
                    <View className="flex-row justify-between items-center">
                        <Text className="text-white font-bold text-lg">Postingan Aktif</Text>
                        <View className="bg-green-500 px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-bold">LIVE</Text>
                        </View>
                    </View>

                    {/* Konten */}
                    <View>
                        <Text className="text-white text-2xl font-bold shadow-lg">{post.caption}</Text>
                        <Text className="text-yellow-300 text-sm font-semibold mt-1 shadow-md">Berakhir dalam {post.expiresIn}</Text>
                        <TouchableOpacity
                            onPress={onEndPost}
                            className="bg-red-500/90 mt-4 h-12 rounded-full flex-row items-center justify-center shadow-lg"
                        >
                            <Ionicons name="stop-circle-outline" size={22} color="white" />
                            <Text className="text-white font-bold ml-2">Akhiri Postingan</Text>
                        </TouchableOpacity>
                    </View>
                </ImageBackground>
            </View>
        </View>
    );
};

// --- Komponen untuk bagian atas saat TIDAK ada postingan aktif ---
const CreatePostView = ({ onTakePhoto, onChooseFromGallery }: { onTakePhoto: () => void, onChooseFromGallery: () => void }) => (
    <View className="flex-1 bg-gray-100 p-5 justify-center items-center">
        <View className="w-full p-8 border-2 border-dashed border-gray-300 rounded-2xl items-center">
            <MaterialIcons name="add-a-photo" size={48} color="#9CA3AF" />
            <Text className="text-lg font-bold text-neutral-700 mt-4">Buat Postingan Baru</Text>
            <Text className="text-neutral-500 text-center mt-1 mb-6">Bagikan momen atau informasi di sekitarmu.</Text>

            <TouchableOpacity onPress={onTakePhoto} className="bg-primary h-14 w-full rounded-full flex-row items-center justify-center shadow-md mb-3">
                <Ionicons name="camera" size={22} color="black" />
                <Text className="text-black font-bold ml-3 text-base">Ambil Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onChooseFromGallery} className="bg-white h-14 w-full rounded-full flex-row items-center justify-center shadow-sm border border-gray-200">
                <Ionicons name="image" size={22} color="#4B5563" />
                <Text className="text-neutral-800 font-bold ml-3 text-base">Pilih dari Galeri</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// --- Komponen untuk satu item riwayat ---
const HistoryItem = ({ item }: { item: HistoryItemData }) => (
    <TouchableOpacity className="w-1/2 p-1.5">
        <ImageBackground
            source={item.image}
            className="h-48 w-full rounded-xl overflow-hidden justify-end p-2"
            resizeMode="cover"
        >
            <View className="bg-black/40 px-2 py-1 rounded-full self-start">
                <Text className="text-white text-xs font-semibold">{item.date}</Text>
            </View>
        </ImageBackground>
    </TouchableOpacity>
);

const PostScreen = () => {
    // State untuk menentukan apakah ada postingan aktif.
    // Di aplikasi nyata, ini akan berasal dari global store atau API.
    const [activePost, setActivePost] = useState<ActivePost | null>(null);
    const [postInCreation, setPostInCreation] = useState<Partial<UserStatus> | null>(null);
    const { setNavbar } = useShowNavbar();
    const { addStatus } = useUserStore();
    const { latitude, longitude } = useLocationStore();
    const scrollY = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const headerAnimatedStyle = useAnimatedStyle(() => {

        const height = interpolate(
            scrollY.value,
            [0, 250],
            [420, 0],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollY.value,
            [0, 100],
            [1, 0],
            Extrapolation.CLAMP
        );

        const translateY = interpolate(
            scrollY.value,
            [0, 150],
            [0, 150],
            Extrapolation.CLAMP
        );

        return {
            height,
            opacity,
            transform: [
                {
                    translateY,
                },
            ],
            overflow: "hidden",
        };
    });
    useEffect(() => {
        // Sembunyikan navbar saat dalam mode pembuatan atau edit post
        if (postInCreation || activePost) {
            setNavbar(false);
        } else {
            setNavbar(true);
        }
    }, [postInCreation, activePost]);

    const handleEndPost = () => {
        // Logika untuk mengakhiri postingan
        setActivePost(null);
    };

    const handleConfirmPost = () => {
        if (postInCreation) {
            if (!latitude || !longitude) {
                Toast.error('Gagal Posting', 'Lokasi tidak ditemukan. Pastikan GPS Anda aktif.');
                return;
            }

            // Mock data pengguna saat ini (ganti dengan data dari state auth Anda)
            const currentUser = {
                name: 'Jivi Muz',
                avatarUrl: 'https://i.pravatar.cc/200',
            };

            const finalPost: UserStatus = {
                id: postInCreation.id!,
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl,
                latitude: latitude,
                longitude: longitude,
                category: postInCreation.category || 'chill',
                color: postInCreation.color || CATEGORIES.find(c => c.key === 'chill')?.color || '#E57373',
                aspect_ratio: postInCreation.aspect_ratio || [9, 16],
                is_live: postInCreation.is_live || false,
                created_at: new Date().toISOString(),
                statusImageUrl: postInCreation.statusImageUrl!,
                title: postInCreation.title || null,
                caption: postInCreation.caption || '',
                location_name: 'Dekat Anda', // Bisa diganti dengan hasil reverse geocoding
                is_liked: false,
                is_selling: postInCreation.is_selling || false,
                price: postInCreation.price ? Number(postInCreation.price) : null,
                currency_symbol: 'Rp',
                like_count: 0,
            };

            addStatus(finalPost);
            setActivePost({ ...finalPost, expiresIn: '8 jam' });
            setPostInCreation(null);
            Toast.success('Postingan berhasil dibuat!');
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

    // Helper untuk menampilkan pilihan rasio aspek
    const chooseAspectRatio = (callback: (aspect: [number, number]) => void) => {
        Alert.alert(
            'Pilih Rasio Aspek',
            'Pilih rasio aspek untuk krop foto Anda.',
            [
                { text: 'Portrait (9:16)', onPress: () => callback([9, 16]) },
                { text: 'Square (1:1)', onPress: () => callback([1, 1]) },
                { text: 'Classic (4:5)', onPress: () => callback([4, 5]) },
                { text: 'Batal', style: 'cancel' },
            ],
            { cancelable: true }
        );
    };

    const handleTakePhoto = () => {
        chooseAspectRatio(async (aspect) => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Toast.info('Izin Diperlukan', 'Anda perlu memberikan izin kamera untuk mengambil foto.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: aspect,
                quality: 0.8,
            });

            if (!result.canceled) {
                const newPost: Partial<UserStatus> = {
                    id: `post-${Date.now()}`,
                    statusImageUrl: { uri: result.assets[0].uri },
                    aspect_ratio: aspect,
                    caption: '',
                    title: '',
                    category: 'chill', // Kategori default
                    color: CATEGORIES.find(c => c.key === 'chill')?.color,
                    is_live: false,
                    is_selling: false,
                    price: null,
                };
                setPostInCreation(newPost);
            }
        });
    };

    const handleChooseFromGallery = () => {
        chooseAspectRatio(async (aspect) => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Toast.info('Izin Diperlukan', 'Anda perlu memberikan izin galeri untuk memilih foto.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: aspect,
                quality: 0.8,
            });

            if (!result.canceled) {
                const newPost: Partial<UserStatus> = {
                    id: `post-${Date.now()}`,
                    statusImageUrl: { uri: result.assets[0].uri },
                    aspect_ratio: aspect,
                    caption: '',
                    title: '',
                    category: 'chill', // Kategori default
                    color: CATEGORIES.find(c => c.key === 'chill')?.color,
                    is_live: false,
                    is_selling: false,
                    price: null,
                };
                setPostInCreation(newPost);
            }
        });
    };
    if (postInCreation) {
        return (
            <EditPostView
                post={postInCreation}
                onPost={handleConfirmPost}
                onCancel={handleCancelCreation}
                onDataChange={handleDataChange}
            />
        );
    }
    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={activePost ? [] : ['top', 'left', 'right']}>
            {/* View ini membagi layar menjadi ge bagian */}
            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                {/* --- BAGIAN ATAS --- */}
                <Animated.View
                    style={headerAnimatedStyle}
                >
                    {activePost ? (
                        <ActivePostView post={activePost} onEndPost={handleEndPost} />
                    ) : (
                        <CreatePostView onTakePhoto={handleTakePhoto} onChooseFromGallery={handleChooseFromGallery} />
                    )}
                </Animated.View>

                {/* --- BAGIAN BAWAH --- */}
                <View className="flex-1 bg-gray-100">
                    <View className="flex-1 bg-white p-4 rounded-t-3xl mt-4 pb-28">
                        <Text className="text-center mb-3">___</Text>
                        <Text className="text-xl font-bold text-neutral-800 mb-3">Riwayat Postingan</Text>
                        {!postInCreation && (

                            <View className="flex-row flex-wrap -mx-1.5">
                                {dummyHistory.map(item => (
                                    <HistoryItem key={item.id} item={item} />
                                ))}
                                {dummyHistory.map(item => (
                                    <HistoryItem key={item.id} item={item} />
                                ))}
                                {dummyHistory.map(item => (
                                    <HistoryItem key={item.id} item={item} />
                                ))}
                                {dummyHistory.map(item => (
                                    <HistoryItem key={item.id} item={item} />
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </Animated.ScrollView>
        </SafeAreaView >
    )
}

export default PostScreen