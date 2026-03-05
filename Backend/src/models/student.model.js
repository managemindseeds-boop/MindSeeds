import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        // STUDENT INFORMATION
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
            required: true,
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: "",
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },

        // PARENT / GUARDIAN
        parentName: {
            type: String,
            required: true,
            trim: true,
        },
        parentPhone: {
            type: String,
            required: true,
            trim: true,
        },

        // ENQUIRY DETAILS
        class: {
            type: String,
            required: true,
            trim: true,
        },
        branch: {
            type: String,
            required: true,
            trim: true,
        },

        // JOURNEY STATUS
        status: {
            type: String,
            enum: ["enquiry", "demo_scheduled", "admitted", "active"],
            default: "enquiry",
        },

        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);
