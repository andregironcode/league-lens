console.log('🏆 Testing Upcoming Matches System with Competition Rankings\n');

const runTests = async () => {
  try {
    // Dynamic import for TypeScript module
    const { 
      getActiveCompetitions, 
      getFallbackCompetitions, 
      getCompetitionsWithApiIds,
      getMatchDateRange,
      isCompetitionActive,
      TOP_50_COMPETITIONS
    } = await import('../src/config/competitionsRanking.ts');

    // Test 1: Check current active competitions
    console.log('📅 Current Active Competitions:');
    const now = new Date();
    const activeComps = getActiveCompetitions(now);
    console.log(`Found ${activeComps.length} active competitions:`);
    activeComps.forEach(comp => {
      console.log(`  ${comp.rank}. ${comp.name} (Tier ${comp.tier}) - ${comp.region}`);
    });

    // Test 2: Check fallback competitions
    console.log('\n🔄 Fallback Competitions (if no top tier active):');
    const fallbackComps = getFallbackCompetitions(now);
    console.log(`Found ${fallbackComps.length} fallback competitions:`);
    fallbackComps.slice(0, 10).forEach(comp => {
      console.log(`  ${comp.rank}. ${comp.name} (Tier ${comp.tier}) - ${comp.region}`);
    });

    // Test 3: Check competitions with API IDs
    console.log('\n🔗 Competitions with Known API IDs:');
    const apiComps = getCompetitionsWithApiIds();
    console.log(`Found ${apiComps.length} competitions with API IDs:`);
    apiComps.forEach(comp => {
      console.log(`  ${comp.name} - ID: ${comp.highlightlyId} (Tier ${comp.tier})`);
    });

    // Test 4: Check date range for matches
    console.log('\n📆 Match Date Range (-1 day to +5 days):');
    const { startDate, endDate } = getMatchDateRange();
    console.log(`Start: ${startDate.toISOString().split('T')[0]}`);
    console.log(`End: ${endDate.toISOString().split('T')[0]}`);

    // Test 5: Test season awareness
    console.log('\n🌍 Season Awareness Test:');
    const testDates = [
      new Date('2025-01-15'), // January (regular season)
      new Date('2025-06-15'), // June (off-season)
      new Date('2025-08-15'), // August (season start)
      new Date('2025-12-15')  // December (regular season)
    ];

    testDates.forEach(testDate => {
      console.log(`\nTesting date: ${testDate.toISOString().split('T')[0]}`);
      const activeForDate = getActiveCompetitions(testDate);
      const fallbackForDate = getFallbackCompetitions(testDate);
      
      console.log(`  Active competitions: ${activeForDate.length}`);
      console.log(`  Fallback competitions: ${fallbackForDate.length}`);
      
      if (activeForDate.length > 0) {
        console.log(`  Top active: ${activeForDate[0].name} (Tier ${activeForDate[0].tier})`);
      }
    });

    // Test 6: Individual competition activity check
    console.log('\n🔍 Individual Competition Activity Check:');
    const keyCompetitions = [
      'English Premier League',
      'Spanish La Liga', 
      'FIFA Club World Cup',
      'UEFA Euro'
    ];

    keyCompetitions.forEach(compName => {
      const comp = TOP_50_COMPETITIONS.find(c => c.name === compName);
      if (comp) {
        const isActive = isCompetitionActive(comp, now);
        console.log(`  ${comp.name}: ${isActive ? '✅ Active' : '❌ Inactive'} (Tier ${comp.tier})`);
      }
    });

    // Test 7: Smart league selection simulation
    console.log('\n🎯 Smart League Selection Simulation:');
    const smartSelection = () => {
      const activeComps = getActiveCompetitions(now);
      const fallbackComps = getFallbackCompetitions(now);
      const competitionsWithIds = getCompetitionsWithApiIds();
      
      const availableCompetitions = activeComps.length > 0 ? activeComps : fallbackComps;
      
      // Filter to only include competitions we can actually fetch from API
      const fetchableCompetitions = availableCompetitions.filter(comp => 
        competitionsWithIds.some(apiComp => apiComp.id === comp.id)
      );
      
      // If no fetchable active competitions, fall back to our known working leagues
      if (fetchableCompetitions.length === 0) {
        console.log('  No fetchable active competitions, using default leagues');
        return competitionsWithIds.slice(0, 7);
      }
      
      return fetchableCompetitions.slice(0, 10);
    };

    const selectedComps = smartSelection();
    console.log(`Selected ${selectedComps.length} competitions for upcoming matches:`);
    selectedComps.forEach(comp => {
      console.log(`  ${comp.name} (ID: ${comp.highlightlyId}) - Tier ${comp.tier}`);
    });

    console.log('\n✅ Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Total competitions in ranking: ${TOP_50_COMPETITIONS.length}`);
    console.log(`- Currently active: ${activeComps.length}`);
    console.log(`- With API IDs: ${apiComps.length}`);
    console.log(`- Selected for fetching: ${selectedComps.length}`);
    console.log(`- Date range: ${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days`);

    // Test 8: System readiness check
    console.log('\n🚀 System Readiness Check:');
    const readiness = {
      competitionsConfigured: TOP_50_COMPETITIONS.length >= 50,
      apiIdsAvailable: apiComps.length >= 5,
      activeCompetitionsFound: activeComps.length > 0 || fallbackComps.length > 0,
      fetchableCompetitionsAvailable: selectedComps.length > 0,
      dateRangeValid: (endDate - startDate) > 0
    };

    Object.entries(readiness).forEach(([check, passed]) => {
      console.log(`  ${check}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    });

    const allReady = Object.values(readiness).every(Boolean);
    console.log(`\n${allReady ? '🎉 System is ready for deployment!' : '⚠️ System needs attention before deployment'}`);

    if (!allReady) {
      console.log('\n🔧 Issues to address:');
      Object.entries(readiness).forEach(([check, passed]) => {
        if (!passed) {
          console.log(`  - ${check}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error running tests:', error);
  }
};

// Run the tests
runTests(); 