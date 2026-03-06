import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { DemoLecture } from "../models/demoLecture.model.js";
import { FeeRecord } from "../models/feeRecord.model.js";

// Helper: today ki start aur end time
const todayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

// Helper: current month ke fee records ensure karo (lazy generation)
const ensureCurrentMonthRecords = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const students = await Student.find({
        status: { $in: ["admitted"] },
        feeDate: { $exists: true, $ne: null },
    });

    for (const s of students) {
        const exists = await FeeRecord.findOne({ student: s._id, month, year });
        if (!exists) {
            // Cap day to last day of month (e.g. feeDate=31 in Feb → 28/29)
            const dueDate = new Date(year, month - 1, s.feeDate);
            if (dueDate.getMonth() !== month - 1) {
                dueDate.setDate(0); // last day of month
            }
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

// GET /api/v1/dashboard
// Ek hi request mein dashboard ka sara data return karta hai
export const getDashboardData = asyncHandler(async (req, res) => {
    const { start, end } = todayRange();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Fees ke liye pehle current month records ensure karo
    await ensureCurrentMonthRecords();

    // Sab queries parallel chalao — fast!
    const [
        students,
        todayDemos,
        upcomingDemos,
        absentDemos,
        monthFees,
        todayFees,
    ] = await Promise.all([
        // Saare students
        Student.find({}).sort({ createdAt: -1 }),

        // Aaj ke pending demos
        DemoLecture.find({
            scheduledDate: { $gte: start, $lte: end },
            attended: null,
        }).sort({ scheduledDate: 1 }),

        // Upcoming demos (aaj ke baad)
        DemoLecture.find({
            scheduledDate: { $gt: end },
            attended: null,
        }).sort({ scheduledDate: 1 }),

        // Absent demos
        DemoLecture.find({ attended: false }).sort({ scheduledDate: -1 }),

        // Is mahine ki saari fees
        FeeRecord.find({ month, year }).sort({ dueDate: 1 }),

        // Aaj ki due fees (pending aur aaj ki dueDate)
        FeeRecord.find({
            dueDate: { $gte: start, $lte: end },
            status: "pending",
        }).sort({ studentName: 1 }),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            students,
            todayDemos,
            upcomingDemos,
            absentDemos,
            monthFees,
            todayFees,
        }, "Dashboard data fetched successfully")
    );
});
