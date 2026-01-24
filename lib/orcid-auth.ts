// ORCID OAuth utility functions - no 'use server' needed

/**
 * ORCID OAuth Authentication Service
 * 
 * ORCID API Documentation: https://info.orcid.org/documentation/api-tutorials/
 * 
 * To enable ORCID login, you need to:
 * 1. Register an app at https://orcid.org/developer-tools
 * 2. Set ORCID_CLIENT_ID and ORCID_CLIENT_SECRET in Vercel
 * 3. Add redirect URI: https://stat.ncskit.org/auth/orcid/callback
 */

const ORCID_AUTH_URL = 'https://orcid.org/oauth/authorize';
const ORCID_TOKEN_URL = 'https://orcid.org/oauth/token';
const ORCID_API_URL = 'https://pub.orcid.org/v3.0';

// Get these from Vercel environment variables
const ORCID_CLIENT_ID = process.env.ORCID_CLIENT_ID || '';
const ORCID_CLIENT_SECRET = process.env.ORCID_CLIENT_SECRET || '';

interface OrcidTokenResponse {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    name: string;
    orcid: string;
}

interface OrcidProfile {
    orcid: string;
    name: string;
    email?: string;
}

/**
 * Generate ORCID authorization URL
 */
export function getOrcidAuthUrl(redirectUri: string, state: string): string {
    if (!ORCID_CLIENT_ID) {
        throw new Error('ORCID_CLIENT_ID not configured');
    }

    const params = new URLSearchParams({
        client_id: ORCID_CLIENT_ID,
        response_type: 'code',
        scope: '/authenticate',
        redirect_uri: redirectUri,
        state: state,
    });

    return `${ORCID_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeOrcidCode(
    code: string,
    redirectUri: string
): Promise<OrcidTokenResponse | null> {
    if (!ORCID_CLIENT_ID || !ORCID_CLIENT_SECRET) {
        console.error('ORCID credentials not configured');
        return null;
    }

    try {
        const response = await fetch(ORCID_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: new URLSearchParams({
                client_id: ORCID_CLIENT_ID,
                client_secret: ORCID_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('ORCID token exchange failed:', error);
            return null;
        }

        const data: OrcidTokenResponse = await response.json();
        return data;
    } catch (error) {
        console.error('ORCID token exchange error:', error);
        return null;
    }
}

/**
 * Get ORCID profile information
 */
export async function getOrcidProfile(
    orcidId: string,
    accessToken: string
): Promise<OrcidProfile | null> {
    try {
        const response = await fetch(`${ORCID_API_URL}/${orcidId}/person`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            console.error('ORCID profile fetch failed');
            return null;
        }

        const data = await response.json();

        // Extract name from ORCID response
        const givenNames = data?.name?.['given-names']?.value || '';
        const familyName = data?.name?.['family-name']?.value || '';
        const fullName = `${givenNames} ${familyName}`.trim();

        // Extract primary email if available
        const emails = data?.emails?.email || [];
        const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email;

        return {
            orcid: orcidId,
            name: fullName || `ORCID User ${orcidId}`,
            email: primaryEmail,
        };
    } catch (error) {
        console.error('ORCID profile fetch error:', error);
        return null;
    }
}

/**
 * Check if ORCID is configured
 */
export function isOrcidConfigured(): boolean {
    return !!(ORCID_CLIENT_ID && ORCID_CLIENT_SECRET);
}
