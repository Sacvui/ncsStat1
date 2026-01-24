import { createClient } from "@/utils/supabase/server"
import Header from '@/components/layout/Header'
import WebRPreloader from '@/components/WebRPreloader'
import HomeContent from '@/components/landing/HomeContent'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      <div className="relative z-10">
        <Header user={user} />

        {/* Preload R libraries in background */}
        <WebRPreloader />

        {/* Client-side content with i18n translations */}
        <HomeContent />
      </div>
    </div>
  );
}
