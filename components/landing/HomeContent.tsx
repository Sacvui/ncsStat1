'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    BookOpen,
    Sparkles,
    BarChart3
} from 'lucide-react';
import {
    NcsIconSpeed,
    NcsIconAI,
    NcsIconSecurity,
    NcsIconReliability,
    NcsIconEFA,
    NcsIconCFA,
    NcsIconSEM,
    NcsIconRegression,
    NcsIconComparison,
    NcsIconCorrelation,
    NcsIconNonParam
} from '../ui/NcsIcons';
import { getStoredLocale, t, type Locale } from '@/lib/i18n';

export default function HomeContent() {
    const [locale, setLocale] = useState<Locale>('vi');
    const [mounted, setMounted] = useState(false);

    // Get locale from localStorage on mount
    useEffect(() => {
        setLocale(getStoredLocale());
        setMounted(true);

        // Listen for language changes
        const handleStorageChange = () => {
            setLocale(getStoredLocale());
        };

        window.addEventListener('storage', handleStorageChange);

        // Custom event for same-tab changes
        window.addEventListener('localeChange', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('localeChange', handleStorageChange);
        };
    }, []);

    // Prevent hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <>
            {/* Hero Section */}
            <div className="container mx-auto px-6 py-24 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-8 uppercase tracking-wide">
                    <Sparkles className="w-3 h-3" />
                    <span>{t(locale, 'hero.badge')}</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
                    {t(locale, 'hero.title')} <br />
                    <span className="text-indigo-600">{t(locale, 'hero.subtitle')}</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                    {t(locale, 'hero.description')}
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <Link
                        href="/analyze"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 text-lg"
                    >
                        <BarChart3 className="w-6 h-6" />
                        {t(locale, 'hero.cta')}
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Workflow Section (New) */}
            <div className="container mx-auto px-6 py-12 border-b border-slate-100">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t(locale, 'workflow.title')}</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-10"></div>

                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-white rounded-full border-4 border-indigo-50 shadow-sm flex items-center justify-center mb-6 relative z-10">
                            <span className="text-3xl font-bold text-indigo-600">1</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t(locale, 'workflow.step1.title')}</h3>
                        <p className="text-slate-600 text-sm max-w-xs">{t(locale, 'workflow.step1.desc')}</p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-white rounded-full border-4 border-indigo-50 shadow-sm flex items-center justify-center mb-6 relative z-10">
                            <span className="text-3xl font-bold text-indigo-600">2</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t(locale, 'workflow.step2.title')}</h3>
                        <p className="text-slate-600 text-sm max-w-xs">{t(locale, 'workflow.step2.desc')}</p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-white rounded-full border-4 border-indigo-50 shadow-sm flex items-center justify-center mb-6 relative z-10">
                            <span className="text-3xl font-bold text-indigo-600">3</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t(locale, 'workflow.step3.title')}</h3>
                        <p className="text-slate-600 text-sm max-w-xs">{t(locale, 'workflow.step3.desc')}</p>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="container mx-auto px-6 py-16">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Speed */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 text-white">
                            <NcsIconSpeed size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t(locale, 'features.speed.title')}</h3>
                        <p className="text-slate-600">{t(locale, 'features.speed.desc')}</p>
                    </div>

                    {/* AI */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 text-white">
                            <NcsIconAI size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t(locale, 'features.ai.title')}</h3>
                        <p className="text-slate-600">{t(locale, 'features.ai.desc')}</p>
                    </div>

                    {/* Security */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4 text-white">
                            <NcsIconSecurity size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t(locale, 'features.security.title')}</h3>
                        <p className="text-slate-600">{t(locale, 'features.security.desc')}</p>
                    </div>
                </div>
            </div>

            {/* Methods Section */}
            <div className="container mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t(locale, 'methods.title')}</h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t(locale, 'methods.subtitle')}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: NcsIconReliability, key: 'reliability', color: 'bg-blue-500' },
                        { icon: NcsIconEFA, key: 'efa', color: 'bg-purple-500' },
                        { icon: NcsIconCFA, key: 'cfa', color: 'bg-pink-500' },
                        { icon: NcsIconSEM, key: 'sem', color: 'bg-red-500' },
                        { icon: NcsIconRegression, key: 'regression', color: 'bg-orange-500' },
                        { icon: NcsIconComparison, key: 'comparison', color: 'bg-amber-500' },
                        { icon: NcsIconCorrelation, key: 'correlation', color: 'bg-green-500' },
                        { icon: NcsIconNonParam, key: 'nonparam', color: 'bg-teal-500' }
                    ].map((item) => (
                        <div key={item.key} className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-center">
                            <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center mx-auto mb-3 text-white`}>
                                <item.icon size={20} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{t(locale, `methods.${item.key}`)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200 mt-16">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-6 text-sm text-slate-500">
                            <Link href="/terms" className="hover:text-slate-700">{t(locale, 'footer.terms')}</Link>
                            <Link href="/privacy" className="hover:text-slate-700">{t(locale, 'footer.privacy')}</Link>
                            <Link href="/docs" className="hover:text-slate-700">{t(locale, 'footer.docs')}</Link>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>{t(locale, 'footer.status')}: {t(locale, 'footer.operational')}</span>
                        </div>
                        <div className="text-sm text-slate-400">
                            © 2026 ncsStat
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
