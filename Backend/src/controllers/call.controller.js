import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Call } from "../models/call.model.js";
import { FeeRecord } from "../models/feeRecord.model.js";
import { FeeActivityLog } from "../models/feeActivityLog.model.js";
import { branchFilter } from "../utils/branchFilter.js";

// ─── GET /api/v1/calls?status=pending ───────────────────────────────────────
// Fetch calls for this receptionist's branch(es)
// ?status=pending | done | all  (default: pending)
export const getCalls = asyncHandler(async (req, res) => {
    const { status = "pending" } = req.query;

    const filter = { ...branchFilter(req) };

    if (status !== "all") {
        if (!["pending", "done"].includes(status)) {
            throw new ApiError(400, "status must be pending, done, or all");
        }
        filter.status = status;
    }

    const calls = await Call.find(filter).sort({ created_at: -1 });

    return res.status(200).json(
        new ApiResponse(200, calls, `${calls.length} call(s) fetched`)
    );
});

// ─── GET /api/v1/calls/count ─────────────────────────────────────────────────
// Pending calls count — for dashboard badge
export const getPendingCallsCount = asyncHandler(async (req, res) => {
    const count = await Call.countDocuments({ status: "pending", ...branchFilter(req) });

    return res.status(200).json(
        new ApiResponse(200, { count }, "Pending calls count")
    );
});

// ─── PATCH /api/v1/calls/:id/done ────────────────────────────────────────────
// Mark a call as done
export const markCallDone = asyncHandler(async (req, res) => {
    const call = await Call.findById(req.params.id);
    if (!call) throw new ApiError(404, "Call record not found");

    call.status = "done";
    call.done_at = new Date();
    call.done_by = req.user.username || "";
    await call.save();

    return res.status(200).json(
        new ApiResponse(200, call, "Call marked as done")
    );
});

// ─── PATCH /api/v1/calls/:id/reopen ──────────────────────────────────────────
// Reopen a done call back to pending
export const reopenCall = asyncHandler(async (req, res) => {
    const call = await Call.findById(req.params.id);
    if (!call) throw new ApiError(404, "Call record not found");

    call.status = "pending";
    call.done_at = null;
    call.done_by = "";
    await call.save();

    return res.status(200).json(
        new ApiResponse(200, call, "Call reopened")
    );
});

// ─── PATCH /api/v1/calls/:id ─────────────────────────────────────────────────
// Generic update for call status/notes (Called, Will Pay, No Answer, Reschedule)
export const updateCall = asyncHandler(async (req, res) => {
    const { status, call_notes, rescheduled_to } = req.body;

    const call = await Call.findById(req.params.id);
    if (!call) throw new ApiError(404, "Call record not found");

    const updates = {
        status,
        called_by: req.user?.username || 'Receptionist',
        called_at: new Date(),
        updated_at: new Date(),
    };

    if (call_notes) updates.call_notes = call_notes;
    if (rescheduled_to) updates.rescheduled_to = rescheduled_to;

    if (status === "done") {
        updates.done_at = new Date();
        updates.done_by = req.user?.username || 'Receptionist';
    }

    Object.assign(call, updates);
    await call.save();

    // If rescheduled, update the underlying fee record's due_date
    if (status === 'rescheduled' && rescheduled_to && call.mongo_fee_id) {
        // Find the specific month record linked to the pipeline via string ID or Object ID
        await FeeRecord.findByIdAndUpdate(call.mongo_fee_id, {
            dueDate: new Date(rescheduled_to),
            status: "rescheduled",
            notes: call_notes || ""
        });
    }

    // Log to activity
    await FeeActivityLog.create({
        student_mongo_id: call.student_mongo_id, // Might not exist on old schema, but we log what we have
        student_name: call.student_name,
        fee_record_id: call.mongo_fee_id,
        installment_number: call.installment_number,
        action: `call_${status}`,
        actor: 'receptionist',
        actor_name: req.user?.username || 'Receptionist',
        details: { call_notes, rescheduled_to },
        timestamp: new Date(),
    });

    return res.status(200).json(new ApiResponse(200, call, "Call updated successfully"));
});

// ─── GET /api/v1/calls/activity ──────────────────────────────────────────────
export const getCallActivity = asyncHandler(async (req, res) => {
    const logs = await FeeActivityLog.find({})
        .sort({ timestamp: -1 })
        .limit(50);

    return res.status(200).json(new ApiResponse(200, { activities: logs }, "Activity fetched"));
});
