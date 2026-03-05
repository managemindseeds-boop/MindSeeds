import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DemoLecture } from "../models/demoLecture.model.js";
import { Student } from "../models/student.model.js";

const todayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

// GET /api/v1/demos/today
export const getTodaysDemos = asyncHandler(async (req, res) => {
    const { start, end } = todayRange();
    const demos = await DemoLecture.find({
        scheduledDate: { $gte: start, $lte: end },
        attended: null,
    }).sort({ scheduledDate: 1 });

    return res.status(200).json(new ApiResponse(200, demos, "Today's demos fetched"));
});

// GET /api/v1/demos/upcoming
export const getUpcomingDemos = asyncHandler(async (req, res) => {
    const { end } = todayRange();
    const demos = await DemoLecture.find({
        scheduledDate: { $gt: end },
        attended: null,
    }).sort({ scheduledDate: 1 });

    return res.status(200).json(new ApiResponse(200, demos, "Upcoming demos fetched"));
});

// GET /api/v1/demos/absent
export const getAbsentDemos = asyncHandler(async (req, res) => {
    const demos = await DemoLecture.find({ attended: false }).sort({ scheduledDate: -1 });

    return res.status(200).json(new ApiResponse(200, demos, "Absent demos fetched"));
});

// GET /api/v1/demos/student/:studentId
export const getDemosByStudent = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const demos = await DemoLecture.find({ student: studentId }).sort({ lectureNumber: 1 });

    return res.status(200).json(new ApiResponse(200, demos, "Student demos fetched"));
});

// PATCH /api/v1/demos/:id/attendance
// Body: { attended: true | false }
export const markAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { attended } = req.body;

    if (typeof attended !== "boolean") {
        throw new ApiError(400, "attended must be true or false");
    }

    const demo = await DemoLecture.findByIdAndUpdate(
        id,
        { attended },
        { new: true }
    );

    if (!demo) throw new ApiError(404, "Demo not found");

    // Auto-update student status if all 4 demos are attended
    if (attended === true) {
        const studentId = demo.student;
        const allDemos = await DemoLecture.find({ student: studentId });
        const attendedCount = allDemos.filter(d => d.attended === true).length;

        if (attendedCount === 4) {
            const student = await Student.findById(studentId);
            if (student && student.status === 'enquiry') {
                student.status = 'demo_scheduled';
                await student.save();
            }
        }
    }

    return res.status(200).json(new ApiResponse(200, demo, "Attendance marked"));
});

// PATCH /api/v1/demos/:id/reschedule
// Body: { newDate: "YYYY-MM-DD", notes: "..." }
export const rescheduleDemo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newDate, notes } = req.body;

    if (!newDate) throw new ApiError(400, "newDate is required");

    const demo = await DemoLecture.findByIdAndUpdate(
        id,
        {
            scheduledDate: new Date(newDate),
            attended: null,         // reset — pending again
            notes: notes || "",
        },
        { new: true }
    );

    if (!demo) throw new ApiError(404, "Demo not found");

    return res.status(200).json(new ApiResponse(200, demo, "Demo rescheduled"));
});
