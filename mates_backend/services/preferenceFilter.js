/**
 * preferenceFilter
 *
 * Filters candidate users based on the current user's preferences.
 * This runs BEFORE any feed-ranking algorithm so that every user
 * gets a consistent, preference-first experience.
 *
 * @param {Object} currentUser   - The logged-in user (full document)
 * @param {Array}  candidateUsers - Array of user documents to filter
 * @returns {Array} Filtered array of eligible candidates
 */
function preferenceFilter(currentUser, candidateUsers) {
    console.log(`\nTotal users fetched: ${candidateUsers.length}`);
    return candidateUsers.filter((candidate) => {
        // ─────────────────────────────────────────────
        // 1. Don't show yourself
        // ─────────────────────────────────────────────
        if (candidate._id.equals(currentUser._id)) {
            return false;
        }

        // ─────────────────────────────────────────────
        // 2. Exclude liked / disliked / blocked users
        // ─────────────────────────────────────────────
        const likedIds = (currentUser.likedUsers || []).map((id) =>
            id.toString()
        );
        const dislikedIds = (currentUser.dislikedUsers || []).map((id) =>
            id.toString()
        );
        const blockedIds = (currentUser.blockedUsers || []).map((id) =>
            id.toString()
        );

        if (likedIds.includes(candidate._id.toString())) return false;
        if (dislikedIds.includes(candidate._id.toString())) return false;
        if (blockedIds.includes(candidate._id.toString())) return false;

        // ─────────────────────────────────────────────
        // 3. Gender Preference
        // ─────────────────────────────────────────────
        if (
            currentUser.preferences.genders.length &&
            !currentUser.preferences.genders.includes(candidate.gender)
        ) {
            return false;
        }

        // ─────────────────────────────────────────────
        // 4. Age Preference
        // ─────────────────────────────────────────────
        if (
            candidate.age < currentUser.preferences.minAge ||
            candidate.age > currentUser.preferences.maxAge
        ) {
            return false;
        }

        // ─────────────────────────────────────────────
        // 5. Looking For (mutual match)
        // ─────────────────────────────────────────────
        if (
            currentUser.preferences.lookingFor.length &&
            !candidate.preferences.lookingFor.some((type) =>
                currentUser.preferences.lookingFor.includes(type)
            )
        ) {
            return false;
        }

        // ─────────────────────────────────────────────
        // 6. City Preference
        // ─────────────────────────────────────────────
        if (
            currentUser.preferences.cityPreference === "same-city" &&
            candidate.city?.trim().toLowerCase() !==
            currentUser.city?.trim().toLowerCase()
        ) {
            return false;
        }

        return true;
    });
}

module.exports = { preferenceFilter };

