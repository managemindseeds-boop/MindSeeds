import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { branchFilter } from "../utils/branchFilter.js";

// ─── POST /api/v1/notifications/test-schedule ────────────────────────────────
// Test endpoint — N minutes baad WhatsApp schedule karo (bina code change kiye!)
// Body: { phone: "9876543210", name: "Test Student", minutesFromNow: 2 }
export const testScheduleReminder = asyncHandler(async (req, res) => {
    const { phone, name, minutesFromNow = 2 } = req.body;

    if (!phone || !name) {
        throw new ApiError(400, "phone aur name required hai");
    }

    const mins = Math.min(Math.max(parseInt(minutesFromNow) || 2, 1), 60);

    const apiKey = process.env.CHDS_WA_API_KEY;
    if (!apiKey) throw new ApiError(500, "CHDS_WA_API_KEY not set");

    // Normalize phone
    let p = String(phone).replace(/[\s\-\(\)\+]/g, "");
    if (p.length === 10) p = "91" + p;

    const sendAt = new Date(Date.now() + mins * 60 * 1000).toISOString();
    const now = new Date();
    const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const message =
        `📚 *MindSeeds Test Message*\n\n` +
        `Hi *${name}*,\n\n` +
        `Yeh ek test WhatsApp message hai — scheduled ${mins} minute(s) pehle.\n\n` +
        `📅 *Date:* ${now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
        `Dhanyavaad! 🙏\n\n` +
        `_(Yeh ek test message hai)_`;

    const chdsRes = await fetch("https://whatsapp-integration-system-chds.vercel.app/api/scheduled-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ contact_phone: p, send_at: sendAt, message, message_type: "text" }),
    });

    const data = await chdsRes.json();
    if (!chdsRes.ok) {
        throw new ApiError(502, `CHDS error: ${data?.detail?.message || JSON.stringify(data)}`);
    }

    return res.status(200).json(
        new ApiResponse(200,
            { scheduledFor: sendAt, phone: p, minutesFromNow: mins },
            `✅ Test reminder scheduled! ${mins} minute(s) mein WhatsApp aayega.`
        )
    );
});
