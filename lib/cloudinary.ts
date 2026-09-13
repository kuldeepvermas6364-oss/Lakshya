import { uploadMedia } from "./storage";

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: string;
};

/**
 * Backward-compatible helper for existing Lakshya features.
 * New code should use uploadMedia() so category, metadata and cleanup remain consistent.
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const media = await uploadMedia(file, "posts");
  return {
    secure_url: media.secureUrl,
    public_id: media.publicId,
    resource_type: media.resourceType,
  };
}
