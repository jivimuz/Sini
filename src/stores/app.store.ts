import { create } from 'zustand'


type Store = {
    isAppReady: boolean
    setIsAppReady: (isAppReady: boolean) => void
}

export const useIsAppReady = create<Store>()((set) => ({
    isAppReady: false,
    setIsAppReady: (isAppReady) => set({ isAppReady: isAppReady }),
}))