import mongoose from "mongoose";

// Maps to existing 'calls' collection created by external fee system
const callSchema = new mongoose.Schema(
    {
        // Link to students collection
        student_mongo_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", default: null },

        student_name: { type: String, required: true },
        student_phone: { type: String, default: "" },
        parent_phone: { type: String, default: "" },
        student_class: { type: String, default: "" },
        branch: { type: String, default: "" },

        // Fee linkage (set by the pipeline)
        fee_record_id: { type: mongoose.Schema.Types.Mixed, default: null },
        mongo_fee_id: { type: String, default: null },
        installment_number: { type: Number, default: null },
        installment_amount: { type: Number, default: null },

        // Due date (when this fee is due)
        due_date: { type: Date, default: null },

        status: {
            type: String,
            enum: ["pending", "called", "will_pay", "no_answer", "rescheduled", "done"],
            default: "pending",
        },

        // Receptionist actions
        call_notes: { type: String, default: "" },
        rescheduled_to: { type: String, default: null },
        called_by: { type: String, default: "" },
        called_at: { type: Date, default: null },

        created_at: { type: Date, default: Date.now },
        done_at: { type: Date, default: null },
        done_by: { type: String, default: "" },
        updated_at: { type: Date, default: null },
    },
    {
        collection: "calls",   // exact collection name in MongoDB
        timestamps: false,
    }
);

// Fast queries: branch + status
callSchema.index({ branch: 1, status: 1 });
callSchema.index({ due_date: 1, status: 1 });

export const Call = mongoose.model("Call", callSchema);
