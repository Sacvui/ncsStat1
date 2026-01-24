/**
 * API Route: Unlock Researcher Role
 * Users can enter a secret code to upgrade their account to "researcher" role
 * This grants access to R Syntax viewer and other premium features
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Secret code for researcher unlock - should be stored in env variable in production
const RESEARCHER_SECRET_CODE = process.env.RESEARCHER_UNLOCK_CODE || 'NCS2026RESEARCH';

export async function POST(request: NextRequest) {
    try {
        const { secretCode } = await request.json();

        if (!secretCode) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập mã bí mật' },
                { status: 400 }
            );
        }

        // Validate secret code
        if (secretCode.toUpperCase().trim() !== RESEARCHER_SECRET_CODE.toUpperCase()) {
            return NextResponse.json(
                { success: false, error: 'Mã bí mật không đúng. Vui lòng liên hệ admin để được cấp mã.' },
                { status: 403 }
            );
        }

        // Get current user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Bạn cần đăng nhập để sử dụng tính năng này' },
                { status: 401 }
            );
        }

        // Check if user is already researcher or admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            return NextResponse.json(
                { success: false, error: 'Không thể kiểm tra thông tin tài khoản' },
                { status: 500 }
            );
        }

        // If already researcher or admin, no need to upgrade
        if (profile?.role === 'researcher' || profile?.role === 'admin') {
            return NextResponse.json({
                success: true,
                message: 'Tài khoản của bạn đã là Researcher!',
                alreadyResearcher: true
            });
        }

        // Upgrade user to researcher role
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                role: 'researcher',
                researcher_unlocked_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating role:', updateError);
            return NextResponse.json(
                { success: false, error: 'Không thể nâng cấp tài khoản. Vui lòng thử lại sau.' },
                { status: 500 }
            );
        }

        // Log this action (ignore errors)
        try {
            await supabase.from('user_activities').insert({
                user_id: user.id,
                action_type: 'researcher_unlock',
                metadata: { method: 'secret_code' }
            });
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json({
            success: true,
            message: 'Chúc mừng! Tài khoản của bạn đã được nâng cấp lên Researcher. Bạn có thể truy cập R Syntax code ngay bây giờ.',
            newRole: 'researcher'
        });

    } catch (error) {
        console.error('Unlock researcher error:', error);
        return NextResponse.json(
            { success: false, error: 'Có lỗi xảy ra. Vui lòng thử lại sau.' },
            { status: 500 }
        );
    }
}
