/**
 * Profile images live in the public Storage bucket `profile-image`, one file
 * per upload named with a uuidv4. The download URL is split in two:
 * - `NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL` — everything up to and including the bucket
 *   (`https://<project>.supabase.co/storage/v1/object/public/profile-image`)
 * - `profile.image_path` — everything after the bucket (the file name)
 * The bucket enforces the same size/type limits (`supabase/migrations/…_profile_image.sql`).
 */

export const PROFILE_IMAGE_BUCKET = 'profile-image';
export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type ProfileImageProblem = 'type' | 'size';

/** Why `file` cannot be uploaded, or null when it can. */
export function checkProfileImage(file: File): ProfileImageProblem | null {
  if (!PROFILE_IMAGE_TYPES.includes(file.type)) return 'type';
  if (file.size > PROFILE_IMAGE_MAX_BYTES) return 'size';
  return null;
}

/** A new object path inside the bucket. */
export function newProfileImagePath() {
  return crypto.randomUUID();
}

/** Joins the env base URL and a stored `image_path` into the download URL. */
export function profileImageUrl(imagePath: string) {
  const base = (process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/${imagePath.replace(/^\/+/, '')}`;
}
