import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

/**
 * Configure Cloudinary with environment variables
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a local file to Cloudinary and delete the local temp file
 * @param {string} localFilePath - Path of the file saved temporarily on disk
 * @param {string} folder - Target folder on Cloudinary
 * @returns {Promise<object|null>} - Cloudinary upload result object
 */
const uploadOnCloudinary = async (localFilePath, folder = "ecommerce") => {
  if (!localFilePath) return null;

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: "auto"
    });

    // Remove the locally saved temporary file on success
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);

    // Clean up local file if upload failed
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

/**
 * Delete an asset from Cloudinary by its public ID
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object|null>}
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message);
    return null;
  }
};

export { cloudinary, uploadOnCloudinary, deleteFromCloudinary };
