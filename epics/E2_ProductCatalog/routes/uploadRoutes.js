// ============================================
// Upload Routes
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: Product image upload API endpoints
// ============================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  protect,
  authorize,
} = require("../../E1_UserAndRoleManagement/middleware/auth");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Sanitize filename and add timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File Filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB
  fileFilter: fileFilter,
}).single("image");

// @route   POST /api/upload
// @desc    Upload an image
// @access  Private (Admin/Product Manager/Marketing Manager)
router.post(
  "/",
  protect,
  authorize("product_manager", "admin", "marketing_manager"),
  (req, res) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.error("Multer Error:", err);
        return res.status(400).json({
          success: false,
          message: `Multer upload error: ${err.message}`,
        });
      } else if (err) {
        // An unknown error occurred when uploading.
        console.error("Unknown Upload Error:", err);
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Everything went fine.
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      console.log(`✅ File uploaded successfully: ${req.file.filename}`);

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        url: `/uploads/${req.file.filename}`,
      });
    });
  },
);

module.exports = router;
