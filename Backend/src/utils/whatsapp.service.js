// ─── CHDS WhatsApp Service ────────────────────────────────────────────────────
// Docs: https://whatsapp-integration-system-chds.vercel.app/api-docs
// CHDS has built-in scheduling — no cron job needed on our server!
// Flow: when a FeeRecord is created → call scheduleFeeReminder() once
//       → CHDS will auto-send WhatsApp on the due date at 9:00 AM
// Uses plain text send (no Meta template approval needed)
// When you create a template later, switch to sendFeeReminderTemplate()

const CHDS_BASE_URL = "https://whatsapp-integration-system-chds.vercel.app";

/**
 * Normalize a phone number to the format expected by CHDS API
 * - Removes +, spaces, dashes
 * - Adds India country code (91) if missing
 */
const normalizePhone = (phone) => {
    let p = String(phone).replace(/[\s\-\(\)\+]/g, "");
    // Add country code if not present
    if (p.length === 10) {
        p = "91" + p;
    }
    return p;
};

/**
 * Sends a plain-text WhatsApp message via CHDS API
 * @param {string} phone - phone number (10-digit or with country code)
 * @param {string} message - message body
 * @returns {{ success: boolean, error?: string }}
 */
export const sendWhatsAppMessage = async (phone, message) => {
    const apiKey = process.env.CHDS_WA_API_KEY;
    if (!apiKey) {
        console.error("[WhatsApp] CHDS_WA_API_KEY is not set in .env");
        return { success: false, error: "API key not configured" };
    }

    const normalizedPhone = normalizePhone(phone);

    try {
        const res = await fetch(`${CHDS_BASE_URL}/api/messages/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                phone: normalizedPhone,
                message,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error(`[WhatsApp] Failed for ${normalizedPhone}:`, data);
            return { success: false, error: data?.message || "Unknown error" };
        }

        return { success: true, data };
    } catch (err) {
        console.error(`[WhatsApp] Network error for ${normalizedPhone}:`, err.message);
        return { success: false, error: err.message };
    }
};

/**
 * Builds & sends a monthly fee reminder to a student's parent
 * @param {{ studentName: string, parentPhone: string, month: number, year: number, dueDate: Date }} param0
 */
export const sendFeeReminder = async ({ studentName, parentPhone, month, year, dueDate }) => {
    const MONTH_NAMES = [
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    const dueDateStr = new Date(dueDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const message =
        `📚 *MindSeeds Fee Reminder*\n\n` +
        `Dear Parent,\n\n` +
        `Yeh message aapke Bache *${studentName}* ki monthly fees ki yaad dilane ke liye bheja gaya hai.\n\n` +
        `📅 *Month:* ${MONTH_NAMES[month]} ${year}\n` +
        `⏰ *Due Date:* ${dueDateStr}\n\n` +
        `Kripaya nirdharit samay par fees jama karein.\n` +
        `Dhanyavaad! 🙏`;

    return sendWhatsAppMessage(parentPhone, message);
};

// ─── Schedule a fee reminder via CHDS built-in scheduler ───────────────────────
// Call this ONCE when a FeeRecord is created.
// CHDS will automatically send the WhatsApp message on dueDate at 9:00 AM.
/**
 * @param {{ studentName: string, parentPhone: string, month: number, year: number, dueDate: Date }} param0
 * @returns {{ success: boolean, scheduledId?: string, error?: string }}
 */
export const scheduleFeeReminder = async ({ studentName, parentPhone, month, year, dueDate }) => {
    const apiKey = process.env.CHDS_WA_API_KEY;
    if (!apiKey) {
        console.error("[WhatsApp] CHDS_WA_API_KEY is not set in .env");
        return { success: false, error: "API key not configured" };
    }

    const MONTH_NAMES = [
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    const dueDateStr = new Date(dueDate).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
    });

    const message =
        `📚 *MindSeeds Fee Reminder*\n\n` +
        `Dear Parent,\n\n` +
        `Aaj *${studentName}* ki ${MONTH_NAMES[month]} ${year} ki fees due hai.\n\n` +
        `📅 *Due Date:* ${dueDateStr}\n\n` +
        `Kripaya aaj fees jama karein.\n` +
        `Dhanyavaad! 🙏`;

    // dueDate IST mein convert karo (UTC+5:30)
    // dueDate DB mein IST midnight ke roop mein store hai (e.g. March 11 IST = March 10 18:30 UTC)
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const dueDateIST = new Date(new Date(dueDate).getTime() + IST_OFFSET_MS);
    const dueDateISTStr = dueDateIST.toISOString().split('T')[0]; // "2026-03-11"

    // 1 din pehle ka IST date calculate karo
    const parts = dueDateISTStr.split('-');
    const dayBefore = new Date(
        parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) - 1
    );
    const yyyy = dayBefore.getFullYear();
    const mm = String(dayBefore.getMonth() + 1).padStart(2, '0');
    const dd = String(dayBefore.getDate()).padStart(2, '0');

    // Subah 9:00 AM IST = 03:30 UTC
    const scheduledTime = new Date(`${yyyy}-${mm}-${dd}T09:00:00+05:30`);

    const now = new Date();

    // Guard: if scheduled time is already past, send immediately instead
    if (scheduledTime <= now) {
        console.warn(`[WhatsApp] Scheduled time already past for ${studentName} — sending immediately`);
        return sendWhatsAppMessage(parentPhone, message);
    }

    const sendAt = scheduledTime.toISOString();

    try {
        const res = await fetch(`https://whatsapp-integration-system-chds.vercel.app/api/scheduled-messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                contact_phone: normalizePhone(parentPhone),
                send_at: sendAt,
                message,
                message_type: "text",
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error(`[WhatsApp] Schedule failed for ${studentName}:`, data);
            return { success: false, error: data?.message || "Unknown error" };
        }

        console.log(`[WhatsApp] ✅ Scheduled reminder for ${studentName} on ${sendAt} (1 day before due)`);
        return { success: true, scheduledId: data?.id || data?.data?.id };
    } catch (err) {
        console.error(`[WhatsApp] Network error (schedule) for ${studentName}:`, err.message);
        return { success: false, error: err.message };
    }
};

// ─── Template version (uncomment when Meta template is approved) ──────────────
// export const sendFeeReminderTemplate = async ({ studentName, parentPhone, month, year }) => {
//     const MONTH_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
//     const apiKey = process.env.CHDS_WA_API_KEY;
//     const res = await fetch(`${CHDS_BASE_URL}/api/messages/send-template`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
//         body: JSON.stringify({
//             phone: normalizePhone(parentPhone),
//             template_name: "monthly_fees_reminder",   // <-- your template name here
//             language: "hi",
//             template_values: [studentName, MONTH_NAMES[month], String(year)],
//         }),
//     });
//     return res.ok ? { success: true } : { success: false, error: (await res.json())?.message };
// };
