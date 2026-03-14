import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        // Denormalized for fast list queries (no populate needed)
        studentName: { type: String, required: true },
        branch: { type: String, required: true },
        class: { type: String, required: true },

        // The date this attendance is for (stored as midnight IST)
        date: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            enum: ["present", "absent"],
            required: true,
        },

        // Who marked this attendance
        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        notes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// One record per student per day — prevents duplicates
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// Fast queries: branch + date + class (receptionist's daily view)
attendanceSchema.index({ branch: 1, date: 1, class: 1 });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
