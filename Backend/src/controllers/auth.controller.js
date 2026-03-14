import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateToken = (user) => {

  return jwt.sign(
    {
      _id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

export const loginUser = asyncHandler(async (req, res) => {

  const { username, password, branch } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Username and password required");
  }

  const user = await User.findOne({ username });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // Save selected branch to user (receptionist selects branch at login)
  if (branch) {
    user.branch = branch;
    await user.save();
  }

  const token = generateToken(user);

  const cookieOptions = {
    httpOnly: true,       // not accessible via JS — more secure
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
  };

  return res
    .status(200)
    .cookie("token", token, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          token,
          role: user.role,
          username: user.username,
          branch: user.branch || "",
        },
        "Login successful"
      )
    );
});