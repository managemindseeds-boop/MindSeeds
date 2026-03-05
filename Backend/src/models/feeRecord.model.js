import mongoose from "mongoose";

const feeRecordSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        // Denormalized for fast queries
        studentName: { type: String, required: true },
        branch: { type: String, required: true },

        // Which month/year this record belongs to
        month: { type: Number, required: true }, // 1–12
        year: { type: Number, required: true },

        // The fixed day of month (e.g. 5) — copied from student.feeDate
        originalFeeDay: { type: Number, required: true },

        // Actual due date for this month (may differ if rescheduled)
        dueDate: { type: Date, required: true },

        status: {
            type: String,
            enum: ["pending", "paid", "rescheduled"],
            default: "pending",
        },

        paidAt: { type: Date, default: null },
        notes: { type: String, default: "" },
    },
    { timestamps: true }
);

// Ensure one record per student per month
feeRecordSchema.index({ student: 1, month: 1, year: 1 }, { unique: true });

export const FeeRecord = mongoose.model("FeeRecord", feeRecordSchema);
