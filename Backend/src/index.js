import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MONGODB connection failed !!!", err);
  });