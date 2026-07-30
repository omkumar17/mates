const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const imageService = require("../services/imageService");

const router = express.Router();

// ============================================
// Multer Configuration (Memory Storage)
// ============================================
// Files are stored in memory as Buffer, then uploaded
// to Cloudinary directly from buffer.
// This avoids writing temp files to disk.
// ============================================
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${file.mimetype}". Only JPEG, PNG, WebP, and GIF images are allowed.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: imageService.MAX_FILE_SIZE_MB * 1024 * 1024, // 5MB in bytes
    files: 3, // Max 3 files at once
  },
});

// ============================================
// POST /api/upload
// Upload up to 3 images to Cloudinary
// ============================================
// Body (multipart/form-data):
//   - images[]: File(s) - up to 3 image files
//   - cropData: JSON string - optional crop coordinates
//       Format: '[{"x":0,"y":0,"width":800,"height":1422}, ...]'
//
// Response:
//   { success: true, images: [{ secure_url, public_id, width, height }] }
// ============================================
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload.array("images", 3)(req, res, (err) => {
      if (err) {
        // Handle multer-specific errors
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              message: `File too large. Maximum size is ${imageService.MAX_FILE_SIZE_MB}MB.`,
            });
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
              success: false,
              message: "Too many files. Maximum 3 images allowed.",
            });
          }
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
              success: false,
              message: "Unexpected file field. Use field name 'images'.",
            });
          }
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        // Handle custom file filter errors
        if (err.message && err.message.includes("Invalid file type")) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        return res.status(500).json({
          success: false,
          message: "Upload error occurred.",
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const files = req.files;

      // Validate at least one file
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No image files provided. Please select at least one image.",
        });
      }

      // Parse optional crop data from JSON body
      let cropDataArray = [];
      if (req.body.cropData) {
        try {
          cropDataArray = JSON.parse(req.body.cropData);
          if (!Array.isArray(cropDataArray)) {
            cropDataArray = [cropDataArray];
          }
        } catch (e) {
          console.warn("Invalid cropData JSON:", req.body.cropData);
          cropDataArray = [];
        }
      }

      // Upload images to Cloudinary
      const uploadedImages = await imageService.uploadMultipleImages(
        files,
        cropDataArray
      );

      // Map to simpler response format
      const imageResults = uploadedImages.map((img) => ({
        secure_url: img.secure_url,
        public_id: img.public_id,
        width: img.width,
        height: img.height,
        format: img.format,
      }));

      return res.status(200).json({
        success: true,
        message: `${imageResults.length} image(s) uploaded successfully.`,
        images: imageResults,
      });
    } catch (error) {
      console.error("Upload route error:", error.message);

      // Check for validation errors
      if (error.message && error.message.includes("No files provided")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && error.message.includes("File size")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message && error.message.includes("Invalid file format")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Image upload failed. Please try again.",
      });
    }
  }
);

// ============================================
// DELETE /api/upload/:publicId
// Delete a single image from Cloudinary
// ============================================
router.delete("/:publicId", authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "No image public_id provided.",
      });
    }

    const result = await imageService.deleteImage(publicId);

    if (result.result === "ok") {
      return res.status(200).json({
        success: true,
        message: "Image deleted successfully.",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Image not found in Cloudinary.",
      });
    }
  } catch (error) {
    console.error("Delete image error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete image. Please try again.",
    });
  }
});

// ============================================
// Multer Error Handler Middleware
// ============================================
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
});

module.exports = router;

