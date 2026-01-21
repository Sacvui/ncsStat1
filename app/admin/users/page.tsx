import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UsersTable from '@/components/admin/UsersTable'

export default async function AdminUsersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/admin/users')
    }

    // Check Admin Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/')
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h1>
                <p className="text-slate-500 text-sm">Danh sách tài khoản và hồ sơ học thuật của thành viên.</p>
            </div>

            <UsersTable />
        </div>
    )
}
