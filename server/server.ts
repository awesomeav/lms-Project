import { app } from "./app";
import connectDB from "./utils/db";
import { v2 as cloudinary } from "cloudinary";
// create server
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 6000;
app.listen(port, () => {
  console.log(`Server  is started on port ${port}`);
  connectDB();
});
