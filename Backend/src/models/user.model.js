import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "receptionist"],
      required: true,
    },
  },
  { timestamps: true }
);

// hash password before saving
userSchema.pre("save", async function () {

  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});


// compare password
userSchema.methods.isPasswordCorrect = async function (password) {

  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);