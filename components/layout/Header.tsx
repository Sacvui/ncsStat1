'use client'

import Link from 'next/link'
import UserMenu from '@/components/UserMenu'
import { usePathname } from 'next/navigation'

interface HeaderProps {
    user: any
    centerContent?: React.ReactNode
    rightActions?: React.ReactNode
    hideNav?: boolean
}

export default function Header({ user, centerContent, rightActions, hideNav = false }: HeaderProps) {
    const pathname = usePathname()

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-50">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
                {/* Left: Logo & Nav */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <img src="/logo.svg" alt="ncsStat" className="h-9 w-auto" />
                        <span className="font-bold text-lg text-slate-800 hidden sm:block">ncsStat</span>
                    </Link>

                    {/* Desktop Nav */}
                    {!hideNav && !centerContent && (
                        <nav className="hidden md:flex items-center gap-1">
                            <NavLink href="/analyze" active={pathname?.startsWith('/analyze')}>Phân tích</NavLink>
                            {user && (
                                <NavLink href="/profile" active={pathname?.startsWith('/profile')}>Hồ sơ</NavLink>
                            )}

                            {/* Check if user is admin - UserMenu has this logic but we don't know easily.
                          Check props or metadata? 
                          We can rely on user metadata if available, OR just let user explore.
                          Better: We will just link to common pages. Admin is in UserMenu dropdown usually.
                       */}
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

                    {user ? (
                        <UserMenu user={user} />
                    ) : (
                        <Link href="/login" className="px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm">
                            Đăng nhập
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            {children}
        </Link>
    )
}
