import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { FeeRecord } from "../models/feeRecord.model.js";
import { Student } from "../models/student.model.js";
import { sendFeeReminder, scheduleFeeReminder } from "../utils/whatsapp.service.js";
import { branchFilter } from "../utils/branchFilter.js";

// ─── POST /api/v1/notifications/send-monthly-reminders ───────────────────────
// Sends WhatsApp fee reminder to ALL students with pending fees this month.
export const sendMonthlyFeeReminders = asyncHandler(async (req, res) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Fetch all PENDING fee records for current month
    const pendingFees = await FeeRecord.find({ month, year, status: "pending", ...branchFilter(req) });

    if (pendingFees.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, { sent: 0, failed: 0, results: [] }, "No pending fees this month")
        );
    }

    // Fetch parent phone numbers for each pending fee
    const studentIds = [...new Set(pendingFees.map((f) => f.student.toString()))];
    const students = await Student.find({ _id: { $in: studentIds } }).select(
        "fullName parentPhone feeDate"
    );
    const studentMap = Object.fromEntries(students.map((s) => [s._id.toString(), s]));

    const results = [];

    for (const fee of pendingFees) {
        const student = studentMap[fee.student.toString()];

        if (!student?.parentPhone) {
            results.push({
                studentName: fee.studentName,
                status: "skipped",
                reason: "No parent phone number",
            });
            continue;
        }

        const result = await sendFeeReminder({
            studentName: fee.studentName,
            parentPhone: student.parentPhone,
            month: fee.month,
            year: fee.year,
            dueDate: fee.dueDate,
        });

        results.push({
            studentName: fee.studentName,
            parentPhone: student.parentPhone,
            status: result.success ? "sent" : "failed",
            error: result.error || null,
        });
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;

    return res.status(200).json(
        new ApiResponse(
            200,
            { sent, failed, skipped, results },
            `Reminders processed: ${sent} sent, ${failed} failed, ${skipped} skipped`
        )
    );
});

// ─── POST /api/v1/notifications/send-reminder/:feeId ─────────────────────────
// Sends a WhatsApp reminder for a single fee record (on-demand from dashboard).
export const sendSingleFeeReminder = asyncHandler(async (req, res) => {
    const fee = await FeeRecord.findById(req.params.feeId);
    if (!fee) throw new ApiError(404, "Fee record not found");

    const student = await Student.findById(fee.student).select("parentPhone");
    if (!student?.parentPhone) {
        throw new ApiError(400, "Student has no parent phone number on record");
    }

    const result = await sendFeeReminder({
        studentName: fee.studentName,
        parentPhone: student.parentPhone,
        month: fee.month,
        year: fee.year,
        dueDate: fee.dueDate,
    });

    if (!result.success) {
        throw new ApiError(502, `WhatsApp send failed: ${result.error}`);
    }

    return res.status(200).json(
        new ApiResponse(200, { studentName: fee.studentName }, "Reminder sent successfully")
    );
});

// ─── POST /api/v1/notifications/test-schedule ────────────────────────────────
// Test endpoint — N minutes baad WhatsApp schedule karo (bina code change kiye!)
// Body: { phone: "9876543210", name: "Test Student", minutesFromNow: 2 }
export const testScheduleReminder = asyncHandler(async (req, res) => {
    const { phone, name, minutesFromNow = 2 } = req.body;

    if (!phone || !name) {
        throw new ApiError(400, "phone aur name required hai");
    }

    const mins = Math.min(Math.max(parseInt(minutesFromNow) || 2, 1), 60);

    const apiKey = process.env.CHDS_WA_API_KEY;
    if (!apiKey) throw new ApiError(500, "CHDS_WA_API_KEY not set");

    // Normalize phone
    let p = String(phone).replace(/[\s\-\(\)\+]/g, "");
    if (p.length === 10) p = "91" + p;

    const sendAt = new Date(Date.now() + mins * 60 * 1000).toISOString();
    const now = new Date();
    const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const message =
        `📚 *MindSeeds Fee Reminder* _(Test)_\n\n` +
        `Dear Parent,\n\n` +
        `Aaj *${name}* ki ${MONTHS[month]} ${year} ki fees due hai.\n\n` +
        `📅 *Due Date:* ${now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
        `Kripaya aaj fees jama karein.\n` +
        `Dhanyavaad! 🙏\n\n` +
        `_(Yeh ek test message hai)_`;

    const chdsRes = await fetch("https://whatsapp-integration-system-chds.vercel.app/api/scheduled-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ contact_phone: p, send_at: sendAt, message, message_type: "text" }),
    });

    const data = await chdsRes.json();
    if (!chdsRes.ok) {
        throw new ApiError(502, `CHDS error: ${data?.detail?.message || JSON.stringify(data)}`);
    }

    return res.status(200).json(
        new ApiResponse(200,
            { scheduledFor: sendAt, phone: p, minutesFromNow: mins },
            `✅ Test reminder scheduled! ${mins} minute(s) mein WhatsApp aayega.`
        )
    );
});

