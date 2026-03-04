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

  const { username, password } = req.body;

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

  const token = generateToken(user);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        token,
        role: user.role,
        username: user.username,
      },
      "Login successful"
    )
  );
});