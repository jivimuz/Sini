import { useIsAppReady } from '@/stores/app.store';
import { useLang } from '@/stores/lang.store';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LanguageSwitchProps {
    style?: any;
    className?: string;
}

export const LanguageSwitch = ({ style, className = "" }: LanguageSwitchProps) => {
    const { lang, setLang } = useLang();
    const { setIsAppReady } = useIsAppReady(); // Mengambil state isAppReady dari store lang.store
    // HAPUS pemanggilan setIsAppReady(false) agar tidak memicu unmount pada navigasi utama
    const handleLangChange = () => {
        const nextLang = lang === 'idID' ? 'enGB' : 'idID';
        setLang(nextLang);
        setIsAppReady(false); // Set isAppReady ke false saat bahasa berubah

    };

    return (
        // Menggabungkan class bawaan dengan class kustom dari props secara aman menggunakan string template
        <View className={`${className}`} style={style}>
            <TouchableOpacity
                onPress={handleLangChange}
                activeOpacity={0.8}
                className="flex-row bg-gray-200 p-1 rounded-full w-[76px] h-[30px]"
            >
                {/* Badge ID */}
                <View className={`flex-1 justify-center items-center rounded-full ${lang === 'idID' ? 'bg-[#132648] shadow-sm elevation-1' : 'bg-transparent'}`}>
                    <Text className={`text-[11px] font-bold ${lang === 'idID' ? 'text-white' : 'text-gray-500'}`}>
                        ID
                    </Text>
                </View>

                {/* Badge EN */}
                <View className={`flex-1 justify-center items-center rounded-full ${lang === 'enGB' ? 'bg-[#132648] shadow-sm elevation-1' : 'bg-transparent'}`}>
                    <Text className={`text-[11px] font-bold ${lang === 'enGB' ? 'text-white' : 'text-gray-500'}`}>
                        EN
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};
