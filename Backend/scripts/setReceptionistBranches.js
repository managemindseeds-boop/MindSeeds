/**
 * One-time script: receptionist ko multiple branches assign karo
 * 
 * Usage:
 *   node scripts/setReceptionistBranches.js
 * 
 * Isko run karne se pehle neeche ASSIGNMENTS array edit karo.
 */

import mongoose from "mongoose";
import { User } from "../src/models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

// ─── YAHAN EDIT KARO ─────────────────────────────────────────────────────────
const ASSIGNMENTS = [
    { username: "receptionist", branches: ["Mawaddah", "E Ward"] },
    // { username: "receptionist2", branches: ["Gordon Hall", "Aghadi"] },
];
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
    await mongoose.connect(`${process.env.MONGODB_URI}/Mindseed`);
    console.log("✅ Connected to MongoDB\n");

    for (const { username, branches } of ASSIGNMENTS) {
        const user = await User.findOne({ username });

        if (!user) {
            console.log(`❌ User not found: ${username}`);
            continue;
        }

        user.branches = branches;
        await user.save();
        console.log(`✅ ${username} → branches: [${branches.join(", ")}]`);
    }

    await mongoose.disconnect();
    console.log("\nDone.");
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
