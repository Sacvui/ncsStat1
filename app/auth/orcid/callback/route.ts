import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { exchangeOrcidCode, getOrcidProfile } from '@/lib/orcid-auth';

/**
 * ORCID OAuth Callback Handler
 * 
 * This route handles the callback from ORCID OAuth authorization.
 * It exchanges the code for tokens, gets the user profile,
 * and creates/links the user in Supabase.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle errors from ORCID
    if (error) {
        console.error('ORCID OAuth error:', error, errorDescription);
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
        );
    }

    // Validate code
    if (!code) {
        return NextResponse.redirect(
            new URL('/login?error=no_code', request.url)
        );
    }

    // Parse state to get next URL
    let nextUrl = '/analyze';
    try {
        if (state) {
            const stateData = JSON.parse(atob(state));
            nextUrl = stateData.next || '/analyze';
        }
    } catch {
        // State parsing failed, use default
    }

    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/auth/orcid/callback`;

    // Exchange code for tokens
    const tokenData = await exchangeOrcidCode(code, redirectUri);
    if (!tokenData) {
        return NextResponse.redirect(
            new URL('/login?error=orcid_token_exchange_failed', request.url)
        );
    }

    // Get ORCID profile
    const profile = await getOrcidProfile(tokenData.orcid, tokenData.access_token);
    if (!profile) {
        return NextResponse.redirect(
            new URL('/login?error=orcid_profile_failed', request.url)
        );
    }

    // Create or update user in Supabase
    const supabase = await createClient();

    // Check if user already exists with this ORCID
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('orcid_id', tokenData.orcid)
        .single();

    if (existingProfile) {
        // User exists, sign them in
        // Note: For ORCID-only users, we need a custom session mechanism
        // as Supabase doesn't natively support ORCID

        // Update last_active
        await supabase
            .from('profiles')
            .update({ last_active: new Date().toISOString() })
            .eq('id', existingProfile.id);

        // Create a custom session token (simplified - in production use proper JWT)
        const response = NextResponse.redirect(new URL(nextUrl, request.url));
        response.cookies.set('orcid_user', existingProfile.id, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        return response;
    }

    // New ORCID user - redirect to complete profile
    // Store ORCID data temporarily for registration
    const response = NextResponse.redirect(
        new URL(`/auth/complete-profile?orcid=${tokenData.orcid}&name=${encodeURIComponent(profile.name)}`, request.url)
    );

    response.cookies.set('orcid_pending', JSON.stringify({
        orcid: tokenData.orcid,
        name: profile.name,
        email: profile.email,
        access_token: tokenData.access_token,
    }), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
    });

    return response;
}
