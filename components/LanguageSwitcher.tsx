'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Locale, getStoredLocale, setStoredLocale } from '@/lib/i18n';

interface LanguageSwitcherProps {
    onLocaleChange?: (locale: Locale) => void;
    compact?: boolean;
}

export function LanguageSwitcher({ onLocaleChange, compact = false }: LanguageSwitcherProps) {
    const [locale, setLocale] = useState<Locale>('vi');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setLocale(getStoredLocale());
    }, []);

    const toggleLocale = () => {
        const newLocale = locale === 'vi' ? 'en' : 'vi';
        setLocale(newLocale);
        setStoredLocale(newLocale);
        onLocaleChange?.(newLocale);

        // Reload page to apply translations
        window.location.reload();
    };

    if (compact) {
        return (
            <button
                onClick={toggleLocale}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title={locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{locale}</span>
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
            >
                <Globe className="w-4 h-4" />
                <span>{locale === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                        <button
                            onClick={() => {
                                setLocale('vi');
                                setStoredLocale('vi');
                                onLocaleChange?.('vi');
                                setIsOpen(false);
                                window.location.reload();
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2 ${locale === 'vi' ? 'text-indigo-600 font-medium' : 'text-slate-600'}`}
                        >
                            🇻🇳 Tiếng Việt
                        </button>
                        <button
                            onClick={() => {
                                setLocale('en');
                                setStoredLocale('en');
                                onLocaleChange?.('en');
                                setIsOpen(false);
                                window.location.reload();
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2 ${locale === 'en' ? 'text-indigo-600 font-medium' : 'text-slate-600'}`}
                        >
                            🇬🇧 English
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default LanguageSwitcher;
