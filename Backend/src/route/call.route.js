import { Router } from "express";
import {
    getCalls,
    getPendingCallsCount,
    markCallDone,
    reopenCall,
    updateCall,
    getCallActivity,
    partialPayCall
} from "../controllers/call.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.get("/activity", getCallActivity);       // GET activity log
router.get("/", getCalls);                      // GET ?status=pending|done|all
router.get("/count", getPendingCallsCount);     // GET pending count for badge
router.patch("/:id/done", markCallDone);        // PATCH mark as done
router.patch("/:id/reopen", reopenCall);        // PATCH reopen
router.patch("/:id/partial-pay", partialPayCall); // PATCH partial payment + distribute remaining
router.patch("/:id", updateCall);               // PATCH generic status update

export default router;
