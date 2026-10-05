import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLang } from '@/stores/lang.store';
import locales from '../locales';
import Toast from '@/utils/Toast';
import { getMe } from '../api/me';
import { updateProfile } from '../api/update';
import { ApiError } from '../../api/types';

const extractFirstValidationError = (error: ApiError): string | undefined => {
    const errors = (error.details as { errors?: Record<string, string[]> } | undefined)?.errors;
    return errors ? Object.values(errors)[0]?.[0] : undefined;
};

type FieldProps = {
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText?: (value: string) => void;
    editable?: boolean;
    multiline?: boolean;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
};

const Field = ({ icon, placeholder, value, onChangeText, editable = true, multiline = false, keyboardType = 'default' }: FieldProps) => (
    <View
        className={`bg-neutral-50 border border-neutral-100 rounded-2xl px-4 mb-4 flex-row ${multiline ? 'items-start py-3' : 'items-center h-14'} ${!editable ? 'opacity-60' : ''}`}
    >
        <Ionicons name={icon} size={20} color="#9CA3AF" style={multiline ? { marginTop: 2 } : undefined} />
        <TextInput
            className="text-neutral-900 ml-3 text-sm flex-1"
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            keyboardType={keyboardType}
            autoCapitalize="none"
            textAlignVertical={multiline ? 'top' : 'center'}
        />
    </View>
);

export default function EditProfileScreen() {
    const { lang } = useLang();
    const t = locales[lang].editProfileScreen;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        let isMounted = true;

        getMe()
            .then((data) => {
                if (!isMounted) return;
                setEmail(data.email ?? '');
                setName(data.name ?? '');
                setUsername(data.username ?? '');
                setBio(data.bio ?? '');
                setPhone(data.phone ?? '');
            })
            .catch(() => {
                if (!isMounted) return;
                Toast.error(t.loadErrorTitle, t.loadErrorMessage);
                router.back();
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSave = async () => {
        setErrorMessage('');

        if (!name.trim() || !username.trim()) {
            setErrorMessage(t.requiredFieldsError);
            return;
        }

        setIsSubmitting(true);

        try {
            await updateProfile({
                name: name.trim(),
                username: username.trim(),
                bio: bio.trim() || undefined,
                phone: phone.trim() || undefined,
            });
            Toast.success(t.saveSuccess);
            router.back();
        } catch (error) {
            if (error instanceof ApiError && error.status === 422) {
                setErrorMessage(extractFirstValidationError(error) ?? t.genericError);
            } else if (error instanceof ApiError) {
                setErrorMessage(`${error.message} (${error.status})`);
            } else {
                setErrorMessage(t.networkError);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    disabled={isSubmitting}
                    className="p-2 -ml-2 rounded-full active:bg-gray-100"
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-xl font-extrabold text-gray-900 ml-3 tracking-tight">{t.title}</Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FFD84D" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">{t.emailLabel}</Text>
                    <Field icon="mail-outline" placeholder={t.emailLabel} value={email} editable={false} keyboardType="email-address" />

                    <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">{t.nameLabel}</Text>
                    <Field icon="person-outline" placeholder={t.namePlaceholder} value={name} onChangeText={setName} />

                    <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">{t.usernameLabel}</Text>
                    <Field icon="at-outline" placeholder={t.usernamePlaceholder} value={username} onChangeText={setUsername} />

                    <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">{t.phoneLabel}</Text>
                    <Field icon="call-outline" placeholder={t.phonePlaceholder} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                    <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">{t.bioLabel}</Text>
                    <Field icon="document-text-outline" placeholder={t.bioPlaceholder} value={bio} onChangeText={setBio} multiline />

                    {!!errorMessage && (
                        <Text className="text-red-600 text-sm text-center mb-3">{errorMessage}</Text>
                    )}

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isSubmitting}
                        className={`bg-amber-400 h-14 w-full rounded-2xl flex-row items-center justify-center shadow-lg shadow-amber-400/30 mt-2 ${isSubmitting ? 'opacity-70' : ''}`}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#171717" />
                        ) : (
                            <>
                                <Text className="text-neutral-900 font-bold text-base tracking-wide">{t.saveButton}</Text>
                                <Ionicons name="checkmark" size={18} color="#171717" className="ml-2" />
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
