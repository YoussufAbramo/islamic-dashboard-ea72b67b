import { supabase } from '@/integrations/supabase/client';
import { MEDIA_BUCKET, MEDIA_PATHS, resolveMediaUrl, uploadAndReplaceMedia, getMediaSignedUrl } from '@/lib/mediaStorage';
export const CARTOON_AVATARS: Record<string, string> = {
  'avatar-1': '/system/avatars/avatar-1.png',
  'avatar-2': '/system/avatars/avatar-2.png',
  'avatar-3': '/system/avatars/avatar-3.png',
};

/**
 * Resolve any avatar_url value to a displayable URL.
 * Handles cartoon IDs, full URLs, and storage paths.
 * Now uses the unified 'media' bucket with fallback to legacy 'avatars' bucket.
 */
export async function resolveAvatarUrl(avatarUrl: string): Promise<string> {
  if (!avatarUrl) return '';

  // Check cartoon avatars first
  if (CARTOON_AVATARS[avatarUrl]) {
    return CARTOON_AVATARS[avatarUrl];
  }

  // Full URL — return as-is or re-resolve
  if (avatarUrl.startsWith('http')) {
    return resolveMediaUrl(avatarUrl);
  }

  // If path doesn't start with avatars/, prefix it
  const mediaPath = avatarUrl.startsWith(`${MEDIA_PATHS.avatars}/`)
    ? avatarUrl
    : `${MEDIA_PATHS.avatars}/${avatarUrl}`;

  // Try media bucket first
  const signedUrl = await getMediaSignedUrl(mediaPath);
  if (signedUrl) return signedUrl;

  // Fallback: try legacy avatars bucket
  return getAvatarSignedUrl(avatarUrl);
}

/**
 * Create a signed URL for a file in the legacy avatars bucket.
 * Falls back to empty string on error.
 * @deprecated Use getMediaSignedUrl with MEDIA_PATHS.avatars prefix instead
 */
export async function getAvatarSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  if (!path) return '';
  
  const bucketPrefix = '/object/public/avatars/';
  const signedPrefix = '/object/sign/avatars/';
  let storagePath = path;
  
  if (path.includes(bucketPrefix)) {
    storagePath = path.split(bucketPrefix)[1]?.split('?')[0] || '';
  } else if (path.includes(signedPrefix)) {
    storagePath = path.split(signedPrefix)[1]?.split('?')[0] || '';
  } else if (path.startsWith('http')) {
    return path;
  }
  
  if (!storagePath) return '';
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(storagePath, expiresIn);
  
  if (error || !data?.signedUrl) return '';
  return data.signedUrl;
}

/**
 * Upload an avatar file and return a signed URL.
 * Now uploads to the unified 'media' bucket under avatars/.
 */
export async function uploadAndGetSignedUrl(
  filePath: string,
  file: File,
  expiresIn = 3600
): Promise<{ signedUrl: string; error: string | null }> {
  // Ensure the path is in the media bucket's avatars directory
  const mediaPath = filePath.startsWith(`${MEDIA_PATHS.avatars}/`)
    ? filePath
    : `${MEDIA_PATHS.avatars}/${filePath}`;

  return uploadAndReplaceMedia(mediaPath, file, expiresIn);
}
