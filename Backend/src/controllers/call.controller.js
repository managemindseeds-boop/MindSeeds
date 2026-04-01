import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Call } from "../models/call.model.js";
import { FeeActivityLog } from "../models/feeActivityLog.model.js";
import { branchFilter } from "../utils/branchFilter.js";
import mongoose from "mongoose";

// ─── Local MongoDB connection (fee_records lives here, NOT in cloud DB) ────────
// Cloud DB (mongoose.connection) = Mindseed Enquiry → fee_call_reminders, students
// Local DB (localConn)           = mindseedFeesLocal → fee_records
const LOCAL_MONGO_URI = process.env.LOCAL_MONGODB_URI || "mongodb://127.0.0.1:27017/mindseed_fms";
let localConn = null;

const getLocalConn = async () => {
    if (localConn && localConn.readyState === 1) return localConn;
    localConn = await mongoose.createConnection(LOCAL_MONGO_URI).asPromise();
    console.log("[localConn] Connected to local MongoDB:", localConn.name);
    return localConn;
};

// Helper: update a fee_record document by its _id (using LOCAL connection)
const updateFeeRecord = async (mongoFeeId, update) => {
    if (!mongoFeeId) return;
    try {
        const conn = await getLocalConn();
        const col = conn.collection("fee_records");
        await col.updateOne(
            { _id: new mongoose.Types.ObjectId(String(mongoFeeId)) },
            { $set: update }
        );
    } catch (err) {
        console.error("[updateFeeRecord] failed:", err.message);
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

    if (status === "done" || status === "paid") {
        updates.done_at = new Date();
        updates.done_by = req.user?.username || 'Receptionist';

        // ✅ Mark the linked fee_record as PAID (native collection call)
        await updateFeeRecord(call.mongo_fee_id, {
            status: "paid",
            paidAt: new Date(),
            notes: call_notes || call.call_notes || "",
        });
    }

    Object.assign(call, updates);
    await call.save();

    // If rescheduled, update the underlying fee record's due_date
    if (status === 'rescheduled' && rescheduled_to && call.mongo_fee_id) {
        await updateFeeRecord(call.mongo_fee_id, {
            dueDate: new Date(rescheduled_to),
            status: "rescheduled",
            notes: call_notes || ""
        });
    }

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
    const { amountPaid, notes } = req.body;

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

    // ─── Step 1: Current fee_record update karo (native collection call) ───────
    await updateFeeRecord(call.mongo_fee_id, {
        paidAmount: paid,
        remainingAmount: remainingAmount,
        isPartial: true,
        status: "partial",
        paidAt: new Date(),
        notes: notes || "",
    });

    // ─── Step 2: Student ke baaki future installments dhundho ─────────────────
    // LOCAL DB pe query karo — fee_records wahan hai (cloud me nahi)
    // ⚠️  FMS records mein 'student_mongo_id' (string) hoti hai
    //     Receptionist sync records mein 'student' (ObjectId) hoti hai
    //     Dono se query karo taake sab records milein
    let distributedCount = 0;
    if (call.student_mongo_id && call.installment_number) {
        try {
            const conn = await getLocalConn();
            const col = conn.collection("fee_records");

            const studentObjId = new mongoose.Types.ObjectId(String(call.student_mongo_id));
            const studentMongoIdStr = String(call.student_mongo_id);

            // All records: student ObjectId ya student_mongo_id string dono se match karo
            const allStudentRecords = await col.find({
                $or: [
                    { student: studentObjId },
                    { student_mongo_id: studentMongoIdStr },
                ]
            }).toArray();
            console.log(`[partialPay] Student ${call.student_mongo_id} ke total fee_records:`, allStudentRecords.length);
            console.log(`[partialPay] Current installment_number:`, call.installment_number);

            // Future pending installments: installmentNumber ya installment_number dono check karo
            const futureRecords = await col.find({
                $and: [
                    {
                        $or: [
                            { student: studentObjId },
                            { student_mongo_id: studentMongoIdStr },
                        ]
                    },
                    {
                        $or: [
                            { installmentNumber: { $gt: Number(call.installment_number) } },
                            { installment_number: { $gt: Number(call.installment_number) } },
                        ]
                    },
                    { status: { $in: ["pending", "rescheduled"] } },
                ]
            }).sort({ installmentNumber: 1, installment_number: 1 }).toArray();


            console.log(`[partialPay] Future pending installments found:`, futureRecords.length);

            if (futureRecords.length > 0) {
                // Remaining amount ko barabar divide karo
                const perInstallment = Math.round((remainingAmount / futureRecords.length) * 100) / 100;
                // Last installment ko rounding diff adjust karo
                const totalDistributed = perInstallment * (futureRecords.length - 1);
                const lastInstallmentExtra = Math.round((remainingAmount - totalDistributed) * 100) / 100;

                const bulkOps = futureRecords.map((rec, idx) => {
                    const addAmount = idx === futureRecords.length - 1 ? lastInstallmentExtra : perInstallment;
                    return {
                        updateOne: {
                            filter: { _id: rec._id },
                            update: {
                                $inc: {
                                    installmentAmount: addAmount,
                                    carryForwardAmount: addAmount,
                                },
                            },
                        },
                    };
                });
                await col.bulkWrite(bulkOps);
                distributedCount = futureRecords.length;
                console.log(`[partialPay] ₹${remainingAmount} distributed across ${futureRecords.length} installments (₹${perInstallment} each)`);
            } else {
                console.warn(`[partialPay] Koi future pending installment nahi mila — distribution skip`);
            }
        } catch (err) {
            console.error("[partialPay] future installment distribution failed:", err.message);
        }
    }

    // ─── Step 3: Call record ko update karo ──────────────────────────────────
    // ✅ status = "partial_paid" → sync_service ka partial_paid branch trigger hoga
    // ✅ amountPaid field save karo → sync_service partial amount detect kar sake
    call.status = "partial_paid";
    call.call_notes = notes || call.call_notes || "";
    call.called_by = req.user?.username || "Receptionist";
    call.called_at = new Date();
    call.updated_at = new Date();
    call.done_at = new Date();
    call.done_by = req.user?.username || "Receptionist";
    // Extra fields: sync_service in fields se partial amount padhega
    call.set("amountPaid", paid, { strict: false });
    call.set("partial_amount_paid", paid, { strict: false });
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
            distributedAcrossInstallments: distributedCount > 0,
            distributedAcrossCount: distributedCount,
            notes,
        },
        timestamp: new Date(),
    });

    return res.status(200).json(
        new ApiResponse(200,
            { amountPaid: paid, remainingAmount, originalAmount },
            `✅ Partial payment recorded. ₹${paid} receive hua, ₹${remainingAmount} baaki installments me distribute kar diya.`
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
