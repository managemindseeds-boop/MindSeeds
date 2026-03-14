/**
 * Returns a MongoDB filter object based on the logged-in user's role.
 *   - Admin    → {} (no filter — sees ALL branches)
 *   - Receptionist → { branch } with case-insensitive match
 * Uses $regex with 'i' flag so "AB Road", "AB ROAD", "ab road" all match.
 */
export const branchFilter = (req) => {
    if (req.user.role === 'admin') return {};
    const branch = req.user.branch || '';
    return { branch: { $regex: new RegExp(`^${branch}$`, 'i') } };
};
