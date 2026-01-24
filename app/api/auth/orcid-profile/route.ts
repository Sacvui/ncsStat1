import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Force dynamic to prevent build-time env var access
export const dynamic = 'force-dynamic';

/**
 * API Route để tạo/cập nhật profile cho ORCID users
 * 
 * ORCID users không có auth.users entry nên cần dùng service role
 * để insert trực tiếp vào profiles table với orcid_id
 */

// Lazy-init Supabase admin client to avoid build-time errors
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );
    }
    return _supabaseAdmin;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orcid, name, email } = body;

        if (!orcid || !email) {
            return NextResponse.json(
                { error: 'ORCID và email là bắt buộc' },
                { status: 400 }
            );
        }

        // Check if profile already exists with this email
        const { data: existingByEmail } = await getSupabaseAdmin()
            .from('profiles')
            .select('id, orcid_id, full_name')
            .eq('email', email)
            .single();

        if (existingByEmail) {
            // Update existing profile with ORCID
            const { error: updateError } = await getSupabaseAdmin()
                .from('profiles')
                .update({
                    orcid_id: orcid,
                    full_name: name || existingByEmail.full_name,
                    last_active: new Date().toISOString(),
                })
                .eq('id', existingByEmail.id);

            if (updateError) {
                console.error('Update profile error:', updateError);
                return NextResponse.json(
                    { error: 'Không thể cập nhật profile' },
                    { status: 500 }
                );
            }

            // Generate magic link for auto-login (existing user by email)
            const { data: linkData } = await getSupabaseAdmin().auth.admin.generateLink({
                type: 'magiclink',
                email: email,
                options: {
                    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://stat.ncskit.org'}/analyze`
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Profile đã được cập nhật với ORCID',
                profileId: existingByEmail.id,
                verifyUrl: linkData?.properties?.action_link
            });
        }

        // Check if profile exists with this ORCID
        const { data: existingByOrcid } = await getSupabaseAdmin()
            .from('profiles')
            .select('id')
            .eq('orcid_id', orcid)
            .single();

        if (existingByOrcid) {
            // Update last_active
            await getSupabaseAdmin()
                .from('profiles')
                .update({ last_active: new Date().toISOString() })
                .eq('id', existingByOrcid.id);

            // Get email for existing ORCID user to generate magic link
            const { data: orcidProfile } = await getSupabaseAdmin()
                .from('profiles')
                .select('email')
                .eq('id', existingByOrcid.id)
                .single();

            let verifyUrl = null;
            if (orcidProfile?.email) {
                const { data: linkData } = await getSupabaseAdmin().auth.admin.generateLink({
                    type: 'magiclink',
                    email: orcidProfile.email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://stat.ncskit.org'}/analyze`
                    }
                });
                verifyUrl = linkData?.properties?.action_link;
            }

            return NextResponse.json({
                success: true,
                message: 'ORCID user đã tồn tại',
                profileId: existingByOrcid.id,
                verifyUrl: verifyUrl
            });
        }

        // Create new profile for ORCID user
        // Since profiles.id is FK to auth.users, we need to create with generated UUID
        // This requires updating schema to allow nullable or different approach

        // For now, we'll use a separate orcid_profiles table or create temp auth user
        // Option: Use Supabase Admin API to create a dummy auth user

        const { data: authUser, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                orcid_id: orcid,
                provider: 'orcid'
            }
        });

        if (authError) {
            console.error('Create auth user error:', authError);
            return NextResponse.json(
                { error: 'Không thể tạo tài khoản: ' + authError.message },
                { status: 500 }
            );
        }

        // The trigger will auto-create profile, but we need to add orcid_id
        const { error: orcidUpdateError } = await getSupabaseAdmin()
            .from('profiles')
            .update({
                orcid_id: orcid,
                last_active: new Date().toISOString()
            })
            .eq('id', authUser.user.id);

        if (orcidUpdateError) {
            console.error('Update ORCID error:', orcidUpdateError);
        }

        // Generate magic link for auto-login
        const { data: linkData, error: linkError } = await getSupabaseAdmin().auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://stat.ncskit.org'}/analyze`
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Profile đã được tạo thành công',
            profileId: authUser.user.id,
            userId: authUser.user.id,
            // Return the magic link token hash for client-side verification
            magicLinkToken: linkData?.properties?.hashed_token,
            verifyUrl: linkError ? null : linkData?.properties?.action_link
        });

    } catch (error: any) {
        console.error('ORCID profile API error:', error);
        return NextResponse.json(
            { error: error.message || 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}
