import { create } from "zustand";
import { UserStatus } from "@/types/userStatus.type";

interface StatusStore {
    selectedStatus: UserStatus | null;
    onToggleLike: ((status: UserStatus) => void) | null;
    // Hanya diisi saat dibuka dari daftar "Aktif" milik sendiri di Post screen -- tombol
    // "Akhiri Postingan" di sheet cuma tampil kalau ini ada, jadi status orang lain
    // (dibuka dari home/nearby) otomatis tidak dapat tombol itu.
    onEndPost: ((status: UserStatus) => void) | null;
    // Backend belum mengirim id pemilik post di payload UserStatus, jadi "ini punya saya
    // sendiri" tidak bisa disimpulkan dari datanya -- pemanggil (Post screen) yang tahu pasti
    // karena cuma dia yang menampilkan daftar postingan milik user sendiri. Dipakai untuk
    // menyembunyikan kolom "kirim pesan" (tidak masuk akal chat ke diri sendiri).
    isOwnStatus: boolean;

    // Menerima objek status lengkap langsung dari pemanggilnya (bukan id untuk
    // dicari ulang di store dummy) -- supaya bottom sheet tetap tampil benar baik
    // untuk data dummy (home) maupun data asli dari backend (nearby).
    openStatus: (
        status: UserStatus,
        onToggleLike?: (status: UserStatus) => void,
        onEndPost?: (status: UserStatus) => void,
        isOwnStatus?: boolean
    ) => void;

    closeStatus: () => void;
}

export const useStatusStore =
    create<StatusStore>((set) => ({
        selectedStatus: null,
        onToggleLike: null,
        onEndPost: null,
        isOwnStatus: false,

        openStatus: (status, onToggleLike, onEndPost, isOwnStatus) =>
            set({
                selectedStatus: status,
                onToggleLike: onToggleLike ?? null,
                onEndPost: onEndPost ?? null,
                isOwnStatus: isOwnStatus ?? false,
            }),

        closeStatus: () =>
            set({
                selectedStatus: null,
                onToggleLike: null,
                onEndPost: null,
                isOwnStatus: false,
            }),
    }));
