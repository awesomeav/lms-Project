require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import jwt, { Secret, verify } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { CatachAsyncErrors } from "../Middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandlers";
import UserModel, { Iuser } from "../models/user.model";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service";
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}
interface IActivationToken {
  token?: string;
  activationCode?: any;
}
export interface ExpressRequest extends Request {
  user?: {
    role: string;
    public: any;
    _id: any;
    id: string;
    avatar: string;
    courses?: any;
    name?: string;
  }; // Add the user property to Request
}

export const registrationUser = CatachAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, avatar } = req.body;
    console.log("password :", password);

    const isEmail = await UserModel.findOne({ email });
    if (isEmail) {
      return next(new ErrorHandler("Email already exists", 400));
    }
    const user: IRegistrationBody = {
      name,
      email,
      password,
    };
    const activationToken = createActivationToken(user);
    const activationCode = activationToken.activationCode;
    console.log("activationCode :", activationCode);
    // const data = { user: { name: user.name }, activationCode };
    const data = {
      user: { name: user.name },
      activationCode,
    };
    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/activation-mail.ejs"),
      data
    );

    try {
      sendMail({
        email: user.email,
        subject: "Activation Mail",
        template: "activation-mail.ejs",
        data,
      });
      res.status(200).json({
        status: "success",
        message: "Activation mail sent successfully",
        activationCode: activationToken.activationCode,
        activationToken: activationToken.token,
      });
    } catch (err) {
      console.log("err :", err);
    }
  }
);

export const createActivationToken = (user: any): IActivationToken => {
  // activation code
  const activationCode = Math.floor(100000 + Math.random() * 9000).toString();

  const Secret: any = process.env.SECRET_KEY; // Replace with your own secret key
  const token = jwt.sign({ user, activationCode }, Secret, {
    expiresIn: "5m",
  });

  return { token, activationCode };
};

interface IActivationRequest {
  activationCode: string;
  activationToken: string;
}
export const activationUser = CatachAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activationCode, activationToken } = req.body;
      const newUser: { user: Iuser; activationCode: string } = jwt.verify(
        activationToken,
        process.env.SECRET_KEY as string
      ) as { user: Iuser; activationCode: string };

      if (newUser.activationCode !== activationCode) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }
      const { name, email, password } = newUser.user;
      const existUser = await UserModel.findOne({ email });
      if (existUser) {
        return next(new ErrorHandler("User already exists", 400));
      }
      const user = await UserModel.create({
        name,
        email,
        password,
      });
      res.status(200).json({
        status: "success",
        message: "User created successfully",
      });
    } catch (err) {
      console.log("err :", err);
    }
  }
);
// login User
interface Login {
  email: string;
  password: string;
}

export const loginUser = CatachAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password }: Login = req.body;
      console.log("req.body :", req.body);
      console.log("passwrod :", password);
      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }
      const user = await UserModel.findOne({ email });
      if (!user) {
        return next(new ErrorHandler("user is not signup", 400));
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }
      sendToken(user, 200, res);
      // const token = jwt.sign(
      //   { id: user._id },
      //   process.env.SECRET_KEY as string
      // );
      // res.status(200).json({
      //   status: "success",
      //   message: "Login successfully",
      //   token,
      // });
    } catch (err) {
      console.log("err :", err);
    }
  }
);

// logout
export const logout = async (
  req: ExpressRequest,
  res: Response,
  next: NextFunction
) => {
  console.log(" req.cookies :", req.cookies);
  // isAuth(req, res, next);
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  console.log("req.user :", req.user);
  const userId: any = req.user?._id;
  redis.del(userId);
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

const isAuth = CatachAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const access_token = await req.cookies.access_token;
      if (!access_token) {
        return next(new ErrorHandler("Please login first", 400));
      }
      const decoded: any = jwt.verify(
        access_token,
        process.env.ACCESS_TOKEN_SECRET as string
      );
      if (!decoded) {
        return next(new ErrorHandler("Token is not valid", 400));
      }
      const user = await redis.get(decoded.id);

      if (!user) {
        return next(new ErrorHandler("user not found", 400));
      }
      const userID = JSON.parse(user);
      await redis.del(userID?._id);
    } catch (err) {
      console.log("err :", err);
    }
  }
);

export const updateAccessToken = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    const refresh_Token = req.cookies.refresh_token;
    console.log("refresh_Token :", refresh_Token);

    const decoded: any = jwt.verify(
      refresh_Token,
      process.env.REFRESH_TOKEN_SECRET as string
    );

    if (!decoded) {
      return next(new ErrorHandler("Refresh token is not there", 400));
    }
    const session = await redis.get(decoded.id);
    if (!session) {
      return next(
        new ErrorHandler("Session not found or refresh token not found", 400)
      );
    }

    const user = JSON.parse(session);
    console.log("user------------------------------------ :", user);

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "5m",
      }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "3d",
      }
    );
    req.user = user;
    res.cookie("accessToken", accessToken), accessTokenOptions;
    res.cookie("refreshToken", refreshToken, refreshTokenOptions);

    res.status(200).json({
      status: "success",
      message: "Token updated successfully",
      accessToken,
    });
  }
);
export const getUserInfo = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const userId: any = req?.user?._id;
      getUserById(userId, res);
    } catch (err) {
      return next(err);
    }
  }
);
interface IscoialAuth {
  email: string;
  name: string;
  avatar: string;
}
export const socialAuth = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar }: IscoialAuth = req.body;
      const user = await UserModel.findOne({ email });
      if (user) {
        sendToken(user, 200, res);
      } else {
        const newUser = await UserModel.create({ email, name, avatar });
        sendToken(newUser, 200, res);
      }
    } catch (err) {
      next(err);
    }
  }
);
// update user info phone and email
interface UpdateUserInfo {
  phone: string;
  email: string;
}

export const updateUser = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body;
      const user = await UserModel.findById(req?.user?._id);
      if (user && email) {
        const isEmail = await UserModel.findOne({ email });
        if (isEmail) {
          return next(new ErrorHandler("Email already exists", 400));
        }
      }
      if (name && user) {
        user.name = name;
      }
      await user?.save();

      await redis.set(user?._id, JSON.stringify(user));
      res.status(200).json({
        message: "success",
        user,
      });
    } catch (err) {
      next(err);
    }
  }
);
// $2a$10$n3HyHLWEoOdsPpxWP60Fmeh0WZ1.KZkuXEtRzqPDduxW2EVygsCja
// update password
export const updatePassword = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body;
    const userId: any = req?.user?._id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return next(new ErrorHandler("Old password is incorrect", 400));
    }
    if (oldPassword === newPassword) {
      return next(
        new ErrorHandler("New password cannot be same as old password", 400)
      );
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const body = { password: hashedPassword };
    const updatedUser = await UserModel.findByIdAndUpdate(userId, body, {
      new: true,
      runValidators: true,
    });
    await redis.set(updatedUser?._id, JSON.stringify(updatedUser));
    res.status(200).json({
      status: "success updated",
      user: updatedUser,
    });
  }
);
// update profile picture

export const updateProfilePicture = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body;
      const userId = req?.user?._id;
      console.log("userId :", userId);
      const user = await UserModel.findById(userId);
      console.log("user :", user);
      const useravatar: any = user?.avatar;
      if (user && avatar) {
        if (useravatar?.public?._id) {
          //fisrt delete the pic from cloudinary
          await cloudinary.v2.uploader.destroy(useravatar?.public?._id);
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
          });

          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
          });

          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user));
      res.status(200).json({
        success: "true",
        user,
      });
    } catch (err) {
      next(err);
    }
  }
);
// get all user - for admin
export const getAllUsers = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      getAllUsers(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// update user role

export const updateUserRole = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      // update user role
      const { id } = req?.params;
      const { role } = req?.body;

      if (!id) {
        return next(new ErrorHandler("User not found", 404));
      }
      const user = await UserModel.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      );

      res.status(200).json({
        success: "role updated",
        user,
      });
    } catch (err) {
      next(err);
    }
  }
);

// delete user

export const deleteUser = CatachAsyncErrors(
  async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      // delete user
      const { id } = req?.params;
      if (!id) {
        return next(new ErrorHandler("User not found", 404));
      }
      const user = await UserModel.findByIdAndDelete(id);

      await redis.del(id);

      res.status(200).json({
        success: "user deleted",
        user,
      });
    } catch (err) {
      next(err);
    }
  }
);
