'use client'

import Link from 'next/link'
import UserMenu from '@/components/UserMenu'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { NcsBalanceBadge } from '@/components/NcsBalanceBadge'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSupabase } from '@/utils/supabase/client'
import { getStoredLocale, t, type Locale } from '@/lib/i18n'
import { useOrcidUser } from '@/hooks/useOrcidSession'

interface HeaderProps {
    user: any
    profile?: any
    centerContent?: React.ReactNode
    rightActions?: React.ReactNode
    hideNav?: boolean
}

export default function Header({ user, profile: initialProfile, centerContent, rightActions, hideNav = false }: HeaderProps) {
    const pathname = usePathname()
    const [profile, setProfile] = useState<any>(initialProfile)
    const [locale, setLocale] = useState<Locale>('vi')
    const supabase = getSupabase()

    // ORCID session check for users who logged in via ORCID
    const { orcidUser } = useOrcidUser()

    // Effective user: Supabase user OR ORCID user
    const effectiveUser = user || (orcidUser ? { id: orcidUser.id, email: orcidUser.email } : null)
    const effectiveProfile = profile || (orcidUser ? {
        id: orcidUser.id,
        full_name: orcidUser.full_name,
        email: orcidUser.email,
        tokens: orcidUser.tokens,
        orcid_id: orcidUser.orcid_id
    } : null)

    useEffect(() => {
        setLocale(getStoredLocale())
        const handleStorageChange = () => setLocale(getStoredLocale())
        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('localeChange', handleStorageChange)
        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('localeChange', handleStorageChange)
        }
    }, [])

    useEffect(() => {
        if (!user) return

        const fetchProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            if (data) setProfile(data)
        }

        if (!initialProfile) {
            fetchProfile()
        } else {
            setProfile(initialProfile)
        }

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`profile-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload: any) => {
                    setProfile(payload.new)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [initialProfile, user, supabase])

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-50">
            <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-2 md:gap-4">
                {/* Left: Logo & Nav */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <img src="/logo.svg" alt="ncsStat" className="h-9 w-auto" />
                    </Link>

                    {/* Desktop Nav */}
                    {!hideNav && !centerContent && (
                        <nav className="hidden md:flex items-center gap-1">
                            <NavLink href="/analyze" active={pathname?.startsWith('/analyze')}>{t(locale, 'nav.analyze')}</NavLink>
                            {effectiveUser && (
                                <NavLink href="/profile" active={pathname?.startsWith('/profile')}>{t(locale, 'nav.profile')}</NavLink>
                            )}
                        </nav>
                    )}
                </div>

                {/* Center: Custom Content (e.g. Toolbar) or Spacer */}
                {centerContent ? (
                    <div className="flex-1 flex justify-center min-w-0">
                        {centerContent}
                    </div>
                ) : (
                    <div className="flex-1" /> // Spacer
                )}

                {/* Right: Actions & User */}
                <div className="flex items-center gap-3 shrink-0">
                    {rightActions}

                    {/* Separator if actions exist */}
                    {rightActions && <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />}

                    {/* NCS Balance Badge - show when user is logged in */}
                    {effectiveUser && (
                        <NcsBalanceBadge balance={effectiveProfile?.tokens || 0} size="sm" />
                    )}

                    {/* Language Switcher */}
                    <LanguageSwitcher compact />

                    {effectiveUser ? (
                        <UserMenu user={effectiveUser} profile={effectiveProfile} isOrcidUser={!!orcidUser} />
                    ) : (
                        <Link href="/login" className="px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}

function NavLink({ href, active, children }: { href: string, active?: boolean, children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${active
                ? 'text-blue-600 bg-blue-50/80'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            {children}
            {active && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
            )}
        </Link>
    )
}
