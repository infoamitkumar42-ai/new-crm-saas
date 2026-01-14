/**
 * 🧪 TEST: Verify PURE MIN-LEAD ROTATION
 * Run this function in GAS to see if minimum-lead user always wins
 */
function testWeightedLogic() {
  Logger.log('🧪 TESTING PURE MIN-LEAD ROTATION');
  
  // Dummy Users with different lead counts
  var users = [
    { name: 'User_At_0', plan_name: 'Supervisor', leads_today: 0, user_id: 'a' },
    { name: 'User_At_1', plan_name: 'Manager', leads_today: 1, user_id: 'b' },
    { name: 'User_At_3', plan_name: 'Supervisor', leads_today: 3, user_id: 'c' },
    { name: 'User_At_5', plan_name: 'Weekly', leads_today: 5, user_id: 'd' }
  ];
  
  var results = { 'User_At_0': 0, 'User_At_1': 0, 'User_At_3': 0, 'User_At_5': 0 };
  var totalRuns = 100;
  
  // Run Simulations
  for (var i = 0; i < totalRuns; i++) {
    var winner = getPriorityUser(users);
    if (winner) {
      results[winner.name]++;
    }
  }
  
  Logger.log('📊 RESULTS (100 Runs):');
  Logger.log('   User_At_0 (0 Leads): ' + results['User_At_0'] + ' (Target: 100%)');
  Logger.log('   User_At_1 (1 Lead): ' + results['User_At_1'] + ' (Target: 0%)');
  Logger.log('   User_At_3 (3 Leads): ' + results['User_At_3'] + ' (Target: 0%)');
  Logger.log('   User_At_5 (5 Leads): ' + results['User_At_5'] + ' (Target: 0%)');
  
  // Validation - User at 0 should win 100%
  var zeroWins = results['User_At_0'] === 100;
  var othersZero = results['User_At_1'] === 0 && results['User_At_3'] === 0 && results['User_At_5'] === 0;
  
  if (zeroWins && othersZero) {
    Logger.log('✅ TEST PASSED: User with 0 leads got 100% picks!');
  } else {
    Logger.log('❌ TEST FAILED: Rotation broken - wrong user picked.');
  }
}

// ============================================================================
// COPY OF getPriorityUser FOR STANDALONE TESTING
// ============================================================================

/**
 * PURE STRICT ROUND-ROBIN - NO TIER SYSTEM
 * Just pick whoever has the MINIMUM leads_today
 */
function getPriorityUser(users) {
  if (!users || users.length === 0) return null;
  
  // PURE ROTATION: Sort ALL users by leads_today (ascending)
  users.sort(function(a, b) {
    var leadsA = a.leads_today || 0;
    var leadsB = b.leads_today || 0;
    
    if (leadsA !== leadsB) {
      return leadsA - leadsB;
    }
    
    var idA = a.user_id || '';
    var idB = b.user_id || '';
    return idA.localeCompare(idB);
  });
  
  return users[0];
}
