import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DemoLecture } from "../models/demoLecture.model.js";
import { Student } from "../models/student.model.js";

// Helper: today ki start aur end time — IST aware (UTC+5:30)
const todayRange = () => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(Date.now() + IST_OFFSET_MS);
    const dateStr = nowIST.toISOString().split('T')[0]; // "2026-03-10"
    const start = new Date(dateStr + 'T00:00:00+05:30');
    const end = new Date(dateStr + 'T23:59:59.999+05:30');
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

    const demo = await DemoLecture.findById(id);
    if (!demo) throw new ApiError(404, "Demo not found");

    demo.attended = attended;

    if (attended === false) {
        // Auto-reschedule: find the latest scheduledDate among all demos for this student
        const allDemos = await DemoLecture.find({ student: demo.student });
        const latestDate = allDemos.reduce((max, d) => {
            return new Date(d.scheduledDate) > new Date(max) ? d.scheduledDate : max;
        }, demo.scheduledDate);

        const autoRescheduledDate = new Date(latestDate);
        autoRescheduledDate.setDate(autoRescheduledDate.getDate() + 1); // lastDate + 1

        demo.scheduledDate = autoRescheduledDate;
        demo.notes = demo.notes || "Auto-rescheduled due to absence";
    }

    await demo.save();

    // When present: check if all 4 demos attended → advance student to demo_scheduled
    if (attended === true) {
        const allDemos = await DemoLecture.find({ student: demo.student });
        const allAttended = allDemos.length === 4 && allDemos.every(d => d.attended === true);
        if (allAttended) {
            await Student.findByIdAndUpdate(demo.student, { status: "demo_completed" });
        }
    }

    return res.status(200).json(new ApiResponse(200, demo,
        attended === false
            ? `Marked absent — auto-rescheduled to ${demo.scheduledDate.toDateString()}`
            : "Attendance marked as present"
    ));
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

// PATCH /api/v1/demos/:id/update
// Body: { scheduledDate?: "YYYY-MM-DD", subject?: "...", notes?: "..." }
export const updateDemo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { scheduledDate, subject, notes } = req.body;

    const update = {};
    if (scheduledDate) update.scheduledDate = new Date(scheduledDate);
    if (subject !== undefined) update.subject = subject;
    if (notes !== undefined) update.notes = notes;

    const demo = await DemoLecture.findByIdAndUpdate(id, update, { new: true });
    if (!demo) throw new ApiError(404, "Demo not found");

    return res.status(200).json(new ApiResponse(200, demo, "Demo updated"));
});
if (!result.success) {
    const errorDetails = result.results?.map(r => r.error).filter(Boolean).join(", ") || "Unknown error";
    throw new ApiError(500, `Failed to send demo reminder: ${errorDetails}`);
}

return res.status(200).json(new ApiResponse(200, result, "Demo reminder sent successfully"));
    } catch (error) {
    console.error(`[sendDemoReminderHandler] Caught Error:`, error);
    throw error;
}
});
