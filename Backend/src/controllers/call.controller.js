import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Call } from "../models/call.model.js";
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
