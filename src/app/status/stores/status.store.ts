import { create } from "zustand";

interface StatusStore {
    selectedStatusId: string | null;

    openStatus: (
        statusId: string
    ) => void;

    closeStatus: () => void;
}

export const useStatusStore =
    create<StatusStore>((set) => ({
        selectedStatusId: null,

        openStatus: (statusId) =>
            set({
                selectedStatusId: statusId,
            }),

        closeStatus: () =>
            set({
                selectedStatusId: null,
            }),
    }));