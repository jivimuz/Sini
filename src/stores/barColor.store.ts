import { create } from 'zustand'

export type BarColor = `#${string}`;

type Store = {
    bar: BarColor
    setBarColor: (bar: BarColor) => void
}

export const useBarColor = create<Store>()((set) => ({
    bar: '#FFFDF5',
    setBarColor: (bar) => set({ bar: bar }),
}))