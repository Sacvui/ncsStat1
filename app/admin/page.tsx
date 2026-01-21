import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { FeedbackService } from '@/lib/feedback-service'
import DashboardCharts from '@/components/admin/DashboardCharts'
import FeedbackTable from '@/components/admin/FeedbackTable'
import AdminClientWrapper from '@/components/admin/AdminClientWrapper'

export default async function AdminPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/admin')
    }

    // Check Admin Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/') // Or show 403 Forbidden
    }

    return (
        <AdminClientWrapper />
    )
}


