import { create } from 'zustand'

type Store = {
    activeTab: string
    setActiveTab: (tab: string) => void
}

export const useTab = create<Store>()((set) => ({
    activeTab: 'Home',
    setActiveTab: (tab) => set({ activeTab: tab }),
}))