import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Switch,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Lang, useLang } from '@/stores/lang.store';
import locales from '../locales';
import Toast from '@/utils/Toast';
import { changePassword } from '../../auth/api/change-password';
import { updateProfile } from '../api/update';
import { ApiError } from '../../api/types';
import { biometricAuth, biometricPreference, type BiometricCapability } from '@/utils/biometricAuth';
import {
    notificationPreference,
    registerDeviceForPush,
    unregisterDeviceFromPush,
} from '@/utils/pushNotifications';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

const extractFirstValidationError = (error: ApiError): string | undefined => {
    const errors = (error.details as { errors?: Record<string, string[]> } | undefined)?.errors;
    return errors ? Object.values(errors)[0]?.[0] : undefined;
};

type PasswordFieldProps = {
    placeholder: string;
    value: string;
    onChangeText: (value: string) => void;
    editable: boolean;
};

const PasswordField = ({ placeholder, value, onChangeText, editable }: PasswordFieldProps) => {
    const [visible, setVisible] = useState(false);

    return (
        <View className="bg-neutral-50 border border-neutral-100 rounded-2xl h-14 px-4 mb-4 flex-row items-center">
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
            <TextInput
                className="text-neutral-900 ml-3 text-sm flex-1"
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!visible}
                autoCapitalize="none"
                editable={editable}
            />
            <TouchableOpacity onPress={() => setVisible(!visible)} className="ml-2">
                <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
        </View>
    );
};

type SettingRowProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    right: React.ReactNode;
    onPress?: () => void;
};

const SettingRow = ({ icon, title, subtitle, right, onPress }: SettingRowProps) => (
    <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        disabled={!onPress}
        className="bg-white p-4 rounded-xl flex-row items-center"
    >
        <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center mr-3">
            <Ionicons name={icon} size={22} color="#F6C431" />
        </View>
        <View className="flex-1 pr-3">
            <Text className="text-base font-semibold text-gray-800">{title}</Text>
            <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>
        </View>
        {right}
    </TouchableOpacity>
);

type LanguageButtonProps = {
    targetLang: Lang;
    label: string;
    currentLang: Lang;
    onPress: (targetLang: Lang) => void;
};

const LanguageButton = ({ targetLang, label, currentLang, onPress }: LanguageButtonProps) => (
    <TouchableOpacity
        onPress={() => onPress(targetLang)}
        className={`flex-1 p-3 rounded-lg ${currentLang === targetLang ? 'bg-primary' : 'bg-gray-200'}`}
    >
        <Text className={`text-center font-semibold ${currentLang === targetLang ? 'text-black' : 'text-gray-600'}`}>
            {label}
        </Text>
    </TouchableOpacity>
);

export default function SettingScreen() {
    const { lang, setLang } = useLang();
    const t = locales[lang].settingScreen;

    // --- Notifikasi ---
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);

    // --- Ganti password: form disembunyikan sampai tombolnya ditekan ---
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // --- Login biometrik ---
    const [capability, setCapability] = useState<BiometricCapability | 'checking'>('checking');
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [isTogglingBiometric, setIsTogglingBiometric] = useState(false);

    useEffect(() => {
        let isMounted = true;

        (async () => {
            const [deviceCapability, biometricOn, notificationsOn] = await Promise.all([
                biometricAuth.getCapability(),
                biometricPreference.isEnabled(),
                notificationPreference.isEnabled(),
            ]);

            if (!isMounted) return;
            setCapability(deviceCapability);
            setBiometricEnabled(biometricOn);
            setNotificationsEnabled(notificationsOn);
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleChangeLanguage = async (targetLang: Lang) => {
        if (targetLang === lang) return;

        const previousLang = lang;
        setLang(targetLang);

        try {
            await updateProfile({ language: targetLang });
        } catch (error) {
            // The PATCH failed -- revert the optimistic local change immediately instead of
            // leaving the UI claiming a change that never reached the server. `profile/index.tsx`'s
            // `loadProfile` also syncs `lang` from the server on every focus; without this revert
            // the user would briefly see the new language here, then have it silently snapped
            // back when they navigate back to Profile (which is pushed underneath this screen).
            setLang(previousLang);
            Toast.error(
                t.languageSection.saveErrorTitle,
                error instanceof ApiError ? error.message : t.languageSection.saveErrorMessage
            );
        }
    };

    const handleToggleNotifications = async (value: boolean) => {
        if (isTogglingNotifications) return;
        setIsTogglingNotifications(true);

        try {
            if (value) {
                const registered = await registerDeviceForPush();
                if (!registered) {
                    Toast.error(t.notificationPermissionDenied);
                    return;
                }
                await notificationPreference.setEnabled(true);
                setNotificationsEnabled(true);
                Toast.success(t.notificationEnabledSuccess);
            } else {
                await unregisterDeviceFromPush();
                await notificationPreference.setEnabled(false);
                setNotificationsEnabled(false);
                Toast.success(t.notificationDisabledSuccess);
            }
        } finally {
            setIsTogglingNotifications(false);
        }
    };

    const openPasswordForm = () => {
        animateLayout();
        setShowPasswordForm(true);
    };

    const closePasswordForm = () => {
        animateLayout();
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError(t.allFieldsRequiredError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(t.confirmMismatchError);
            return;
        }

        setIsSavingPassword(true);

        try {
            await changePassword({
                currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            });
            Toast.success(t.saveSuccessTitle, t.saveSuccessMessage);
            closePasswordForm();
        } catch (error) {
            if (error instanceof ApiError && error.status === 422) {
                setPasswordError(extractFirstValidationError(error) ?? t.genericError);
            } else if (error instanceof ApiError && error.status === 429) {
                setPasswordError(t.rateLimitError);
            } else if (error instanceof ApiError) {
                setPasswordError(`${error.message} (${error.status})`);
            } else {
                setPasswordError(t.networkError);
            }
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleToggleBiometric = async (value: boolean) => {
        if (isTogglingBiometric) return;

        if (!value) {
            setIsTogglingBiometric(true);
            await biometricPreference.setEnabled(false);
            setBiometricEnabled(false);
            setIsTogglingBiometric(false);
            return;
        }

        setIsTogglingBiometric(true);
        try {
            const result = await biometricAuth.authenticate(t.biometricTitle);
            if (result.success) {
                await biometricPreference.setEnabled(true);
                setBiometricEnabled(true);
                Toast.success(t.biometricEnabledSuccess);
            } else {
                Toast.info(t.biometricCancelledTitle, t.biometricCancelledMessage);
            }
        } finally {
            setIsTogglingBiometric(false);
        }
    };

    const biometricSubtitle =
        capability === 'checking'
            ? t.biometricCheckingSubtitle
            : capability === 'unsupported'
                ? t.biometricUnsupportedSubtitle
                : capability === 'not-enrolled'
                    ? t.biometricNotEnrolledSubtitle
                    : t.biometricAvailableSubtitle;

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-gray-100">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-xl font-extrabold text-gray-900 ml-3 tracking-tight">{t.title}</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* --- Bahasa --- */}
                <Text className="text-sm font-bold text-gray-500 uppercase mb-3 px-1">{t.languageSection.title}</Text>
                <View className="mb-8">
                    <View className="bg-white p-4 rounded-xl flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center mr-3">
                            <Ionicons name="language-outline" size={22} color="#F6C431" />
                        </View>
                        <View className="flex-1 pr-3">
                            <Text className="text-base font-semibold text-gray-800">{t.languageSection.title}</Text>
                            <Text className="text-xs text-gray-500 mt-1 mb-3">{t.languageSection.description}</Text>
                            <View className="flex-row gap-2">
                                <LanguageButton targetLang="idID" label={t.languageSection.id} currentLang={lang} onPress={handleChangeLanguage} />
                                <LanguageButton targetLang="enGB" label={t.languageSection.en} currentLang={lang} onPress={handleChangeLanguage} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* --- Notifikasi --- */}
                <Text className="text-sm font-bold text-gray-500 uppercase mb-3 px-1">{t.notificationSection}</Text>
                <View className="mb-8">
                    <SettingRow
                        icon="notifications-outline"
                        title={t.notificationTitle}
                        subtitle={t.notificationSubtitle}
                        right={
                            isTogglingNotifications ? (
                                <ActivityIndicator color="#F6C431" />
                            ) : (
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={handleToggleNotifications}
                                    trackColor={{ true: '#FFD84D', false: undefined }}
                                />
                            )
                        }
                    />
                </View>

                {/* --- Ganti Password: form baru muncul setelah tombol ditekan --- */}
                <Text className="text-sm font-bold text-gray-500 uppercase mb-3 px-1">{t.changePasswordSection}</Text>
                <View className="mb-8">
                    {!showPasswordForm ? (
                        <SettingRow
                            icon="key-outline"
                            title={t.changePasswordRow}
                            subtitle={t.changePasswordRowSubtitle}
                            onPress={openPasswordForm}
                            right={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
                        />
                    ) : (
                        <View className="bg-white p-4 rounded-xl">
                            <PasswordField placeholder={t.currentPasswordPlaceholder} value={currentPassword} onChangeText={setCurrentPassword} editable={!isSavingPassword} />
                            <PasswordField placeholder={t.newPasswordPlaceholder} value={newPassword} onChangeText={setNewPassword} editable={!isSavingPassword} />
                            <PasswordField placeholder={t.confirmPasswordPlaceholder} value={confirmPassword} onChangeText={setConfirmPassword} editable={!isSavingPassword} />

                            {!!passwordError && (
                                <Text className="text-red-600 text-sm text-center mb-3">{passwordError}</Text>
                            )}

                            <TouchableOpacity
                                onPress={handleChangePassword}
                                disabled={isSavingPassword}
                                className={`bg-amber-400 h-14 w-full rounded-2xl flex-row items-center justify-center shadow-lg shadow-amber-400/30 mb-3 ${isSavingPassword ? 'opacity-70' : ''}`}
                                activeOpacity={0.8}
                            >
                                {isSavingPassword ? (
                                    <ActivityIndicator color="#171717" />
                                ) : (
                                    <>
                                        <Text className="text-neutral-900 font-bold text-base tracking-wide">{t.saveButton}</Text>
                                        <Ionicons name="checkmark" size={18} color="#171717" className="ml-2" />
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={closePasswordForm} disabled={isSavingPassword} className="items-center py-1">
                                <Text className="text-sm font-semibold text-neutral-500">{t.cancelButton}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* --- Login Biometrik --- */}
                <Text className="text-sm font-bold text-gray-500 uppercase mb-3 px-1">{t.biometricSection}</Text>
                <View>
                    <SettingRow
                        icon="finger-print-outline"
                        title={t.biometricTitle}
                        subtitle={biometricSubtitle}
                        right={
                            isTogglingBiometric ? (
                                <ActivityIndicator color="#F6C431" />
                            ) : (
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={handleToggleBiometric}
                                    disabled={capability !== 'available'}
                                    trackColor={{ true: '#FFD84D', false: undefined }}
                                />
                            )
                        }
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
