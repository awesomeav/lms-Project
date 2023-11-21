import express from "express";
import {
  activationUser,
  getUserInfo,
  loginUser,
  logout,
  registrationUser,
  socialAuth,
  updateAccessToken,
} from "../contoller/user.controller";
import { isAuthencation } from "../Middleware/auth";
const userRouter = express.Router();
userRouter.post("/registration", registrationUser);
userRouter.post("/activate-user", activationUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthencation, logout);
userRouter.get("/refreshtoken", updateAccessToken);
userRouter.get("/me", isAuthencation, getUserInfo);
userRouter.post("/social-auth", socialAuth);

export default userRouter;
