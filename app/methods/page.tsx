import Header from '@/components/layout/Header'
import MethodsGuide from '@/components/landing/MethodsGuide'
import { createClient } from "@/utils/supabase/server"

export default async function MethodsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            <div className="relative z-10">
                <Header user={user} />

                <div className="container mx-auto px-6 py-24">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Hướng Dẫn Phân Tích Dữ Liệu</h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Tài liệu chi tiết về cách thực hiện và giải thích kết quả cho từng phương pháp thống kê trên hệ thống ncsStat.
                        </p>
                    </div>

                    <MethodsGuide />
                </div>

                <footer className="bg-slate-900 text-slate-400 py-12 text-center text-sm mt-20">
                    <p className="mb-4">
                        © 2026 ncsStat. Phát triển bởi <a href="https://ncskit.org" target="_blank" className="text-white font-semibold hover:underline">NCSKit.org</a>
                    </p>
                </footer>
            </div>
        </div>
    )
}
