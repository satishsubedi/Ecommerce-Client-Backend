import express from "express";
import { insertNewUser } from "../controllers/authController.js";
import { newUserDataValidation } from "../middleware/validations/authDataValidation.js";
const router = express.Router();
router.post("/register", newUserDataValidation, insertNewUser);

export default router;
