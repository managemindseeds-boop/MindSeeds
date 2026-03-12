import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { DemoLecture } from "../models/demoLecture.model.js";

// Class-based demo subjects (mirrors the frontend mapping)
const CLASS_SUBJECTS = {
    '8th': ['Mathematics', 'Science', 'English', 'Social Studies'],
    '9th': ['Mathematics', 'Physics', 'Chemistry', 'English'],
    '10th': ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
    '11th': ['Mathematics', 'Physics', 'Chemistry', 'English'],
    '12th': ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
};
const FALLBACK_SUBJECTS = ['Mathematics', 'Science', 'English', 'Reasoning'];

// Helper: schedule 4 demo lectures — uses frontend-provided dates+subjects if available
const scheduleDemos = async (student, demoLecturesFromFrontend) => {
    const subjects = CLASS_SUBJECTS[student.class] || FALLBACK_SUBJECTS;
    const lectures = [];

    if (demoLecturesFromFrontend && Array.isArray(demoLecturesFromFrontend) && demoLecturesFromFrontend.length === 4) {
        // Use the dates/subjects chosen on Page 2 of the form
        demoLecturesFromFrontend.forEach((lec, i) => {
            lectures.push({
                student: student._id,
                studentName: student.fullName,
                studentClass: student.class,
                branch: student.branch,
                lectureNumber: i + 1,
                scheduledDate: new Date(lec.date || lec.scheduledDate),
                subject: subjects[i],
                attended: null,
            });
        });
    } else {
        // Fallback: auto-schedule starting tomorrow
        for (let i = 0; i < 4; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i + 1);
            lectures.push({
                student: student._id,
                studentName: student.fullName,
                studentClass: student.class,
                branch: student.branch,
                lectureNumber: i + 1,
                scheduledDate: date,
                subject: subjects[i],
                attended: null,
            });
        }
    }

    await DemoLecture.insertMany(lectures);
};

// POST /api/v1/students/add
export const addStudent = asyncHandler(async (req, res) => {
    const {
        fullName,
        phone,
        gender,
        email,
        address,
        parentName,
        parentPhone,
        class: studentClass,
        branch,
        demoLectures,   // optional — sent from Page 2 of the registration form
    } = req.body;

    // Validate required fields
    if (!fullName || !phone || !gender || !address || !parentName || !parentPhone || !studentClass || !branch) {
        throw new ApiError(400, "fullName, phone, gender, address, parentName, parentPhone, class and branch are required");
    }

    if (!/^\d{10}$/.test(phone)) {
        throw new ApiError(400, "Phone number must be exactly 10 digits");
    }
    if (!/^\d{10}$/.test(parentPhone)) {
        throw new ApiError(400, "Parent phone number must be exactly 10 digits");
    }

    const student = await Student.create({
        fullName,
        phone,
        gender,
        email,
        address,
        parentName,
        parentPhone,
        class: studentClass,
        branch,
        status: "demo_scheduled",
        addedBy: req.user._id,
    });

    // Auto-schedule 4 demo lectures (with correct class-based subjects)
    await scheduleDemos(student, demoLectures);

    return res.status(201).json(
        new ApiResponse(201, { student }, "Student registered and 4 demo lectures scheduled successfully")
    );
});


// GET /api/v1/students
export const getAllStudents = asyncHandler(async (req, res) => {
    const students = await Student.find().sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, students, "Students fetched successfully")
    );
});

// GET /api/v1/students/:studentId/demos
export const getStudentDemos = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    const demos = await DemoLecture.find({ student: studentId }).sort({ lectureNumber: 1 });

    return res.status(200).json(
        new ApiResponse(200, demos, "Demo lectures fetched successfully")
    );
});

// GET /api/v1/students/:id
export const getStudentById = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) throw new ApiError(404, "Student not found");

    return res.status(200).json(
        new ApiResponse(200, student, "Student fetched successfully")
    );
});

// PATCH /api/v1/students/:id/status
// Body: { status: "enquiry" | "demo_scheduled" | "admitted" | "active" }
export const updateStudentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["enquiry", "demo_scheduled", "demo_completed"];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const student = await Student.findById(id);
    if (!student) throw new ApiError(404, "Student not found");

    student.status = status;



    await student.save();

    return res.status(200).json(
        new ApiResponse(200, student, `Student status updated to "${status}"`)
    );
});
