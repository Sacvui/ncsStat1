import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { User, Share2, Copy, BarChart3, Database, Star, Shield } from 'lucide-react'
import Link from 'next/link'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ReferralCard from '@/components/profile/ReferralCard'
import Header from '@/components/layout/Header'

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

    // Fetch referrals count
    const { count: referralsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by_code', profile?.referral_code)

    // Fetch recent projects
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10)

    return (
        <div className="min-h-screen bg-slate-50">
            <Header user={user} />
            <div className="py-12 container mx-auto px-4 max-w-5xl">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: User Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <ProfileHeader user={user} profile={profile} />

                        <div className="mt-8 space-y-4">
                            <ReferralCard referralCode={profile?.referral_code} userId={user.id} />

                            {profile?.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className="block p-4 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 hover:shadow-xl transition-all"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-white/10 rounded-lg">
                                                <Shield className="w-5 h-5 text-purple-300" />
                                            </div>
                                            <span className="font-bold">Quản trị Hệ thống</span>
                                        </div>
                                        <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white uppercase tracking-wider">
                                            Admin
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-sm pl-9">
                                        Truy cập dashboard quản lý phản hồi và cấu hình.
                                    </p>
                                </Link>
                            )}
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
                                <Link
                                    href="/analyze"
                                    className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                    + Tạo dự án mới
                                </Link>
                            </div>

                            <div className="p-6">
                                {projects && projects.length > 0 ? (
                                    <div className="grid gap-4">
                                        {projects.map((project: any) => (
                                            <div key={project.id} className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                                                            {project.name}
                                                        </h4>
                                                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                                                            {project.description || 'Không có mô tả'}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${project.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        project.status === 'archived' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                                            'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}>
                                                        {project.status === 'active' ? 'Đang thực hiện' :
                                                            project.status === 'archived' ? 'Lưu trữ' : 'Nháp'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs text-slate-400 mt-4 border-t border-slate-50 pt-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <BarChart3 className="w-3.5 h-3.5" />
                                                        {new Date(project.updated_at).toLocaleDateString('vi-VN')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Database className="w-3.5 h-3.5" />
                                                        {project.analysis_type || 'Chưa phân tích'}
                                                    </div>
                                                    <div className="ml-auto">
                                                        <button disabled className="text-slate-300 cursor-not-allowed hover:text-blue-600 font-medium transition-colors">
                                                            Mở (Soon) &rarr;
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center py-12">
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
                                )}
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
