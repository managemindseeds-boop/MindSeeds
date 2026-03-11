import { Router } from "express";
import {
    getTodaysDemos,
    getUpcomingDemos,
    getAbsentDemos,
    getDemosByStudent,
    markAttendance,
    rescheduleDemo,
    updateDemo,
} from "../controllers/demo.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/today", getTodaysDemos);
router.get("/upcoming", getUpcomingDemos);
router.get("/absent", getAbsentDemos);
router.get("/student/:studentId", getDemosByStudent);
router.patch("/:id/attendance", markAttendance);
router.patch("/:id/reschedule", rescheduleDemo);
router.patch("/:id/update", updateDemo);

export default router;
