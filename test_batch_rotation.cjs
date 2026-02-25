/**
 * 🧪 Test Script: Sequential Batch Distribution (v47)
 * Logic: Tier Priority -> Mid-Batch Sticky -> Lowest Batch Count
 */

function sortUsersForBatch(users) {
    const BATCH_SIZE = 15;

    return users.sort((a, b) => {
        // 1. Tier Priority
        const tierMap = { 'turbo': 5, 'boost': 4, 'manager': 3, 'supervisor': 2, 'starter': 1, 'none': 0 };
        const aTier = tierMap[a.plan?.toLowerCase()] || 0;
        const bTier = tierMap[b.plan?.toLowerCase()] || 0;
        if (aTier !== bTier) return bTier - aTier;

        // 2. Mid-Batch Sticky Priority
        // A user is "mid-batch" if they have started a batch of 15 but not finished it.
        const aIsMid = (a.leads_today % BATCH_SIZE !== 0 && a.leads_today > 0);
        const bIsMid = (b.leads_today % BATCH_SIZE !== 0 && b.leads_today > 0);

        if (aIsMid && !bIsMid) return -1;
        if (!aIsMid && bIsMid) return 1;

        // 3. Batch Queue (Lowest "Full Batches" first)
        const aBatches = Math.floor(a.leads_today / BATCH_SIZE);
        const bBatches = Math.floor(b.leads_today / BATCH_SIZE);
        if (aBatches !== bBatches) return aBatches - bBatches;

        // 4. Final Tie-breaker (Round Robin / Email)
        return a.email.localeCompare(b.email);
    });
}

// --- TEST CASES ---
const mockUsers = [
    { email: 'user1_turbo@test.com', plan: 'turbo', leads_today: 0 },
    { email: 'user2_turbo@test.com', plan: 'turbo', leads_today: 16 }, // Mid-batch (16 % 15 = 1)
    { email: 'user3_boost@test.com', plan: 'boost', leads_today: 5 },  // Mid-batch (5 % 15 = 5)
    { email: 'user4_starter@test.com', plan: 'starter', leads_today: 0 },
    { email: 'user5_turbo@test.com', plan: 'turbo', leads_today: 15 }, // Batch finished
];

console.log('=== 🧪 SIMULATING DISTRIBUTION v47 ===');

let queue = [...mockUsers];
for (let i = 1; i <= 20; i++) {
    const sorted = sortUsersForBatch(queue);
    const winner = sorted[0];
    winner.leads_today++;
    console.log(`Lead #${i} -> Assigned to: ${winner.email} (New Total: ${winner.leads_today})`);
}
