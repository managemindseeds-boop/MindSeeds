import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { DemoLecture } from "../models/demoLecture.model.js";

// Helper: schedule 4 demo lectures starting from tomorrow
const scheduleDefaultDemos = async (student) => {
    const lectures = [];
    for (let i = 0; i < 4; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i + 1); // Day 1, 2, 3, 4 (starting tomorrow)
        lectures.push({
            student: student._id,
            studentName: student.fullName,
            studentClass: student.class,
            branch: student.branch,
            lectureNumber: i + 1,
            scheduledDate: date,
            attended: null,
        });
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
    } = req.body;

    // Validate required fields
    if (!fullName || !phone || !gender || !address || !parentName || !parentPhone || !studentClass || !branch) {
        throw new ApiError(400, "fullName, phone, gender, address, parentName, parentPhone, class and branch are required");
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
        addedBy: req.user._id,
    });

    // Auto-schedule 4 demo lectures starting from tomorrow
    await scheduleDefaultDemos(student);

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
