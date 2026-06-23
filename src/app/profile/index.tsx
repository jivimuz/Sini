import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Lang, useLang } from '@/hooks/useLang'
import locales from './_locales'

const ProfileScreen = () => {
    const { lang, setLang } = useLang();
    const t = locales[lang].profileScreen;

    // Komponen tombol bahasa yang bisa digunakan kembali
    const LanguageButton = ({ targetLang, label }: { targetLang: Lang, label: string }) => (
        <TouchableOpacity
            onPress={() => setLang(targetLang)}
            className={`flex-1 p-3 rounded-lg border ${lang === targetLang ? 'bg-blue-600 border-blue-600' : 'bg-gray-100 border-gray-200'}`}
        >
            <Text className={`text-center font-semibold ${lang === targetLang ? 'text-white' : 'text-gray-800'}`}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-5">
                <Text className="text-3xl font-bold text-gray-900 mb-8">{t.title}</Text>

                <View className="bg-white p-4 rounded-xl shadow-sm">
                    <Text className="text-lg font-semibold text-gray-800">{t.languageSection.title}</Text>
                    <Text className="text-sm text-gray-500 mt-1 mb-4">{t.languageSection.description}</Text>
                    <View className="flex-row space-x-3">
                        <LanguageButton targetLang="idID" label={t.languageSection.id} />
                        <LanguageButton targetLang="enGB" label={t.languageSection.en} />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default ProfileScreen