import { Router } from "express";
import {
  changePasswordController,
  getCurrentUserController,
  updateUserController,
} from "../controllers/user.controller";
import { upload } from "../config/cloudinary.config";

const userRoutes = Router();

userRoutes.get("/current-user", getCurrentUserController);
userRoutes.put(
  "/update",
  upload.single("profilePicture"),
  updateUserController
);
userRoutes.put("/change-password", changePasswordController);

export default userRoutes;
