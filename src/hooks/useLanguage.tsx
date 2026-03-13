import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "@/i18n/translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => any;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("hercycle-lang");
    return (saved as Lang) || "ko";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("hercycle-lang", l);
  };

  const t = (key: TranslationKey, vars?: Record<string, string | number>) => {
    const val = translations[lang][key];
    if (typeof val === "string" && vars) {
      return val.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
    }
    return val;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

const fallback: LanguageContextType = {
  lang: "ko",
  setLang: () => {},
  t: (key: TranslationKey) => translations["ko"][key],
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx ?? fallback;
}
