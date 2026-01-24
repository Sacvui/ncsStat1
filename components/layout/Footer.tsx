'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { t, type Locale } from '@/lib/i18n';

interface FooterProps {
    locale?: Locale;
}

export default function Footer({ locale = 'vi' }: FooterProps) {
    return (
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
    );
}
