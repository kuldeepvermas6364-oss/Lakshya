export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: string;
};

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary is not configured.");

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body,
  });
  if (!response.ok) throw new Error("Cloudinary upload failed.");
  return response.json();
}
