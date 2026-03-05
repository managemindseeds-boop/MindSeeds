import { Router } from "express";
import {
    getTodaysFees,
    getThisMonthFees,
    getStudentFees,
    markFeePaid,
    rescheduleFee,
} from "../controllers/fee.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.get("/today", getTodaysFees);
router.get("/month", getThisMonthFees);
router.get("/student/:studentId", getStudentFees);
router.patch("/:id/pay", markFeePaid);
router.patch("/:id/reschedule", rescheduleFee);

export default router;
