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

    // Fetch Feedback Data
    const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

    // Process data for dashboard
    const processedData = {
        demographics: feedbackData?.filter(f => f.type === 'demographics').map(f => ({
            ...f.details, // Spread the JSON details
            userId: f.user_id,
            timestamp: f.created_at,
            id: f.id
        })) || [],
        aiFeedback: feedbackData?.filter(f => f.type === 'ai_feedback').map(f => ({
            ...f.details,
            userId: f.user_id,
            timestamp: f.created_at,
            id: f.id
        })) || [],
        applicability: feedbackData?.filter(f => f.type === 'applicability').map(f => ({
            ...f.details,
            userId: f.user_id,
            timestamp: f.created_at,
            id: f.id
        })) || []
    }

    return (
        <AdminClientWrapper initialData={processedData} />
    )
}


