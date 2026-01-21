import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, LayoutDashboard, MessageSquare, ArrowLeft, Users } from 'lucide-react'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user is admin
    // Note: We need to select the role. 
    // If the profile doesn't exist yet (race condition on signup), this might fail or return null.
    // Ideally, middleware handles protection, but layout is a good second layer.
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        // Redirect to home or 403 page
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <Link href="/" className="flex items-center gap-2 text-slate-100 hover:text-white transition-colors">
                        <Shield className="w-6 h-6 text-blue-400" />
                        <span className="font-bold text-lg">NCS Admin</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavLink href="/admin/feedback" icon={<MessageSquare className="w-4 h-4" />}>
                        Phản hồi (Feedback)
                    </NavLink>
                    {/* Future: Users management */}
                    <NavLink href="/admin/users" icon={<Users className="w-4 h-4" />}>
                        Người dùng
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Về trang chủ
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                {children}
            </main>
        </div>
    )
}

function NavLink({ href, icon, children }: { href: string; icon: any; children: React.ReactNode }) {
    // Simple check for active state could be added here using usePathname if this was a client component
    // For now, simple styling.
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all font-medium"
        >
            {icon}
            {children}
        </Link>
    )
}
