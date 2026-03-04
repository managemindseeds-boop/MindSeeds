import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";

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

    return res.status(201).json(
        new ApiResponse(201, student, "Student enquiry registered successfully")
    );
});

// GET /api/v1/students
export const getAllStudents = asyncHandler(async (req, res) => {
    const students = await Student.find().sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, students, "Students fetched successfully")
    );
});
