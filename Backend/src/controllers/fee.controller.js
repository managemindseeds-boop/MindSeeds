import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { FeeRecord } from "../models/feeRecord.model.js";
import { Student } from "../models/student.model.js";

// Helper: build the due date for a given day and month/year
const buildDueDate = (day, month, year) => {
    // Cap day to last day of month (e.g. feeDate=31 in Feb → 28/29)
    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== month - 1) {
        // Overflowed — use last day of month
        return new Date(year, month, 0);
    }
    return date;
};

// Ensure every active student has a FeeRecord for the current month
// (lazy generation — called by getTodaysFees and getThisMonthFees)
const ensureCurrentMonthRecords = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Get all admitted/active students with a feeDate set
    const students = await Student.find({
        status: { $in: ["admitted", "active"] },
        feeDate: { $exists: true, $ne: null },
    });

    for (const s of students) {
        const exists = await FeeRecord.findOne({ student: s._id, month, year });
        if (!exists) {
            const dueDate = buildDueDate(s.feeDate, month, year);
            await FeeRecord.create({
                student: s._id,
                studentName: s.fullName,
                branch: s.branch,
                month,
                year,
                originalFeeDay: s.feeDate,
                dueDate,
                status: "pending",
            });
        }
    }
};

// GET /api/v1/fees/today
export const getTodaysFees = asyncHandler(async (req, res) => {
    await ensureCurrentMonthRecords();

    const now = new Date();
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);

    const fees = await FeeRecord.find({
        dueDate: { $gte: start, $lte: end },
        status: "pending",
    }).sort({ studentName: 1 });

    return res.status(200).json(new ApiResponse(200, fees, "Today's fees fetched"));
});

// GET /api/v1/fees/month  — all fees for current month
export const getThisMonthFees = asyncHandler(async (req, res) => {
    await ensureCurrentMonthRecords();

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const fees = await FeeRecord.find({ month, year }).sort({ dueDate: 1 });

    return res.status(200).json(new ApiResponse(200, fees, "This month's fees fetched"));
});

// GET /api/v1/fees/student/:studentId  — all fee history for a student
export const getStudentFees = asyncHandler(async (req, res) => {
    const fees = await FeeRecord.find({ student: req.params.studentId })
        .sort({ year: -1, month: -1 });

    return res.status(200).json(new ApiResponse(200, fees, "Student fee history fetched"));
});

// PATCH /api/v1/fees/:id/pay  — mark this month's fee as paid
export const markFeePaid = asyncHandler(async (req, res) => {
    const fee = await FeeRecord.findById(req.params.id);
    if (!fee) throw new ApiError(404, "Fee record not found");

    fee.status = "paid";
    fee.paidAt = new Date();
    await fee.save();

    // Auto-create next month's fee record
    const nextMonth = fee.month === 12 ? 1 : fee.month + 1;
    const nextYear = fee.month === 12 ? fee.year + 1 : fee.year;
    const nextDue = buildDueDate(fee.originalFeeDay, nextMonth, nextYear);

    await FeeRecord.findOneAndUpdate(
        { student: fee.student, month: nextMonth, year: nextYear },
        {
            $setOnInsert: {
                student: fee.student,
                studentName: fee.studentName,
                branch: fee.branch,
                month: nextMonth,
                year: nextYear,
                originalFeeDay: fee.originalFeeDay,
                dueDate: nextDue,
                status: "pending",
            },
        },
        { upsert: true, new: true }
    );

    return res.status(200).json(new ApiResponse(200, fee, "Fee marked as paid and next month's record created"));
});

// PATCH /api/v1/fees/:id/reschedule
// Body: { newDate: "YYYY-MM-DD", notes: "..." }
// Only reschedules THIS month — originalFeeDay unchanged
export const rescheduleFee = asyncHandler(async (req, res) => {
    const { newDate, notes } = req.body;
    if (!newDate) throw new ApiError(400, "newDate is required (YYYY-MM-DD)");

    const fee = await FeeRecord.findByIdAndUpdate(
        req.params.id,
        {
            dueDate: new Date(newDate),
            status: "rescheduled",
            notes: notes || "",
        },
        { new: true }
    );

    if (!fee) throw new ApiError(404, "Fee record not found");

    return res.status(200).json(new ApiResponse(200, fee, "Fee rescheduled for this month only"));
});
