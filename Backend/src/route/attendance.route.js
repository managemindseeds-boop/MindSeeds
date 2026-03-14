import { Router } from "express";
import {
    getStudentsForAttendance,
    saveAttendance,
    getAttendanceByDate,
    getStudentAttendance,
    getAttendanceStats,
} from "../controllers/attendance.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/students", getStudentsForAttendance);   // GET admitted students for a class
router.post("/save", saveAttendance);                 // POST bulk save/update attendance
router.get("/", getAttendanceByDate);                 // GET attendance for a date+class
router.get("/student/:studentId", getStudentAttendance); // GET student's full history
router.get("/stats", getAttendanceStats);             // GET monthly stats per student

export default router;
