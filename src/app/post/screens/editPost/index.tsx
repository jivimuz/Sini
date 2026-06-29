import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, Switch } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { UserStatus } from '@/types/userStatus.type'
import { CategoryKey, CATEGORIES, ALL_CATEGORIES } from '@/constants/categories'
import { Colors } from '@/constants/theme'
import { SafeAreaView } from 'react-native-safe-area-context'

// --- Komponen untuk halaman edit setelah memilih gambar ---
const EditPostView = ({ post, onPost, onCancel, onDataChange }: { post: Partial<UserStatus>, onPost: () => void, onCancel: () => void, onDataChange: (field: keyof UserStatus, value: any) => void }) => {
    const availableCategories = ALL_CATEGORIES.filter(cat => cat !== 'all');
    // Hitung rasio aspek dari data post, atau gunakan default jika tidak ada
    const imageAspectRatio = post.aspect_ratio ? post.aspect_ratio[0] / post.aspect_ratio[1] : 9 / 16;

    return (
        <SafeAreaView className="flex-1 bg-neutral-900" edges={['top', 'left', 'right']}>
            {/* Header */}
            <View className="flex-row justify-between items-center p-4">
                <TouchableOpacity onPress={onCancel}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">Edit Postingan</Text>
                <TouchableOpacity onPress={onPost} className="bg-primary px-5 py-2 rounded-full">
                    <Text className="text-black font-bold">Post</Text>
                </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
                {/* Image Preview */}
                <View className="p-4">
                    <Image
                        source={post.statusImageUrl}
                        style={{ width: '100%', aspectRatio: imageAspectRatio, borderRadius: 12 }}
                        resizeMode="cover"
                    />
                </View>

                {/* Input Fields Container */}
                <View className="px-4 pb-8 space-y-5">
                    {/* Category Selector */}
                    <View>
                        <Text className="text-neutral-400 text-sm font-semibold mb-2">Kategori</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {availableCategories.map(catKey => {
                                const category = CATEGORIES.find(c => c.key === catKey);
                                const isSelected = post.category === catKey;
                                return (
                                    <TouchableOpacity
                                        key={catKey}
                                        onPress={() => onDataChange('category', catKey)}
                                        style={{ backgroundColor: isSelected ? category?.color : '#262626' }}
                                        className="px-4 py-2 rounded-full mr-2"
                                    >
                                        <Text className="text-white font-bold text-sm">{category?.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Title Input (terutama untuk jualan) */}
                    {post.is_selling && (
                        <TextInput
                            placeholder="Judul/Nama Barang"
                            placeholderTextColor="#737373"
                            value={post.title || ''}
                            onChangeText={(text) => onDataChange('title', text)}
                            className="text-white text-base bg-neutral-800 rounded-lg px-4 py-3"
                        />
                    )}

                    {/* Price Input (hanya jika jualan) */}
                    {post.is_selling && (
                        <View className="flex-row items-center bg-neutral-800 rounded-lg px-4">
                            <Text className="text-white font-bold mr-2">Rp</Text>
                            <TextInput
                                placeholder="Harga"
                                placeholderTextColor="#737373"
                                value={post.price ? String(post.price) : ''}
                                onChangeText={(text) => onDataChange('price', text.replace(/[^0-9]/g, ''))}
                                keyboardType="numeric"
                                className="text-white text-base py-3 flex-1"
                            />
                        </View>
                    )}

                    {/* Caption Input */}
                    <TextInput
                        placeholder="Tulis caption..."
                        placeholderTextColor="#737373"
                        value={post.caption}
                        onChangeText={(text) => onDataChange('caption', text)}
                        multiline
                        className="text-white text-base h-24 bg-neutral-800 rounded-lg px-4 py-3"
                        style={{ textAlignVertical: 'top' }}
                    />

                    {/* Live Toggle */}
                    <View className="flex-row justify-between items-center bg-neutral-800 rounded-lg px-4 py-3">
                        <View>
                            <Text className="text-white font-bold">Postingan Live</Text>
                            <Text className="text-neutral-400 text-xs mt-1">Akan berkedip di peta & muncul di atas</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: Colors.light.primary }}
                            thumbColor={post.is_live ? "white" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={(value) => onDataChange('is_live', value)}
                            value={post.is_live}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
};

export default EditPostView;
