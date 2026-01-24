'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Sparkles,
    Zap,
    Brain,
    Shield,
    BarChart3,
    Activity,
    Layers,
    TrendingUp,
    Network,
    Users,
    ArrowRight,
    BookOpen
} from 'lucide-react';
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
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                    >
                        <BarChart3 className="w-5 h-5" />
                        {t(locale, 'hero.cta')}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/docs"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                    >
                        <BookOpen className="w-5 h-5" />
                        {t(locale, 'hero.learn')}
                    </Link>
                </div>
            </div>

            {/* Features Grid */}
            <div className="container mx-auto px-6 py-16">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Speed */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t(locale, 'features.speed.title')}</h3>
                        <p className="text-slate-600">{t(locale, 'features.speed.desc')}</p>
                    </div>

                    {/* AI */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t(locale, 'features.ai.title')}</h3>
                        <p className="text-slate-600">{t(locale, 'features.ai.desc')}</p>
                    </div>

                    {/* Security */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-white" />
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
                        { icon: Activity, key: 'reliability', color: 'bg-blue-500' },
                        { icon: Layers, key: 'efa', color: 'bg-purple-500' },
                        { icon: Network, key: 'cfa', color: 'bg-pink-500' },
                        { icon: TrendingUp, key: 'sem', color: 'bg-red-500' },
                        { icon: TrendingUp, key: 'regression', color: 'bg-orange-500' },
                        { icon: Users, key: 'comparison', color: 'bg-amber-500' },
                        { icon: Activity, key: 'correlation', color: 'bg-green-500' },
                        { icon: BarChart3, key: 'nonparam', color: 'bg-teal-500' }
                    ].map((item) => (
                        <div key={item.key} className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-center">
                            <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                                <item.icon className="w-5 h-5 text-white" />
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
