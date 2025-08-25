import express from "express";
import multer from "multer";
import { responseClient } from "../middleware/responseClient.js";
import {
  deleteMediaFromCloudinary,
  uploadMediaToCloudinary,
} from "../config/cloudinaryConfig.js";

const imageRouter = express.Router();

// Configure disk storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the destination folder for uploads
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    //  Create unique suffix (timestamp + random number)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    //  Get file extension
    const fileName = uniqueSuffix + "-" + file.originalname;
    //  Combine both  parts
    cb(null, fileName);
  },
});

// Create multer instance with disk storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow all image MIME types (including WebP, SVG, TIFF, BMP, etc.)
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// POST | upload a file | create
imageRouter.post("/", upload.array("images", 5), async (req, res, next) => {
  try {
    // Check if files exist
    if (!req.files || req.files.length === 0) {
      return responseClient({
        res,
        statusCode: 400,
        message: "No files provided",
      });
    }

    // Upload files to Cloudinary
    const results = await Promise.all(
      req.files.map((file) => uploadMediaToCloudinary(file.path))
    );
    console.log("Result is", results);

    // Optional: Clean up local files after upload
    // req.files.forEach(file => fs.unlinkSync(file.path));

    // return responseClient({
    //   res,
    //   payload: results,
    //   message: "Files uploaded successfully",
    //   statusCode: 200,
    // });
    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      data: results.map((result) => ({
        url: result.secure_url,
        public_id: result.public_id,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE | delete a file | delete
imageRouter.delete("/delete/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return responseClient({
        res,
        statusCode: 400,
        message: "No id provided",
      });
    }

    const result = await deleteMediaFromCloudinary(id);
    if (result) {
      return responseClient({
        res,
        payload: {},

        message: "Media removed successfully!",
      });
    } else {
      return responseClient({
        res,
        statusCode: 400,

        message: "Media not found or could not be deleted",
      });
    }
  } catch (error) {
    next(error);
  }
});

export default imageRouter;
