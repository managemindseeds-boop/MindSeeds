import mongoose from "mongoose";

const demoLectureSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        // Denormalized for fast list queries (no populate needed)
        studentName: { type: String, required: true },
        studentClass: { type: String, required: true },
        branch: { type: String, required: true },

        lectureNumber: {
            type: Number, // 1, 2, 3, 4
            required: true,
        },
        subject: {
            type: String,
            default: "",
        },
        scheduledDate: {
            type: Date,
            required: true,
        },

        // null = pending, true = attended, false = absent
        attended: {
            type: Boolean,
            default: null,
        },

        notes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

export const DemoLecture = mongoose.model("DemoLecture", demoLectureSchema);
