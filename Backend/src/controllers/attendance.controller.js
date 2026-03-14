import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Attendance } from "../models/attendance.model.js";
import { Student } from "../models/student.model.js";
import { branchFilter } from "../utils/branchFilter.js";

// Helper: parse date string to IST midnight
const toISTMidnight = (dateStr) => {
    return new Date(dateStr + "T00:00:00+05:30");
};

// ─── GET /api/v1/attendance/students?class=10th ──────────────────────────────
// Fetch admitted students for marking attendance (filtered by branch)
export const getStudentsForAttendance = asyncHandler(async (req, res) => {
    const { class: studentClass } = req.query;

    if (!studentClass) {
        throw new ApiError(400, "class query parameter is required");
    }

    const filter = {
        status: "admitted",
        class: studentClass,
        ...branchFilter(req),
    };

    const students = await Student.find(filter)
        .select("fullName phone class branch")
        .sort({ fullName: 1 });

    return res.status(200).json(
        new ApiResponse(200, students, `${students.length} students found for ${studentClass}`)
    );
});

// ─── POST /api/v1/attendance/save ────────────────────────────────────────────
// Save/update bulk attendance for a class on a specific date
// Body: { date: "YYYY-MM-DD", class: "10th", records: [{ student, status }], notes }
export const saveAttendance = asyncHandler(async (req, res) => {
    const { date, class: studentClass, records, notes } = req.body;

    if (!date || !studentClass || !records || !Array.isArray(records) || records.length === 0) {
        throw new ApiError(400, "date, class, and records[] are required");
    }

    const attendanceDate = toISTMidnight(date);
    const userBranch = req.user.branch || "";

    // Validate all student IDs exist and belong to this branch
    const studentIds = records.map((r) => r.student);
    const students = await Student.find({ _id: { $in: studentIds } }).select(
        "fullName branch class"
    );
    const studentMap = Object.fromEntries(students.map((s) => [s._id.toString(), s]));

    // Build bulkWrite operations — upsert so re-saving same day updates instead of duplicating
    const operations = [];
    for (const record of records) {
        const student = studentMap[record.student];
        if (!student) {
            throw new ApiError(404, `Student not found: ${record.student}`);
        }

        if (!["present", "absent"].includes(record.status)) {
            throw new ApiError(400, `Invalid status "${record.status}" for student ${student.fullName}`);
        }

        operations.push({
            updateOne: {
                filter: { student: record.student, date: attendanceDate },
                update: {
                    $set: {
                        student: record.student,
                        studentName: student.fullName,
                        branch: student.branch,
                        class: student.class,
                        date: attendanceDate,
                        status: record.status,
                        markedBy: req.user._id,
                        notes: notes || "",
                    },
                },
                upsert: true,
            },
        });
    }

    const result = await Attendance.bulkWrite(operations);

    const presentCount = records.filter((r) => r.status === "present").length;
    const absentCount = records.filter((r) => r.status === "absent").length;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                date,
                class: studentClass,
                total: records.length,
                present: presentCount,
                absent: absentCount,
                upserted: result.upsertedCount,
                modified: result.modifiedCount,
            },
            `Attendance saved: ${presentCount} present, ${absentCount} absent`
        )
    );
});

// ─── GET /api/v1/attendance?date=YYYY-MM-DD&class=10th ──────────────────────
// Get attendance records for a specific date + class (used to pre-fill UI)
export const getAttendanceByDate = asyncHandler(async (req, res) => {
    const { date, class: studentClass } = req.query;

    if (!date) {
        throw new ApiError(400, "date query parameter is required");
    }

    const attendanceDate = toISTMidnight(date);

    const filter = {
        date: attendanceDate,
        ...branchFilter(req),
    };
    if (studentClass) filter.class = studentClass;

    const records = await Attendance.find(filter).sort({ studentName: 1 });

    return res.status(200).json(
        new ApiResponse(200, records, `${records.length} attendance records found`)
    );
});

// ─── GET /api/v1/attendance/student/:studentId ──────────────────────────────
// Get full attendance history for a specific student
export const getStudentAttendance = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    const records = await Attendance.find({ student: studentId })
        .sort({ date: -1 });

    // Calculate stats
    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            records,
            stats: { total, present, absent, percentage },
        }, `Attendance history fetched for student`)
    );
});

// ─── GET /api/v1/attendance/stats?class=10th&month=3&year=2026 ──────────────
// Get monthly attendance stats per student for a class
export const getAttendanceStats = asyncHandler(async (req, res) => {
    const { class: studentClass, month, year } = req.query;

    if (!studentClass || !month || !year) {
        throw new ApiError(400, "class, month, and year are required");
    }

    const m = parseInt(month);
    const y = parseInt(year);

    // Build date range for the month
    const startDate = new Date(y, m - 1, 1);          // 1st of month
    const endDate = new Date(y, m, 0, 23, 59, 59);    // last day of month

    const filter = {
        class: studentClass,
        date: { $gte: startDate, $lte: endDate },
        ...branchFilter(req),
    };

    const records = await Attendance.find(filter);

    // Group by student
    const statsMap = {};
    for (const r of records) {
        const sid = r.student.toString();
        if (!statsMap[sid]) {
            statsMap[sid] = {
                student: r.student,
                studentName: r.studentName,
                totalDays: 0,
                present: 0,
                absent: 0,
            };
        }
        statsMap[sid].totalDays++;
        if (r.status === "present") statsMap[sid].present++;
        else statsMap[sid].absent++;
    }

    // Calculate percentages
    const stats = Object.values(statsMap).map((s) => ({
        ...s,
        percentage: s.totalDays > 0 ? Math.round((s.present / s.totalDays) * 100) : 0,
    }));

    // Sort by name
    stats.sort((a, b) => a.studentName.localeCompare(b.studentName));

    return res.status(200).json(
        new ApiResponse(200, {
            month: m,
            year: y,
            class: studentClass,
            students: stats,
        }, `Attendance stats for ${studentClass} — ${month}/${year}`)
    );
});
