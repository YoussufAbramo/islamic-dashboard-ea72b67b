import { supabase } from '@/integrations/supabase/client';

/**
 * Create a signed URL for a file in the avatars bucket.
 * Falls back to empty string on error.
 * @param path - The storage path (e.g. "user-id/avatar.png" or "branding/logo.png")
 * @param expiresIn - Seconds until the URL expires (default 3600 = 1 hour)
 */
export async function getAvatarSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  if (!path) return '';
  
  // If it's already a full URL, extract the path after /avatars/
  const bucketPrefix = '/object/public/avatars/';
  const signedPrefix = '/object/sign/avatars/';
  let storagePath = path;
  
  if (path.includes(bucketPrefix)) {
    storagePath = path.split(bucketPrefix)[1]?.split('?')[0] || '';
  } else if (path.includes(signedPrefix)) {
    storagePath = path.split(signedPrefix)[1]?.split('?')[0] || '';
  } else if (path.startsWith('http')) {
    // Unknown URL format, return as-is
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
 * Upload a file and return a signed URL (not a public URL).
 */
export async function uploadAndGetSignedUrl(
  filePath: string,
  file: File,
  expiresIn = 3600
): Promise<{ signedUrl: string; error: string | null }> {
  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (error) return { signedUrl: '', error: error.message };

  const signedUrl = await getAvatarSignedUrl(filePath, expiresIn);
  return { signedUrl, error: null };
}
