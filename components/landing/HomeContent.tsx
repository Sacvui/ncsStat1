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

                <div className="grid md:grid-cols-4 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-slate-200 -z-10"></div>

                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="w-20 h-20 bg-white rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-center mb-4 relative z-10 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
                            <span className="text-2xl font-bold text-slate-300 group-hover:text-indigo-600 transition-colors">1</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{t(locale, 'workflow.step1.title')}</h3>
                        <p className="text-slate-500 text-xs max-w-[200px] leading-relaxed">{t(locale, 'workflow.step1.desc')}</p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="w-20 h-20 bg-white rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-center mb-4 relative z-10 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
                            <span className="text-2xl font-bold text-slate-300 group-hover:text-indigo-600 transition-colors">2</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{t(locale, 'workflow.step2.title')}</h3>
                        <p className="text-slate-500 text-xs max-w-[200px] leading-relaxed">{t(locale, 'workflow.step2.desc')}</p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="w-20 h-20 bg-white rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-center mb-4 relative z-10 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
                            <span className="text-2xl font-bold text-slate-300 group-hover:text-indigo-600 transition-colors">3</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{t(locale, 'workflow.step3.title')}</h3>
                        <p className="text-slate-500 text-xs max-w-[200px] leading-relaxed">{t(locale, 'workflow.step3.desc')}</p>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="w-20 h-20 bg-white rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-center mb-4 relative z-10 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
                            <span className="text-2xl font-bold text-slate-300 group-hover:text-indigo-600 transition-colors">4</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{t(locale, 'workflow.step4.title')}</h3>
                        <p className="text-slate-500 text-xs max-w-[200px] leading-relaxed">{t(locale, 'workflow.step4.desc')}</p>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: NcsIconReliability, key: 'reliability', color: 'text-blue-600 bg-blue-50' },
                        { icon: NcsIconEFA, key: 'efa', color: 'text-purple-600 bg-purple-50' },
                        { icon: NcsIconCFA, key: 'cfa', color: 'text-pink-600 bg-pink-50' },
                        { icon: NcsIconSEM, key: 'sem', color: 'text-red-600 bg-red-50' },
                        { icon: NcsIconRegression, key: 'regression', color: 'text-orange-600 bg-orange-50' },
                        { icon: NcsIconComparison, key: 'comparison', color: 'text-amber-600 bg-amber-50' },
                        { icon: NcsIconCorrelation, key: 'correlation', color: 'text-green-600 bg-green-50' },
                        { icon: NcsIconNonParam, key: 'nonparam', color: 'text-teal-600 bg-teal-50' }
                    ].map((item) => (
                        <div key={item.key} className="group bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-default">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                    <item.icon size={24} strokeWidth={1.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                                        {t(locale, `methods.${item.key}`)}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Available</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200 mt-16 bg-slate-50/50">
                <div className="container mx-auto px-6 py-12">
                    <div className="grid md:grid-cols-12 gap-12 mb-12">
                        {/* About Hai Rong Choi */}
                        <div className="md:col-span-6 lg:col-span-5">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                {t(locale, 'footer.aboutTitle')}
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm italic border-l-4 border-indigo-200 pl-4 py-1">
                                &quot;{t(locale, 'footer.aboutDesc')}&quot;
                            </p>
                        </div>

                        {/* Navigation & Status */}
                        <div className="md:col-span-6 lg:col-span-7 flex flex-col md:flex-row justify-end items-start md:items-center gap-8 md:gap-16">
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Resources</h4>
                                <div className="flex flex-col gap-2 text-sm text-slate-500">
                                    <Link href="/docs" className="hover:text-indigo-600 transition-colors">{t(locale, 'footer.docs')}</Link>
                                    <Link href="/terms" className="hover:text-indigo-600 transition-colors">{t(locale, 'footer.terms')}</Link>
                                    <Link href="/privacy" className="hover:text-indigo-600 transition-colors">{t(locale, 'footer.privacy')}</Link>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">System</h4>
                                <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                    <div className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                    </div>
                                    <span className="font-medium">{t(locale, 'footer.operational')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200 text-center text-sm text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p>© 2026 ncsStat • Built for Vietnamese PhD Researchers</p>
                        <p className="flex items-center gap-1">
                            Crafted with <span className="text-red-400">♥</span> by Hai Rong Choi
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}
