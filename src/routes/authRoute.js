import express from "express";
import {
  activateUser,
  addAddressController,
  changePasswordController,
  deleteAddressController,
  deleteUserController,
  editAddressController,
  forgetPassword,
  getUser,
  getWishlistProducts,
  insertNewUser,
  loginUser,
  logoutUser,
  resetPassword,
  toggleWishlistController,
  updateUserController,
} from "../controllers/authController.js";
import {
  loginDataValidation,
  newUserDataValidation,
  userActivationDataValidation,
} from "../middleware/validations/authDataValidation.js";
import { userAuthMiddleware } from "../middleware/authMiddleware.js";
import { updateUser } from "../models/User/UserModel.js";
const router = express.Router();
router.post("/register", newUserDataValidation, insertNewUser);
router.post("/activate-user", userActivationDataValidation, activateUser);
router.post("/login", loginDataValidation, loginUser);
router.get("/user-info", userAuthMiddleware, getUser);
router.put("/user-info", userAuthMiddleware, updateUserController);
router.delete("/user-info", userAuthMiddleware, deleteUserController);
router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", userAuthMiddleware, logoutUser);
router.post("/wishlist", userAuthMiddleware, toggleWishlistController);
router.get("/wishlist", userAuthMiddleware, getWishlistProducts);
router.put("/change-password", userAuthMiddleware, changePasswordController);
router.post("/user-info/address", userAuthMiddleware, addAddressController);
router.put("/user-info/address", userAuthMiddleware, editAddressController);
router.delete(
  "/user-info/address/:addressId",
  userAuthMiddleware,
  deleteAddressController
);

export default router;
