import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail, Shield, Share2, Copy, BarChart3, Database, Star } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch projects count
    const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    // Fetch referrals count (people referred by this user)
    // Note: We need to count profiles where referred_by_code == my_referral_code
    // But wait, setup_db referenced referred_by (uuid), I need to check schema.
    // setup_db_full.sql: referred_by_code text
    // Let's assume referred_by_code stores the code.

    const { count: referralsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by_code', profile?.referral_code)

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
                    <Link href="/" className="text-blue-600 hover:underline">
                        &larr; Quay lại trang chủ
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: User Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex flex-col items-center">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full mb-4 ring-4 ring-blue-50" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold mb-4 ring-4 ring-blue-50">
                                        {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                                    </div>
                                )}

                                <h2 className="text-xl font-bold text-slate-900 text-center">{profile?.full_name || 'Người dùng'}</h2>
                                <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full">
                                    <Mail className="w-3 h-3" />
                                    {profile?.email || user.email}
                                </div>

                                <div className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border flex items-center gap-1.5
                  ${profile?.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}
                `}>
                                    <Shield className="w-3 h-3" />
                                    {profile?.role === 'admin' ? 'Administrator' : 'Researcher'}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Mã giới thiệu của bạn</label>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-lg font-mono text-lg font-bold text-center tracking-widest text-slate-800">
                                            {profile?.referral_code || '---'}
                                        </code>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 text-center">
                                        Chia sẻ mã này để mời bạn bè tham gia
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & Projects */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard
                                icon={<Users className="w-5 h-5 text-blue-600" />}
                                label="Người đã giới thiệu"
                                value={referralsCount || 0}
                                color="blue"
                            />
                            <StatCard
                                icon={<Database className="w-5 h-5 text-emerald-600" />}
                                label="Dự án nghiên cứu"
                                value={projectsCount || 0}
                                color="emerald"
                            />
                            <StatCard
                                icon={<Star className="w-5 h-5 text-amber-600" />}
                                label="Điểm tin cậy"
                                value="100%"
                                color="amber"
                            />
                        </div>

                        {/* Content Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-slate-400" />
                                    Dự án gần đây
                                </h3>
                                <button className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium">
                                    + Tạo dự án mới
                                </button>
                            </div>

                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Database className="w-8 h-8 text-slate-300" />
                                </div>
                                <h4 className="text-slate-900 font-medium mb-1">Chưa có dự án nào</h4>
                                <p className="text-slate-500 text-sm max-w-xs mb-6">
                                    Bắt đầu hành trình nghiên cứu của bạn bằng cách tạo dự án thống kê đầu tiên.
                                </p>
                                <Link
                                    href="/analyze"
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 font-medium"
                                >
                                    Bắt đầu phân tích ngay
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
    // Map color to classes roughly
    const bgClasses: any = {
        blue: 'bg-blue-50',
        emerald: 'bg-emerald-50',
        amber: 'bg-amber-50'
    }

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClasses[color] || 'bg-slate-50'}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    )
}

// Icon Helper
function Users({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
