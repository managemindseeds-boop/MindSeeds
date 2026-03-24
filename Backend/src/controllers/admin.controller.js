import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { DemoLecture } from "../models/demoLecture.model.js";
import { Attendance } from "../models/attendance.model.js";
import { User } from "../models/user.model.js";

// ──────────────────────────────────────────────────────────────────────────────
// Official 4 Branches — only these branches are valid in the system
// ──────────────────────────────────────────────────────────────────────────────
const OFFICIAL_BRANCHES = ["Mawaddah", "E Ward", "Gordon Hall", "Aghadi"];
const branchFilter = { branch: { $in: OFFICIAL_BRANCHES } };

// ──────────────────────────────────────────────────────────────────────────────
// Helper: today ki start aur end time — IST aware (UTC+5:30)
// ──────────────────────────────────────────────────────────────────────────────
const todayRange = () => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(Date.now() + IST_OFFSET_MS);
    const dateStr = nowIST.toISOString().split("T")[0];
    const start = new Date(dateStr + "T00:00:00+05:30");
    const end = new Date(dateStr + "T23:59:59.999+05:30");
    return { start, end };
};

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD — Aggregated KPIs across official branches only
// GET /api/v1/admin/dashboard
// ══════════════════════════════════════════════════════════════════════════════
export const getAdminDashboard = asyncHandler(async (req, res) => {
    const { start, end } = todayRange();

    const [
        totalStudents,
        statusCounts,
        todayDemoCount,
        pendingDemoCount,
        completedDemoCount,
        absentDemoCount,
        staffCount,
        branchStudentCounts,
        recentStudents,
        recentDemos,
    ] = await Promise.all([
        // Total students (official branches only)
        Student.countDocuments(branchFilter),

        // Students by status (official branches only)
        Student.aggregate([
            { $match: branchFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),

        // Today's pending demos (official branches only)
        DemoLecture.countDocuments({
            ...branchFilter,
            scheduledDate: { $gte: start, $lte: end },
            attended: null,
        }),

        // All pending demos (official branches only)
        DemoLecture.countDocuments({ ...branchFilter, attended: null }),

        // Completed demos (official branches only)
        DemoLecture.countDocuments({ ...branchFilter, attended: true }),

        // Absent demos (official branches only)
        DemoLecture.countDocuments({ ...branchFilter, attended: false }),

        // Total staff (receptionists)
        User.countDocuments({ role: "receptionist" }),

        // Students per branch (official branches only)
        Student.aggregate([
            { $match: branchFilter },
            { $group: { _id: "$branch", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),

        // Last 10 registered students (official branches only)
        Student.find(branchFilter)
            .sort({ createdAt: -1 })
            .limit(10)
            .select("fullName branch status class createdAt"),

        // Last 10 demo events (official branches only)
        DemoLecture.find({ ...branchFilter, attended: { $ne: null } })
            .sort({ updatedAt: -1 })
            .limit(10)
            .select("studentName branch lectureNumber attended updatedAt"),
    ]);

    // Parse status counts into an object
    const statusMap = {};
    for (const s of statusCounts) {
        statusMap[s._id] = s.count;
    }

    // Conversion rate: admitted / total
    const admittedCount = statusMap["admitted"] || 0;
    const conversionRate =
        totalStudents > 0
            ? Math.round((admittedCount / totalStudents) * 100)
            : 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                kpi: {
                    totalStudents,
                    todayDemos: todayDemoCount,
                    staffCount,
                    conversionRate,
                },
                statusBreakdown: {
                    enquiry: statusMap["enquiry"] || 0,
                    demo_scheduled: statusMap["demo_scheduled"] || 0,
                    demo_completed: statusMap["demo_completed"] || 0,
                    admitted: statusMap["admitted"] || 0,
                },
                demoStats: {
                    pending: pendingDemoCount,
                    completed: completedDemoCount,
                    absent: absentDemoCount,
                },
                branchPerformance: branchStudentCounts.map((b) => ({
                    branch: b._id,
                    students: b.count,
                })),
                recentActivity: {
                    students: recentStudents,
                    demos: recentDemos,
                },
            },
            "Admin dashboard data fetched"
        )
    );
});

// ══════════════════════════════════════════════════════════════════════════════
// STUDENTS — All students across official branches
// GET /api/v1/admin/students?search=&status=&branch=&page=1&limit=50
// ══════════════════════════════════════════════════════════════════════════════
export const getAllStudentsAdmin = asyncHandler(async (req, res) => {
    const { search, status, branch, page = 1, limit = 50 } = req.query;

    // Always filter to official branches
    const filter = { ...branchFilter };

    if (status && status !== "all") {
        filter.status = status;
    }
    if (branch && branch !== "all") {
        // Override branchFilter with specific branch (must be in official list)
        filter.branch = new RegExp(`^${branch}$`, "i");
    }
    if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
            { fullName: regex },
            { phone: regex },
            { email: regex },
            { parentName: regex },
            { parentPhone: regex },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [students, total] = await Promise.all([
        Student.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Student.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                students,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
            "Students fetched"
        )
    );
});

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT DETAIL — Single student with demos + attendance
// GET /api/v1/admin/students/:id
// ══════════════════════════════════════════════════════════════════════════════
export const getStudentDetailAdmin = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) throw new ApiError(404, "Student not found");

    const [demos, attendanceRecords] = await Promise.all([
        DemoLecture.find({ student: student._id }).sort({ lectureNumber: 1 }),
        Attendance.find({ student: student._id }).sort({ date: -1 }),
    ]);

    // Attendance stats
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(
        (r) => r.status === "present"
    ).length;
    const absentDays = totalDays - presentDays;
    const attendancePercentage =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                student,
                demos,
                attendance: {
                    records: attendanceRecords.slice(0, 30), // last 30
                    stats: {
                        total: totalDays,
                        present: presentDays,
                        absent: absentDays,
                        percentage: attendancePercentage,
                    },
                },
            },
            "Student detail fetched"
        )
    );
});

// ══════════════════════════════════════════════════════════════════════════════
// DEMOS — All demos across official branches only
// GET /api/v1/admin/demos?filter=today|upcoming|absent|all&branch=
// ══════════════════════════════════════════════════════════════════════════════
export const getAllDemosAdmin = asyncHandler(async (req, res) => {
    const { filter: demoFilter = "all", branch } = req.query;
    const { start, end } = todayRange();

    // Always filter to official branches
    const query = { ...branchFilter };

    if (branch && branch !== "all") {
        // Override with specific branch
        query.branch = new RegExp(`^${branch}$`, "i");
    }

    switch (demoFilter) {
        case "today":
            query.scheduledDate = { $gte: start, $lte: end };
            query.attended = null;
            break;
        case "upcoming":
            query.scheduledDate = { $gt: end };
            query.attended = null;
            break;
        case "absent":
            query.attended = false;
            break;
        case "all":
        default:
            break;
    }

    const demos = await DemoLecture.find(query).sort({ scheduledDate: -1 });

    // Quick stats (official branches only)
    const [todayCount, upcomingCount, absentCount, allCount] =
        await Promise.all([
            DemoLecture.countDocuments({
                ...branchFilter,
                scheduledDate: { $gte: start, $lte: end },
                attended: null,
            }),
            DemoLecture.countDocuments({
                ...branchFilter,
                scheduledDate: { $gt: end },
                attended: null,
            }),
            DemoLecture.countDocuments({ ...branchFilter, attended: false }),
            DemoLecture.countDocuments(branchFilter),
        ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                demos,
                stats: {
                    today: todayCount,
                    upcoming: upcomingCount,
                    absent: absentCount,
                    all: allCount,
                },
            },
            "Demos fetched"
        )
    );
});

// ══════════════════════════════════════════════════════════════════════════════
// STAFF — List all users
// GET /api/v1/admin/staff
// ══════════════════════════════════════════════════════════════════════════════
export const getStaffList = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, users, "Staff list fetched"));
});

// ══════════════════════════════════════════════════════════════════════════════
// STAFF — Create new receptionist
// POST /api/v1/admin/staff
// Body: { username, password, branches: ["Branch A", "Branch B"] }
// ══════════════════════════════════════════════════════════════════════════════
export const createStaff = asyncHandler(async (req, res) => {
    const { username, password, branches } = req.body;

    if (!username || !password) {
        throw new ApiError(400, "username and password are required");
    }

    // Validate branches — only allow official branches
    if (branches && branches.length > 0) {
        const invalidBranches = branches.filter(b => !OFFICIAL_BRANCHES.includes(b));
        if (invalidBranches.length > 0) {
            throw new ApiError(400, `Invalid branch(es): ${invalidBranches.join(", ")}. Allowed: ${OFFICIAL_BRANCHES.join(", ")}`);
        }
    }

    // Check duplicate
    const exists = await User.findOne({ username });
    if (exists) {
        throw new ApiError(409, `Username "${username}" already exists`);
    }

    const user = await User.create({
        username,
        password,
        role: "receptionist",
        branches: branches || [],
    });

    // Return without password
    const created = await User.findById(user._id).select("-password");

    return res
        .status(201)
        .json(new ApiResponse(201, created, "Staff account created"));
});

// ══════════════════════════════════════════════════════════════════════════════
// STAFF — Update existing staff
// PATCH /api/v1/admin/staff/:id
// Body: { username?, branches?, isActive? }
// ══════════════════════════════════════════════════════════════════════════════
export const updateStaff = asyncHandler(async (req, res) => {
    const { username, branches, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    // Validate branches — only allow official branches
    if (branches !== undefined && branches.length > 0) {
        const invalidBranches = branches.filter(b => !OFFICIAL_BRANCHES.includes(b));
        if (invalidBranches.length > 0) {
            throw new ApiError(400, `Invalid branch(es): ${invalidBranches.join(", ")}. Allowed: ${OFFICIAL_BRANCHES.join(", ")}`);
        }
    }

    if (username !== undefined) user.username = username;
    if (branches !== undefined) user.branches = branches;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const updated = await User.findById(user._id).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Staff updated"));
});

// ══════════════════════════════════════════════════════════════════════════════
// STAFF — Reset password
// PATCH /api/v1/admin/staff/:id/reset-password
// Body: { newPassword }
// ══════════════════════════════════════════════════════════════════════════════
export const resetStaffPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        throw new ApiError(400, "newPassword must be at least 6 characters");
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    user.password = newPassword;
    await user.save(); // pre-save hook will hash it

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Password reset successfully"));
});
