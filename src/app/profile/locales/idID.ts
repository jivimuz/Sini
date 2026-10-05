export default {
    profileScreen: {
        // Judul Bagian
        accountSection: "Akun",
        settingsSection: "Pengaturan",
        otherSection: "Lainnya",

        // Item Menu
        editProfile: "Edit Profil",
        settingsMenu: "Pengaturan",
        helpCenter: "Pusat Bantuan",
        aboutApp: "Tentang Aplikasi",
        logout: "Keluar",

        // Bagian Bahasa
        languageSection: {
            title: "Bahasa",
            description: "Pilih bahasa tampilan aplikasi.",
            id: "Indonesia",
            en: "Inggris"
        }

    },
    editProfileScreen: {
        title: "Edit Profil",
        emailLabel: "Email",
        nameLabel: "Nama Lengkap",
        namePlaceholder: "Masukkan nama lengkap",
        usernameLabel: "Username",
        usernamePlaceholder: "Masukkan username",
        phoneLabel: "Nomor Telepon",
        phonePlaceholder: "Masukkan nomor telepon (opsional)",
        bioLabel: "Bio",
        bioPlaceholder: "Ceritakan sedikit tentang dirimu (opsional)",
        saveButton: "Simpan Perubahan",
        saveSuccess: "Profil berhasil diperbarui",
        requiredFieldsError: "Nama dan username wajib diisi.",
        genericError: "Periksa kembali data profil Anda.",
        networkError: "Gagal menyimpan. Periksa koneksi dan coba lagi.",
        loadErrorTitle: "Gagal memuat profil",
        loadErrorMessage: "Periksa koneksi dan coba lagi.",
    },
    settingScreen: {
        title: "Pengaturan",

        notificationSection: "Notifikasi",
        notificationTitle: "Terima Notifikasi",
        notificationSubtitle: "Dapatkan pemberitahuan dari aplikasi di perangkat ini.",
        notificationEnabledSuccess: "Notifikasi diaktifkan",
        notificationDisabledSuccess: "Notifikasi dimatikan",
        notificationPermissionDenied: "Izin notifikasi ditolak. Aktifkan dari pengaturan perangkat Anda.",

        changePasswordSection: "Ganti Password",
        changePasswordRow: "Ubah Password",
        changePasswordRowSubtitle: "Perbarui password akun Anda secara berkala.",
        cancelButton: "Batal",
        currentPasswordPlaceholder: "Password saat ini",
        newPasswordPlaceholder: "Password baru",
        confirmPasswordPlaceholder: "Konfirmasi password baru",
        saveButton: "Ubah Password",
        saveSuccessTitle: "Password berhasil diubah",
        saveSuccessMessage: "Sesi di perangkat lain telah keluar otomatis.",
        allFieldsRequiredError: "Semua kolom password wajib diisi.",
        confirmMismatchError: "Konfirmasi password baru tidak sama.",
        genericError: "Periksa kembali password Anda.",
        rateLimitError: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
        networkError: "Gagal menyimpan. Periksa koneksi dan coba lagi.",

        biometricSection: "Login Biometrik",
        biometricTitle: "Masuk dengan Face ID/Touch ID",
        biometricCheckingSubtitle: "Memeriksa perangkat...",
        biometricUnsupportedSubtitle: "Perangkat ini tidak mendukung Face ID/Touch ID.",
        biometricNotEnrolledSubtitle: "Aktifkan Face ID/Touch ID di pengaturan perangkat Anda terlebih dahulu.",
        biometricAvailableSubtitle: "Masuk otomatis dengan Face ID/Touch ID saat membuka aplikasi.",
        biometricEnabledSuccess: "Login biometrik diaktifkan",
        biometricCancelledTitle: "Dibatalkan",
        biometricCancelledMessage: "Login biometrik belum diaktifkan.",
    }
};
