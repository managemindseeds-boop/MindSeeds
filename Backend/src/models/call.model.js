import mongoose from "mongoose";

// Maps to existing 'calls' collection created by external fee system
const callSchema = new mongoose.Schema(
    {
        student_name: { type: String, required: true },
        student_phone: { type: String, default: "" },
        branch: { type: String, default: "" },
        fee_record_id: { type: mongoose.Schema.Types.Mixed, default: null },
        status: {
            type: String,
            enum: ["pending", "done"],
            default: "pending",
        },
        created_at: { type: Date, default: Date.now },
        done_at: { type: Date, default: null },
        done_by: { type: String, default: "" },  // receptionist username
    },
    {
        collection: "calls",   // exact collection name in MongoDB
        timestamps: false,
    }
);

// Fast queries: branch + status
callSchema.index({ branch: 1, status: 1 });

export const Call = mongoose.model("Call", callSchema);
