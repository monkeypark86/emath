import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * 轻量级中英文切换 (Lightweight zh/en i18n)
 *
 * 用法 (Usage):
 *   - React 组件内: const { t, lang } = useLang();  t('中文', 'English')
 *   - 非组件代码 (utils): import { tr } from '../i18n';  tr('中文', 'English')
 *
 * 语言保存在 localStorage，刷新后保持。切换语言时 LanguageProvider 会触发整棵树重渲染，
 * 因此在渲染期间调用的 tr() 也会拿到最新语言。
 */

export type Lang = 'zh' | 'en';

const STORAGE_KEY = 'emath_lang_v1';

const readInitialLang = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  return 'zh';
};

let currentLang: Lang = readInitialLang();

/** 获取当前语言 (可在任意位置调用) */
export const getLang = (): Lang => currentLang;

/** 根据当前语言返回中文或英文文案 (可在任意位置调用) */
export const tr = (zh: string, en: string): string => (currentLang === 'en' ? en : zh);

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (zh: string, en: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: currentLang,
  setLang: () => {},
  toggleLang: () => {},
  t: tr
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(currentLang);

  const setLang = useCallback((next: Lang) => {
    currentLang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(currentLang === 'zh' ? 'en' : 'zh');
  }, [setLang]);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title =
      lang === 'en'
        ? 'Elephant Math - Mental Math & Smart Mistake Book for Kids'
        : '小象速算 - 小学生数学口算与智能错题本';
  }, [lang]);

  const t = useCallback((zh: string, en: string) => (lang === 'en' ? en : zh), [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>{children}</LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
