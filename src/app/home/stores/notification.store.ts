import { create } from 'zustand'

export type IsNewNotif = true | false;

type Store = {
    newNotif: IsNewNotif
    setIsNewNotif: (newNotif: IsNewNotif) => void
}

export const useIsNewNotif = create<Store>()((set) => ({
    newNotif: false,
    setIsNewNotif: (newNotif) => set({ newNotif: newNotif }),
}))