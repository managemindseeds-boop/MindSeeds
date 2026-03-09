import { Router } from "express";
import {
    sendMonthlyFeeReminders,
    sendSingleFeeReminder,
    testScheduleReminder,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

// POST /api/v1/notifications/send-monthly-reminders
// → Sends WhatsApp to all students with pending fees this month
router.post("/send-monthly-reminders", sendMonthlyFeeReminders);

// POST /api/v1/notifications/send-reminder/:feeId
// → Sends WhatsApp to parent of a specific fee record (on-demand)
router.post("/send-reminder/:feeId", sendSingleFeeReminder);

// POST /api/v1/notifications/test-schedule
// → Test: N minutes baad schedule karo — { phone, name, minutesFromNow }
router.post("/test-schedule", testScheduleReminder);

export default router;

