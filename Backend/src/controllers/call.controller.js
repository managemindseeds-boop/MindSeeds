import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Call } from "../models/call.model.js";
import { FeeRecord } from "../models/feeRecord.model.js";
import { FeeActivityLog } from "../models/feeActivityLog.model.js";
import { branchFilter } from "../utils/branchFilter.js";
import mongoose from "mongoose";

// ─── Helper: Update FeeRecord in MongoDB ─────────────────────────────────────
// Called during partial payment to update the fee record's paid/remaining amounts.
// Fails gracefully — call record update proceeds even if FeeRecord is not found.
const updateFeeRecord = async (feeRecordId, data) => {
    if (!feeRecordId) return null;
    try {
        const updated = await FeeRecord.findByIdAndUpdate(feeRecordId, data, { new: true });
        return updated;
    } catch (err) {
        console.warn(`⚠️ updateFeeRecord(${feeRecordId}) failed:`, err.message);
        return null;
    }
};




// ─── GET /api/v1/calls?status=pending ───────────────────────────────────────
// Fetch calls for this receptionist's branch(es)
// ?status=pending | done | all  (default: pending)
export const getCalls = asyncHandler(async (req, res) => {
    const { status = "pending" } = req.query;

    const filter = { ...branchFilter(req) };

    if (status !== "all") {
        if (!["pending", "done", "rescheduled", "will_pay", "no_answer", "called", "paid", "partial_paid"].includes(status)) {
            throw new ApiError(400, "Invalid status value");
        }
        filter.status = status;
    }

    const calls = await Call.find(filter).sort({ created_at: -1 });

    return res.status(200).json(
        new ApiResponse(200, calls, `${calls.length} call(s) fetched`)
    );
});

// ─── GET /api/v1/calls/count ─────────────────────────────────────────────────
// Grouped counts for all unresolved fee statuses
export const getPendingCallsCount = asyncHandler(async (req, res) => {
    const bf = branchFilter(req);

    const [pending, rescheduled, willPay, noAnswer, called] = await Promise.all([
        Call.countDocuments({ status: "pending",    ...bf }),
        Call.countDocuments({ status: "rescheduled",...bf }),
        Call.countDocuments({ status: "will_pay",   ...bf }),
        Call.countDocuments({ status: "no_answer",  ...bf }),
        Call.countDocuments({ status: "called",     ...bf }),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            count: pending,                             // backward compat
            pending,
            rescheduled,
            contacted: willPay + noAnswer + called,    // contacted but unpaid
        }, "Fee reminder counts")
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
    const { status, call_notes, rescheduled_to, payment_method } = req.body;

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
    if (payment_method) updates.payment_method = payment_method;

    if (status === "done" || status === "paid") {
        updates.done_at = new Date();
        updates.done_by = req.user?.username || 'Receptionist';
        // For full payment, store the amount so Flutter sync can read it
        if (status === "paid" && call.installment_amount) {
            updates.amountPaid = call.installment_amount;
        }
    }

    Object.assign(call, updates);
    await call.save();
    // Note: local fee_record is updated by FeeSync sync_service
    // (reads fee_call_reminders from Atlas every 30s and applies to local DB)


    // Log to activity
    await FeeActivityLog.create({
        student_mongo_id: call.student_mongo_id,
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

// ─── PATCH /api/v1/calls/:id/partial-pay ─────────────────────────────────────
// Student ne poora installment nahi diya — partial payment record karo
// Body: { amountPaid: 500, notes: "Cash liya" }
// Logic: Remaining amount baaki installments me equally divide ho jaayega
export const partialPayCall = asyncHandler(async (req, res) => {
    const { amountPaid, notes, payment_method } = req.body;

    if (!amountPaid || amountPaid <= 0) {
        throw new ApiError(400, "amountPaid required aur 0 se zyada hona chahiye");
    }

    const call = await Call.findById(req.params.id);
    if (!call) throw new ApiError(404, "Call record not found");

    const originalAmount = call.installment_amount || 0;
    const paid = Number(amountPaid);

    if (paid >= originalAmount) {
        throw new ApiError(400, `amountPaid (${paid}) originalAmount (${originalAmount}) se kam hona chahiye — full pay ke liye 'Mark as Paid' use karo`);
    }

    const remainingAmount = Math.round((originalAmount - paid) * 100) / 100;

    // ─── Step 1: Update FeeRecord if linked (graceful — won't block on failure) ─
    await updateFeeRecord(call.mongo_fee_id, {
        paidAmount: paid,
        remainingAmount: remainingAmount,
        isPartial: true,
        status: "partial",
        paidAt: new Date(),
        notes: notes || "",
    });

    // Note: future installment redistribution is handled by Flutter sync_service
    // when it reads partial_paid status from Atlas fee_call_reminders

    // ─── Step 2: Update Call record ──────────────────────────────────────────
    // ✅ status = "partial_paid" → sync_service ka partial_paid branch trigger hoga
    // ✅ amountPaid + partial_amount_paid → sync_service partial amount detect kar sake
    call.status = "partial_paid";
    call.call_notes = notes || call.call_notes || "";
    call.called_by = req.user?.username || "Receptionist";
    call.called_at = new Date();
    call.updated_at = new Date();
    call.done_at = new Date();
    call.done_by = req.user?.username || "Receptionist";
    call.amountPaid = paid;
    call.partial_amount_paid = paid;
    if (payment_method) call.payment_method = payment_method;
    await call.save();

    // ─── Step 4: Activity log ─────────────────────────────────────────────────
    await FeeActivityLog.create({
        student_mongo_id: call.student_mongo_id,
        student_name: call.student_name,
        fee_record_id: call.mongo_fee_id,
        installment_number: call.installment_number,
        action: "partial_payment",
        actor: "receptionist",
        actor_name: req.user?.username || "Receptionist",
        details: {
            originalAmount,
            amountPaid: paid,
            remainingAmount,
            payment_method: payment_method || '',
            notes,
        },
        timestamp: new Date(),
    });

    return res.status(200).json(
        new ApiResponse(200,
            { amountPaid: paid, remainingAmount, originalAmount },
            `✅ Partial payment recorded. ₹${paid} received, ₹${remainingAmount} remaining.`
        )
    );
});


// ─── GET /api/v1/calls/activity ──────────────────────────────────────────────
export const getCallActivity = asyncHandler(async (req, res) => {
    const logs = await FeeActivityLog.find({})
        .sort({ timestamp: -1 })
        .limit(50);

    return res.status(200).json(new ApiResponse(200, { activities: logs }, "Activity fetched"));
});
