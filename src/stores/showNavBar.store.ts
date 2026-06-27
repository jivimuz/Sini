import { create } from 'zustand';
export type ShownNavbar = boolean | null;

type Store = {
    shownNavbar: ShownNavbar
    setNavbar: (shownNavbar: ShownNavbar) => void
}

export const useShowNavbar = create<Store>()((set) => ({
    shownNavbar: true,
    setNavbar: (shownNavbar) => set({ shownNavbar: shownNavbar }),
}))