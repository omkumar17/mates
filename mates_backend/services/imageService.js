const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// ============================================
// CLOUDINARY IMAGE SERVICE
// ============================================
// Handles:
//   - Uploading images with 9:16 aspect ratio crop
//   - Deleting old/unused images permanently
//   - Extracting public_id from Cloudinary URLs
// ============================================

const FIXED_ASPECT_RATIO = "9:16"; // Matches the site's aspect-9/16
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "gif"];

// ============================================
// Extract Cloudinary public_id from a URL
// ============================================
function extractPublicId(url) {
  if (!url || typeof url !== "string") return null;

  // Cloudinary URL pattern:
  // https://res.cloudinary.com/cloud_name/image/upload/v123456/public_id.ext
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    // Get the part after 'vXXXXXX/'
    const versionAndFile = parts.slice(uploadIndex + 2).join("/");
    // Remove file extension
    const publicId = versionAndFile.replace(/\.[^/.]+$/, "");
    return publicId;
  } catch (err) {
    console.error("Error extracting public_id from URL:", err.message);
    return null;
  }
}

// ============================================
// Validate uploaded file
// ============================================
function validateFile(file) {
  const errors = [];

  // Check file exists
  if (!file) {
    errors.push("No file provided.");
    return errors;
  }

  // Check file size (max 5MB)
  const fileSizeMB = file.buffer.length / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    errors.push(
      `File size (${fileSizeMB.toFixed(1)}MB) exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB.`
    );
  }

  // Check file format
  const mimeType = file.mimetype || "";
  const ext = mimeType.split("/")[1]?.toLowerCase();
  if (!ext || !ALLOWED_FORMATS.includes(ext)) {
    errors.push(
      `Invalid file format "${mimeType}". Allowed formats: ${ALLOWED_FORMATS.join(", ")}.`
    );
  }

  return errors;
}

// ============================================
// Upload a single image to Cloudinary with crop
// ============================================
// @param {Object} file - Multer file object (buffer, mimetype, originalname)
// @param {Object} cropData - Optional crop coordinates { x, y, width, height }
// @param {String} folder - Cloudinary folder name (default: "mates/profiles")
// @returns {Promise<Object>} - { secure_url, public_id, width, height }
// ============================================
async function uploadImage(file, cropData = null, folder = "mates/profiles") {
  // Validate file first
  const validationErrors = validateFile(file);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(" "));
  }

  return new Promise((resolve, reject) => {
    // Build Cloudinary upload options
    const uploadOptions = {
      folder,
      resource_type: "image",
      // Enforce 9:16 aspect ratio cropping
      aspect_ratio: FIXED_ASPECT_RATIO,
      crop: "crop",
      // gravity: "auto", // Automatically focuses on face/important area
      // Quality and format optimization
      quality: "auto",
      fetch_format: "auto",
      // Metadata removal for privacy
      strip_metadata: true,
    };

    // If user provided custom crop coordinates, use them
    if (cropData && cropData.x !== undefined && cropData.y !== undefined) {
      uploadOptions.x = cropData.x;
      uploadOptions.y = cropData.y;
      uploadOptions.width = cropData.width || 800;
      uploadOptions.height = cropData.height || Math.round(cropData.width * (16 / 9));
      uploadOptions.crop = "crop";
      uploadOptions.gravity = "custom"; // Use custom coordinates
    }

    // Upload buffer using streamifier
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(new Error(`Image upload failed: ${error.message}`));
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
}

// ============================================
// Upload multiple images to Cloudinary
// ============================================
// @param {Array} files - Array of multer file objects
// @param {Array} cropDataArray - Array of crop data objects (optional)
// @returns {Promise<Array>} - Array of { secure_url, public_id }
// ============================================
async function uploadMultipleImages(files, cropDataArray = []) {
  if (!files || files.length === 0) {
    throw new Error("No files provided for upload.");
  }

  const uploadPromises = files.map((file, index) => {
    const cropData = cropDataArray[index] || null;
    return uploadImage(file, cropData);
  });

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    // If any upload fails, clean up already uploaded images
    console.error("Batch upload failed, cleaning up...");
    const successfulUploads = [];
    for (const result of results) {
      if (result && result.public_id) {
        successfulUploads.push(result);
      }
    }
    
    // Clean up partially uploaded images
    if (successfulUploads.length > 0) {
      await cleanupImages(successfulUploads.map((r) => r.public_id));
    }

    throw new Error(`Batch image upload failed: ${error.message}`);
  }
}

// ============================================
// Delete a single image from Cloudinary permanently
// ============================================
// @param {String} publicIdOrUrl - Public ID or full Cloudinary URL
// @returns {Promise<Object>} - { result: "ok" | "not found" }
// ============================================
async function deleteImage(publicIdOrUrl) {
  if (!publicIdOrUrl) {
    return { result: "not found", message: "No public ID provided." };
  }

  // Extract public_id if a URL was provided
  let publicId = publicIdOrUrl;
  if (publicIdOrUrl.startsWith("http")) {
    publicId = extractPublicId(publicIdOrUrl);
  }

  if (!publicId) {
    console.warn(`Could not extract public_id from: ${publicIdOrUrl}`);
    return { result: "not found", message: "Invalid Cloudinary URL." };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true, // Also invalidate CDN cache
    });

    if (result.result === "ok") {
      console.log(`Successfully deleted image: ${publicId}`);
    } else if (result.result === "not found") {
      console.warn(`Image not found in Cloudinary: ${publicId}`);
    }

    return result;
  } catch (error) {
    console.error(`Error deleting image ${publicId}:`, error.message);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

// ============================================
// Delete multiple images from Cloudinary permanently
// ============================================
// @param {Array} publicIdsOrUrls - Array of public IDs or Cloudinary URLs
// ============================================
async function deleteMultipleImages(publicIdsOrUrls) {
  if (!publicIdsOrUrls || publicIdsOrUrls.length === 0) {
    return { result: "ok", deleted: 0 };
  }

  const deletePromises = publicIdsOrUrls.map((id) => deleteImage(id));

  try {
    const results = await Promise.allSettled(deletePromises);

    const successful = results.filter((r) => r.status === "fulfilled" && r.value.result === "ok").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Deleted ${successful} images from Cloudinary. Failed: ${failed}`);

    return {
      result: "ok",
      deleted: successful,
      failed,
    };
  } catch (error) {
    console.error("Batch delete error:", error.message);
    throw new Error(`Failed to delete images: ${error.message}`);
  }
}

// ============================================
// Cleanup - Delete images by public IDs
// (Alias for deleteMultipleImages)
// ============================================
async function cleanupImages(publicIdsOrUrls) {
  return deleteMultipleImages(publicIdsOrUrls);
}

// ============================================
// Find and delete old images that are no longer in use
// ============================================
// @param {Array} oldImages - Previous images from DB [strings or { url, publicId }]
// @param {Array} newImages - New images submitted by user [strings or { url, publicId }]
// @returns {Promise<Object>} - Deletion result
// ============================================
async function deleteUnusedImages(oldImages, newImages) {
  if (!oldImages || oldImages.length === 0) {
    return { result: "ok", deleted: 0 };
  }

  // Normalize images: extract publicIds from both formats
  const getPublicId = (img) => {
    if (typeof img === "string") return extractPublicId(img);
    if (img && typeof img === "object") return img.publicId || extractPublicId(img.url);
    return null;
  };

  const getUrl = (img) => {
    if (typeof img === "string") return img;
    if (img && typeof img === "object") return img.url;
    return null;
  };

  const newUrls = (newImages || []).map(getUrl).filter(Boolean);
  const newUrlSet = new Set(newUrls);

  // Find images that were in old list but NOT in new list
  const unusedImages = oldImages.filter((img) => {
    const url = getUrl(img);
    return url && !newUrlSet.has(url);
  });

  if (unusedImages.length === 0) {
    return { result: "ok", deleted: 0, message: "No unused images to delete." };
  }

  console.log(`Found ${unusedImages.length} unused image(s) to delete from Cloudinary.`);

  // Collect public_ids directly (preferred) or extract from URLs
  const publicIds = unusedImages
    .map((img) => getPublicId(img))
    .filter(Boolean);

  if (publicIds.length === 0) {
    return { result: "ok", deleted: 0, message: "No valid Cloudinary public_ids to delete." };
  }

  return deleteMultipleImages(publicIds);
}

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  cleanupImages,
  deleteUnusedImages,
  extractPublicId,
  validateFile,
  FIXED_ASPECT_RATIO,
  ALLOWED_FORMATS,
  MAX_FILE_SIZE_MB,
};

