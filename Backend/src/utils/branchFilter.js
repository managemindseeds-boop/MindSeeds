/**
 * Returns a MongoDB filter object based on the logged-in user's role.
 *   - Admin         → {} (no filter — sees ALL branches)
 *   - Receptionist  → { branch: { $in: [...regexes] } }
 *     A receptionist can be assigned to multiple branches.
 *     Each branch uses a case-insensitive regex so "Mawaddah" == "mawaddah".
 */
export const branchFilter = (req) => {
    if (req.user.role === 'admin') return {};

    const branches = req.user.branches || [];

    if (branches.length === 0) {
        // Receptionist has no branch assigned — return nothing
        return { branch: { $in: [] } };
    }

    // Build a case-insensitive regex for each assigned branch
    const regexList = branches.map((b) => new RegExp(`^${b}$`, 'i'));
    return { branch: { $in: regexList } };
};
