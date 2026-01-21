import Link from 'next/link';
import {
  BarChart3,
  Sparkles,
  Shield,
  Zap,
  Brain,
  TrendingUp,
  Layers,
  Activity,
  Network,
  PieChart,
  Users,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { createClient } from "@/utils/supabase/server"
import UserMenu from "@/components/UserMenu"
import Header from '@/components/layout/Header'
// ... (keep other imports)

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      <div className="relative z-10">
        <Header user={user} />

        {/* Hero Section */}

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-8 uppercase tracking-wide">
            <Sparkles className="w-3 h-3" />
            <span>v1.2.0: Stable Release</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
            Phân tích dữ liệu <br />
            <span className="text-indigo-600">Dành cho nhà nghiên cứu</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Công cụ thống kê trực tuyến mạnh mẽ, thay thế SPSS/R.
            <br className="hidden md:block" />
            Miễn phí, không cài đặt, bảo mật tuyệt đối.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              href="/analyze"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-200 transition-transform hover:-translate-y-1"
            >
              Bắt đầu phân tích ngay
            </Link>
            <a
              href="#methods"
              className="px-8 py-4 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 font-medium rounded-xl transition-colors shadow-sm"
            >
              Tìm hiểu tính năng
            </a>
          </div>
        </div>

        {/* Key Features (Cards) */}
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-slate-800">Tốc độ & Tiện lợi</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Chạy trực tiếp trên trình duyệt web với công nghệ WebAssembly. Không cần cài đặt phần mềm nặng nề.</p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-slate-800">Trợ lý Thông minh</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Tích hợp AI giải thích kết quả (Output interpretation) bằng tiếng Việt, giúp bạn hiểu rõ ý nghĩa số liệu.</p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-slate-800">Bảo mật Dữ liệu</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Cơ chế Client-side 100%. Dữ liệu của bạn nằm yên trên máy tính, không bao giờ được gửi lên máy chủ.</p>
            </div>
          </div>
        </div>

        {/* Methods Showcase */}
        <div id="methods" className="container mx-auto px-6 py-20 border-t border-slate-200 bg-white">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-800">
            Phương pháp Phân tích
          </h2>
          <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">
            Hỗ trợ đầy đủ các kiểm định từ cơ bản đến nâng cao cho luận văn/luận án của bạn.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Độ tin cậy", sub: "Cronbach's Alpha", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
              { name: "Khám phá EFA", sub: "Exploratory Factor", icon: Layers, color: "text-blue-600", bg: "bg-blue-50" },
              { name: "Khẳng định CFA", sub: "Confirmatory Factor", icon: Network, color: "text-rose-600", bg: "bg-rose-50" },
              { name: "Mô hình SEM", sub: "Structural Equation", icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
              { name: "Hồi quy", sub: "Regression Analysis", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
              { name: "So sánh nhóm", sub: "T-test & ANOVA", icon: BarChart3, color: "text-cyan-600", bg: "bg-cyan-50" },
              { name: "Tương quan", sub: "Correlation", icon: Network, color: "text-indigo-600", bg: "bg-indigo-50" },
              { name: "Phi tham số", sub: "Non-parametric", icon: Zap, color: "text-yellow-600", bg: "bg-yellow-50" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all cursor-default bg-slate-50/50 hover:bg-white group">
                <div className={`w-10 h-10 ${item.bg} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-sm">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12 text-center text-sm">
          <p className="mb-4">
            © 2026 ncsStat. Phát triển bởi <a href="https://ncskit.org" target="_blank" className="text-white font-semibold hover:underline">NCSKit.org</a>
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-500 font-mono">
            <span>System Status:</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-500">Operaional</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
