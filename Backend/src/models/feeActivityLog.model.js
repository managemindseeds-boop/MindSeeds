import mongoose from "mongoose";

const feeActivityLogSchema = new mongoose.Schema(
    {
        student_mongo_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        student_name: { type: String, required: true },
        fee_record_id: { type: String, default: null },
        installment_number: { type: Number, default: null },

        action: { type: String, required: true }, // e.g. "call_rescheduled", "call_will_pay", "call_done"
        actor: { type: String, default: "receptionist" },
        actor_name: { type: String, required: true },

        details: { type: mongoose.Schema.Types.Mixed, default: {} },

        timestamp: { type: Date, default: Date.now },
    },
    {
        collection: "fee_activity_log",
        timestamps: false,
    }
);

export const FeeActivityLog = mongoose.model("FeeActivityLog", feeActivityLogSchema);
