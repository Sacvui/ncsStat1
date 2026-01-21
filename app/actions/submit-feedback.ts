'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitFeedback(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const content = formData.get('content') as string
    const rating = formData.get('rating') as string

    if (!content || !rating) {
        return {
            error: 'Vui lòng điền đầy đủ thông tin',
            success: false
        }
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            error: 'Bạn cần đăng nhập để gửi phản hồi',
            success: false
        }
    }

    // Insert feedback
    // Note: RLS ensures users can only insert their own feedback
    // Unique constraint ensures one per user
    const { error } = await supabase
        .from('feedback')
        .insert({
            user_id: user.id,
            content,
            rating: parseInt(rating),
        })

    if (error) {
        if (error.code === '23505') { // Unique violation
            return {
                error: 'Bạn đã gửi phản hồi trước đó. Mỗi người dùng chỉ được gửi 1 lần.',
                success: false
            }
        }
        console.error('Feedback Error:', error)
        return {
            error: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
            success: false
        }
    }

    revalidatePath('/admin/feedback')
    return {
        success: true,
        message: 'Cảm ơn bạn đã gửi phản hồi!'
    }
}
