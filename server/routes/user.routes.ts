import express from "express";
import {
  activationUser,
  deleteUser,
  getAllUsers,
  getUserInfo,
  loginUser,
  logout,
  registrationUser,
  socialAuth,
  updateAccessToken,
  updatePassword,
  updateProfilePicture,
  updateUser,
  updateUserRole,
} from "../contoller/user.controller";
import { authorizedRoles, isAuthencation } from "../Middleware/auth";
const userRouter = express.Router();
userRouter.post("/registration", registrationUser);
userRouter.post("/activate-user", activationUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthencation, logout);
userRouter.get("/refreshtoken", updateAccessToken);
userRouter.get("/me", isAuthencation, getUserInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put("/update-user-info", isAuthencation, updateUser);
userRouter.put("/update-password", isAuthencation, updatePassword);
userRouter.put("/update-user-avatar", isAuthencation, updateProfilePicture);
userRouter.get(
  "/get-all-user",
  isAuthencation,
  authorizedRoles("admin"),
  getAllUsers
);
userRouter.patch(
  "/update-role/:id",
  isAuthencation,
  authorizedRoles("admin"),
  updateUserRole
);
userRouter.delete(
  "/delete-user/:id",
  isAuthencation,
  authorizedRoles("admin"),
  deleteUser
);

export default userRouter;
