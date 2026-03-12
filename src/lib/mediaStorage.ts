/**
 * Centralized Media Storage Utility
 * 
 * All media files are stored in a single "media" bucket with organized subdirectories:
 * 
 * media/
 * ├── avatars/              # Default avatars and user-uploaded profile images
 * ├── ebooks/
 * │   ├── pdf/              # Uploaded ebook PDF files
 * │   └── covers/           # Ebook cover images
 * ├── courses/
 * │   ├── images/           # Course thumbnails
 * │   ├── pdf/              # Course PDF materials
 * │   ├── audio/            # Audio lessons
 * │   └── video/            # Video lessons
 * ├── certificates/         # Generated or uploaded certificates
 * ├── contracts/            # Contracts and legal documents
 * ├── cv/                   # Uploaded CV / resumes
 * ├── system/               # System-level assets
 * └── website/
 *     ├── blogs/            # Blog-related images/media
 *     ├── pages/            # Static page media
 *     └── other/            # Miscellaneous website media
 */

import { supabase } from '@/integrations/supabase/client';

// ─── Constants ──────────────────────────────────────────────
export const MEDIA_BUCKET = 'media';

/** All valid media domain paths */
export const MEDIA_PATHS = {
  avatars: 'avatars',
  ebooks: {
    pdf: 'ebooks/pdf',
    covers: 'ebooks/covers',
  },
  courses: {
    images: 'courses/images',
    pdf: 'courses/pdf',
    audio: 'courses/audio',
    video: 'courses/video',
  },
  certificates: 'certificates',
  contracts: 'contracts',
  cv: 'cv',
  system: 'system',
  website: {
    blogs: 'website/blogs',
    pages: 'website/pages',
    other: 'website/other',
  },
} as const;

/** Legacy bucket names mapped to new media paths for backward compatibility */
const LEGACY_BUCKET_MAP: Record<string, string> = {
  avatars: MEDIA_PATHS.avatars,
  ebooks: 'ebooks',
  'course-images': MEDIA_PATHS.courses.images,
};

// ─── URL Resolution Helpers ─────────────────────────────────

/**
 * Extract the storage path from a full Supabase URL.
 * Handles public URLs, signed URLs, and legacy bucket references.
 */
export function extractStoragePath(url: string): { bucket: string; path: string } | null {
  if (!url || !url.startsWith('http')) return null;

  // Match patterns like /object/public/<bucket>/ or /object/sign/<bucket>/
  const match = url.match(/\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/);
  if (!match) return null;

  return { bucket: match[1], path: match[2] };
}

/**
 * Resolve any media reference to a displayable signed URL.
 * Handles:
 * - Full URLs (returned as-is)
 * - Paths within the media bucket
 * - Legacy bucket paths (avatars/*, ebooks/*, course-images/*)
 */
export async function resolveMediaUrl(
  pathOrUrl: string,
  options: { expiresIn?: number } = {}
): Promise<string> {
  if (!pathOrUrl) return '';

  const { expiresIn = 3600 } = options;

  // Full URL — check if it's a Supabase URL that needs re-signing
  if (pathOrUrl.startsWith('http')) {
    const parsed = extractStoragePath(pathOrUrl);
    if (!parsed) return pathOrUrl; // External URL, return as-is

    // If it's from a legacy bucket, resolve from that bucket
    if (parsed.bucket !== MEDIA_BUCKET && LEGACY_BUCKET_MAP[parsed.bucket]) {
      const { data } = await supabase.storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.path, expiresIn);
      return data?.signedUrl || pathOrUrl;
    }

    // If it's from the media bucket, re-sign
    if (parsed.bucket === MEDIA_BUCKET) {
      const { data } = await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(parsed.path, expiresIn);
      return data?.signedUrl || pathOrUrl;
    }

    return pathOrUrl;
  }

  // Storage path — get signed URL from media bucket
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(pathOrUrl, expiresIn);

  if (error || !data?.signedUrl) {
    // Fallback: try legacy buckets
    for (const [legacyBucket, prefix] of Object.entries(LEGACY_BUCKET_MAP)) {
      if (pathOrUrl.startsWith(prefix + '/') || pathOrUrl.startsWith(legacyBucket + '/')) {
        const legacyPath = pathOrUrl.startsWith(prefix + '/')
          ? pathOrUrl.slice(prefix.length + 1)
          : pathOrUrl.slice(legacyBucket.length + 1);
        const { data: legacyData } = await supabase.storage
          .from(legacyBucket)
          .createSignedUrl(legacyPath, expiresIn);
        if (legacyData?.signedUrl) return legacyData.signedUrl;
      }
    }
    return '';
  }

  return data.signedUrl;
}

// ─── Upload Helpers ─────────────────────────────────────────

/**
 * Build a unique file path within a media domain directory.
 */
export function buildMediaPath(directory: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${directory}/${timestamp}-${sanitized}`;
}

/**
 * Upload a file to the media bucket and return a signed URL.
 */
export async function uploadMedia(
  directory: string,
  file: File,
  options: { fileName?: string; upsert?: boolean; expiresIn?: number } = {}
): Promise<{ path: string; signedUrl: string; error: string | null }> {
  const { fileName, upsert = false, expiresIn = 3600 } = options;
  const filePath = buildMediaPath(directory, fileName || file.name);

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert });

  if (error) return { path: '', signedUrl: '', error: error.message };

  const { data } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(filePath, expiresIn);

  return {
    path: filePath,
    signedUrl: data?.signedUrl || '',
    error: null,
  };
}

/**
 * Upload a file with upsert enabled (for updating existing files like avatars).
 */
export async function uploadAndReplaceMedia(
  filePath: string,
  file: File,
  expiresIn = 3600
): Promise<{ signedUrl: string; error: string | null }> {
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(filePath, file, { upsert: true });

  if (error) return { signedUrl: '', error: error.message };

  const { data } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(filePath, expiresIn);

  return { signedUrl: data?.signedUrl || '', error: null };
}

// ─── Download / Delete Helpers ──────────────────────────────

/**
 * Download a file from the media bucket.
 */
export async function downloadMedia(path: string) {
  return supabase.storage.from(MEDIA_BUCKET).download(path);
}

/**
 * Delete one or more files from the media bucket.
 */
export async function deleteMedia(paths: string[]) {
  return supabase.storage.from(MEDIA_BUCKET).remove(paths);
}

// ─── List / Browse Helpers ──────────────────────────────────

/**
 * List files within a directory in the media bucket.
 */
export async function listMediaFiles(
  directory: string,
  options: { limit?: number; offset?: number; sortBy?: { column: string; order: string } } = {}
) {
  const { limit = 200, sortBy = { column: 'created_at', order: 'desc' } } = options;
  return supabase.storage
    .from(MEDIA_BUCKET)
    .list(directory, { limit, sortBy: sortBy as any });
}

/**
 * Create a signed URL for a file in the media bucket.
 */
export async function getMediaSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  if (!path) return '';
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return '';
  return data.signedUrl;
}

/**
 * Create signed URLs for multiple files.
 */
export async function getMediaSignedUrls(paths: string[], expiresIn = 3600) {
  return supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths, expiresIn);
}

// ─── Domain-Specific Convenience Functions ──────────────────

/** Upload an avatar image */
export async function uploadAvatar(userId: string, file: File) {
  const filePath = `${MEDIA_PATHS.avatars}/${userId}/${file.name}`;
  return uploadAndReplaceMedia(filePath, file);
}

/** Upload an ebook PDF */
export async function uploadEbookPdf(file: File) {
  return uploadMedia(MEDIA_PATHS.ebooks.pdf, file);
}

/** Upload an ebook cover */
export async function uploadEbookCover(file: File) {
  return uploadMedia(MEDIA_PATHS.ebooks.covers, file);
}

/** Upload a course image */
export async function uploadCourseImage(file: File) {
  return uploadMedia(MEDIA_PATHS.courses.images, file);
}

/** Upload a course PDF */
export async function uploadCoursePdf(file: File) {
  return uploadMedia(MEDIA_PATHS.courses.pdf, file);
}

/** Upload a course audio file */
export async function uploadCourseAudio(file: File) {
  return uploadMedia(MEDIA_PATHS.courses.audio, file);
}

/** Upload a course video file */
export async function uploadCourseVideo(file: File) {
  return uploadMedia(MEDIA_PATHS.courses.video, file);
}

/** Upload a certificate */
export async function uploadCertificate(file: File) {
  return uploadMedia(MEDIA_PATHS.certificates, file);
}

/** Upload a contract */
export async function uploadContract(file: File) {
  return uploadMedia(MEDIA_PATHS.contracts, file);
}

/** Upload a CV / resume */
export async function uploadCV(file: File) {
  return uploadMedia(MEDIA_PATHS.cv, file);
}

/** Upload a system asset */
export async function uploadSystemAsset(file: File) {
  return uploadMedia(MEDIA_PATHS.system, file);
}

/** Upload a blog image */
export async function uploadBlogImage(file: File) {
  return uploadMedia(MEDIA_PATHS.website.blogs, file);
}

/** Upload a website page image */
export async function uploadPageImage(file: File) {
  return uploadMedia(MEDIA_PATHS.website.pages, file);
}

/** Upload miscellaneous website media */
export async function uploadWebsiteOther(file: File) {
  return uploadMedia(MEDIA_PATHS.website.other, file);
}
