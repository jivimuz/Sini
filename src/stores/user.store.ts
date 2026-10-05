import { create } from 'zustand';
import { ImageSourcePropType } from 'react-native';
import { CategoryKey, CATEGORIES, ALL_CATEGORIES } from '@/constants/categories';
import { UserStatus } from '@/types/userStatus.type';

// Tipe data ini menggabungkan info pengguna dan status terakhirnya


interface UserState {
    users: UserStatus[];
    fetchUsers: (userLat: number, userLon: number) => void;
    getUserById: (id: string) => UserStatus | undefined;
    toggleLike: (id: string) => void;
    addStatus: (status: UserStatus) => void;
}

// Helper untuk menghasilkan titik acak dalam radius tertentu
const generateRandomPoint = (center: { lat: number, lon: number }, radius: number): { latitude: number, longitude: number } => {
    const y0 = center.lat;
    const x0 = center.lon;
    const rd = radius / 111300; // Konversi radius dari meter ke derajat
    const u = Math.random();
    const v = Math.random();
    const w = rd * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);
    const new_x = x / Math.cos(y0 * Math.PI / 180);
    return { latitude: y0 + y, longitude: x0 + new_x };
};

// Data dummy yang akan digunakan di seluruh aplikasi
const dummyStatusData = [
    { caption: "Menikmati suasana kota hari ini! ✨", images: [require('@/../assets/images/dummy/images-1.jpeg'), require('@/../assets/images/dummy/images-2.jpeg')], location: "Grand Indonesia" },
    { caption: "Perjalanan pulang kerja, langitnya bagus!", images: [require('@/../assets/images/dummy/images-2.jpeg')], location: "Jalan Sudirman" },
    { caption: "Golden hour di rumah 🌅", images: [require('@/../assets/images/dummy/images-3.jpeg'), require('@/../assets/images/dummy/images-4.jpeg'), require('@/../assets/images/dummy/images-1.jpeg')], location: "Rumah" },
    { caption: "OTW cari makan malem.", images: [require('@/../assets/images/dummy/images-4.jpeg')], location: "Sekitar Blok M" },
    { caption: "Kopi sore ☕️", images: [require('@/../assets/images/dummy/images-1.jpeg'), require('@/../assets/images/dummy/images-1.jpeg')], location: "Starbucks" },
    { caption: "Lagi di event jejepangan~", images: [require('@/../assets/images/dummy/images-2.jpeg'), require('@/../assets/images/dummy/images-2.jpeg')], location: "GBK" },
    { caption: "Macet banget!", images: [require('@/../assets/images/dummy/images-3.jpeg'), require('@/../assets/images/dummy/images-3.jpeg')], location: "Gatot Subroto" },
    { caption: "Belajar buat ujian besok.", images: [require('@/../assets/images/dummy/images-4.jpeg')], location: "Perpustakaan" },
    { caption: "Nonton konser, seru!!", images: [require('@/../assets/images/dummy/images-1.jpeg')], location: "ICE BSD" },
    { caption: "Akhirnya weekend! Mau jalan-jalan! Coba deh! Akhirnya weekend! Mau jalan-jalan! Coba deh!", images: [require('@/../assets/images/dummy/images-2.jpeg')], location: "Pantai Ancol" },
];

export const useUserStore = create<UserState>((set, get) => ({
    users: [],
    // Di masa depan, di sinilah Anda akan memanggil API
    fetchUsers: (userLat, userLon) => {
        if (get().users.length > 0) return; // Mencegah fetch ulang jika data sudah ada

        const dummyData: UserStatus[] = [];
        const names = ["Joko", "Budi", "Siti", "Ani", "Eka", "Dwi", "Tri", "Catur", "Panca", "Satya"];
        const sellingItems = ["Laptop", "Sepeda", "Kamera", "Baju", "Jam Tangan", "Tas", "Headphone", "Speaker", "Smartphone", "Kursi"];
        const categories = ALL_CATEGORIES;

        for (let i = 0; i < 10; i++) {
            const randomCategory = categories[i % categories.length];
            const randomLocation = generateRandomPoint({ lat: userLat, lon: userLon }, 2000);
            const randomPastDate = new Date();
            randomPastDate.setHours(randomPastDate.getHours() - Math.random() * 24);
            const statusInfo = dummyStatusData[i % dummyStatusData.length];
            const isSelling = randomCategory === 'selling';

            dummyData.push({
                id: `user-${i}`,
                customerId: `user-${i}`,
                ...randomLocation,
                name: names[i % names.length],
                avatarUrl: `https://i.pravatar.cc/150?u=user${i}`,
                category: randomCategory as CategoryKey,
                color: CATEGORIES.find(c => c.key === randomCategory)?.color || '#000000',
                created_at: randomPastDate.toISOString(),
                is_live: i % 2 === 0,
                aspect_ratio: [9, 16], // Menambahkan aspect ratio default
                is_liked: false,
                is_selling: isSelling,
                price: isSelling ? Math.floor(Math.random() * 1000000) : null,
                currency_symbol: 'Rp',
                like_count: Math.floor(Math.random() * 100),
                title: isSelling ? sellingItems[i % sellingItems.length] : null,
                caption: statusInfo.caption,
                statusImageUrls: statusInfo.images,
                location_name: statusInfo.location,
            });
        }
        set({ users: dummyData });
    },
    getUserById: (id: string) => {
        return get().users.find(user => user.id === id);
    },
    toggleLike: (id: string) => {
        set((state) => ({
            users: state.users.map(user => {
                if (user.id === id) {
                    const newIsLiked = !user.is_liked;
                    const newLikeCount = newIsLiked ? (user.like_count ?? 0) + 1 : (user.like_count ?? 1) - 1;
                    return { ...user, is_liked: newIsLiked, like_count: newLikeCount };
                }
                return user;
            })
        }))
    },
    addStatus: (status: UserStatus) => {
        set((state) => ({
            users: [status, ...state.users]
        }));
    },
}));