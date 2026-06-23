import { create } from 'zustand'

export type Lang = 'idID' | 'enGB';

type Store = {
    lang: Lang
    setLang: (lang: Lang) => void
}

export const useLang = create<Store>()((set) => ({
    lang: 'idID',
    setLang: (lang) => set({ lang: lang }),
}))