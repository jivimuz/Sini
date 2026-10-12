import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { useLang } from '@/stores/lang.store';
import { useAuth } from '@/stores/auth.store';
import { useShowNavbar } from '@/stores/showNavBar.store';
import Toast from '@/utils/Toast';
import { ApiError } from '../api/types';
import locales from './locales';
import { createTicket } from './api/create';

type FieldErrors = Partial<Record<'title' | 'description', string>>;

/**
 * Laravel's 422 payload groups every validation failure under `details.errors`, keyed by
 * field name -- surface the title/description failures under their own fields instead of one
 * generic message, same approach as `profile/edit`'s validation handling.
 */
const extractFieldErrors = (error: ApiError): FieldErrors => {
    const errors = (error.details as { errors?: Record<string, string[]> } | undefined)?.errors;
    if (!errors) return {};

    const fieldErrors: FieldErrors = {};
    if (errors.title?.[0]) fieldErrors.title = errors.title[0];
    if (errors.description?.[0]) fieldErrors.description = errors.description[0];
    return fieldErrors;
};

const NewHelpdeskTicketScreen = () => {
    const { lang } = useLang();
    const t = locales[lang].helpdeskNewScreen;
    const { setNavbar } = useShowNavbar();
    const { logout } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hide the global floating navbar every time this screen gains focus. Deliberately has NO
    // cleanup here -- the cleanup-only effect below handles the final restore -- matching the
    // corrected pattern in `help/index.tsx` / `helpdesk/index.tsx` rather than the old
    // `about/index.tsx` mount-effect pattern.
    useFocusEffect(
        useCallback(() => {
            setNavbar(false);
        }, [])
    );

    // Restore the navbar only when this screen itself unmounts entirely.
    useEffect(() => {
        return () => setNavbar(true);
    }, []);

    const handleSubmit = async () => {
        setFormError('');
        setFieldErrors({});

        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();

        if (!trimmedTitle || !trimmedDescription) {
            setFormError(t.requiredFieldsError);
            return;
        }

        setIsSubmitting(true);

        try {
            await createTicket({ title: trimmedTitle, description: trimmedDescription });
            Toast.success(t.createSuccess);
            router.back();
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                // Client already retried once after a token refresh (see client.ts) -- a 401
                // reaching here means the session is genuinely gone.
                logout();
                return;
            }

            if (error instanceof ApiError && error.status === 422) {
                const fields = extractFieldErrors(error);
                setFieldErrors(fields);
                if (Object.keys(fields).length === 0) {
                    setFormError(error.message || t.genericError);
                }
            } else if (error instanceof ApiError && error.status === 429) {
                setFormError(t.rateLimitError);
            } else if (error instanceof ApiError) {
                // Status selain di atas (mis. 500) -- tampilkan apa adanya supaya tidak perlu
                // menebak dari pesan generik saat men-debug.
                setFormError(`${error.message} (${error.status})`);
            } else {
                // Request tidak pernah dibalas server -- biasanya berarti koneksi/jaringan.
                setFormError(t.networkError);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-gray-100">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-xl font-extrabold text-gray-900 ml-3 tracking-tight">{t.title}</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">{t.titleLabel}</Text>
                <View className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 mb-1">
                    <TextInput
                        className="text-neutral-900 text-sm py-3.5"
                        placeholder={t.titlePlaceholder}
                        placeholderTextColor="#9CA3AF"
                        value={title}
                        onChangeText={setTitle}
                        editable={!isSubmitting}
                        maxLength={255}
                    />
                </View>
                <Text className={`text-red-600 text-xs ml-1 ${fieldErrors.title ? 'mb-3' : 'mb-3 opacity-0 h-0'}`}>
                    {fieldErrors.title ?? ' '}
                </Text>

                <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">{t.descriptionLabel}</Text>
                <View className="bg-neutral-50 border border-neutral-100 rounded-2xl px-4 mb-1">
                    <TextInput
                        className="text-neutral-900 text-sm py-3.5"
                        placeholder={t.descriptionPlaceholder}
                        placeholderTextColor="#9CA3AF"
                        value={description}
                        onChangeText={setDescription}
                        editable={!isSubmitting}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        style={{ minHeight: 120 }}
                    />
                </View>
                <Text className={`text-red-600 text-xs ml-1 ${fieldErrors.description ? 'mb-3' : 'mb-3 opacity-0 h-0'}`}>
                    {fieldErrors.description ?? ' '}
                </Text>

                {!!formError && (
                    <Text className="text-red-600 text-sm text-center mb-3">{formError}</Text>
                )}

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className={`bg-amber-400 h-14 w-full rounded-2xl flex-row items-center justify-center shadow-lg shadow-amber-400/30 ${isSubmitting ? 'opacity-70' : ''}`}
                    activeOpacity={0.8}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#171717" />
                    ) : (
                        <>
                            <Text className="text-neutral-900 font-bold text-base tracking-wide">{t.submitButton}</Text>
                            <Ionicons name="send" size={16} color="#171717" className="ml-2" />
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default NewHelpdeskTicketScreen;
