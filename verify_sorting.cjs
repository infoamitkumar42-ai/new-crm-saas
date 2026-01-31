function testLogic() {
    console.log("🆚 LOGIC BATTLE: Old vs New Sorting\n");

    // Scenario: Starter stuck at 2, Supervisor ahead at 4.
    const userA = { name: "Starter Guy", leads: 2, plan: "starter" };
    const userB = { name: "Supervisor Pro", leads: 4, plan: "supervisor" };

    console.log(`🥊 Contenders:`);
    console.log(`   A: ${userA.name} (Leads: ${userA.leads}, Plan: ${userA.plan})`);
    console.log(`   B: ${userB.name} (Leads: ${userB.leads}, Plan: ${userB.plan})`);
    console.log("-".repeat(40));

    // --- OLD LOGIC SIMULATION ---
    // Rules: 1. Batch Check (Both match 'Even' batch start), 2. Plan Weight
    const getWeight = (p) => p === 'supervisor' ? 80 : 10;

    // Sort Result (Old)
    // A and B both in "Batch" (2 is even, 4 is even) -> Tie.
    // Plan Weight: Supervisor (80) > Starter (10). Supervisor wins.
    const oldWinner = userB;

    console.log(`❌ OLD LOGIC RESULT:`);
    console.log(`   Winner: ${oldWinner.name} 🏆`);
    console.log(`   Reason: Higher Plan Weight (Supervisor > Starter)`);
    console.log(`   Consequence: Starter gets STUCK at 2 leads.`);

    console.log("-".repeat(40));

    // --- NEW LOGIC SIMULATION ---
    // Rules: 1. LEADS COUNT (Less is better)
    let newWinner;
    const diff = userA.leads - userB.leads; // 2 - 4 = -2
    if (diff < 0) newWinner = userA;
    else if (diff > 0) newWinner = userB;
    else newWinner = (getWeight(userB.plan) > getWeight(userA.plan)) ? userB : userA;

    console.log(`✅ NEW LOGIC RESULT (Just Fixed):`);
    console.log(`   Winner: ${newWinner.name} 🏆`);
    console.log(`   Reason: Has Fewer Leads (2 < 4)`);
    console.log(`   Benefit: Starter catches up! Rotation is Equal.`);
}

testLogic();
