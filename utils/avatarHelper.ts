export const getAvatarUrl = (avatarUrl: string | null | undefined, googleAvatarUrl?: string | null | undefined): string => {
    const DEFAULT_AVATAR = '/webr/default-avatar.png';

    // Check main avatarURL
    if (avatarUrl && avatarUrl !== 'N/A' && avatarUrl !== 'null' && avatarUrl !== '') {
        return avatarUrl;
    }

    // Check google avatar fallback
    if (googleAvatarUrl && googleAvatarUrl !== 'N/A' && googleAvatarUrl !== 'null' && googleAvatarUrl !== '') {
        return googleAvatarUrl;
    }

    return DEFAULT_AVATAR;
};
