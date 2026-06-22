
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Language, Translation } from './translations';

interface UIStore {
    language: Language;
    t: Translation;
    setLanguage: (lang: Language) => void;
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            language: 'zh',
            t: translations.zh,
            setLanguage: (lang) => set({
                language: lang,
                t: translations[lang]
            }),
        }),
        {
            name: 'sas-ui-storage',
            partialize: (state) => ({ language: state.language }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.t = translations[state.language];
                }
            }
        }
    )
);
