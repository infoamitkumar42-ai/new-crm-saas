/**
 * 🧪 TEST: Verify Weighted Random Distribution
 * Run this function in GAS to see if 3:2:1 ratio holds up.
 */
function testWeightedLogic() {
  Logger.log('🧪 TESTING WEIGHTED LOGIC (3:2:1)');
  
  // Dummy Users
  var users = [
    { name: 'TurboUser', plan_name: 'Turbo Boost' },   // Weight 3
    { name: 'SuperUser', plan_name: 'Supervisor' },    // Weight 2
    { name: 'StartUser', plan_name: 'Starter' }        // Weight 1
  ];
  
  var results = { 'TurboUser': 0, 'SuperUser': 0, 'StartUser': 0 };
  var totalRuns = 1000;
  
  // Run 1000 simulations
  for (var i = 0; i < totalRuns; i++) {
    var winner = getWeightedRandomUser(users);
    if (winner) {
      results[winner.name]++;
    }
  }
  
  // Calculate Percentages
  Logger.log('📊 RESULTS (1000 Runs):');
  Logger.log('   Turbo (Target ~50%): ' + results['TurboUser'] + ' (' + (results['TurboUser']/10) + '%)');
  Logger.log('   Super (Target ~33%): ' + results['SuperUser'] + ' (' + (results['SuperUser']/10) + '%)');
  Logger.log('   Start (Target ~16%): ' + results['StartUser'] + ' (' + (results['StartUser']/10) + '%)');
  
  // Validation
  var turboValid = results['TurboUser'] > 450 && results['TurboUser'] < 550;
  var superValid = results['SuperUser'] > 280 && results['SuperUser'] < 380;
  
  if (turboValid && superValid) {
    Logger.log('✅ TEST PASSED: Distribution is within statistical norms.');
  } else {
    Logger.log('❌ TEST FAILED: Distribution skewed/broken.');
  }
}
