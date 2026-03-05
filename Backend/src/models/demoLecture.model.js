import mongoose from "mongoose";

const demoLectureSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        lectureNumber: {
            type: Number,  // 1, 2, 3, 4
            required: true,
        },
        scheduledDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["scheduled", "completed", "cancelled"],
            default: "scheduled",
        },
        notes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

export const DemoLecture = mongoose.model("DemoLecture", demoLectureSchema);
