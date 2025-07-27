import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://septerrkdnojsmtmmska.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0MDY4MCwiZXhwIjoyMDYzOTE2NjgwfQ.0jHWphqfH1vYUpZoXCBLI_IFpoupFUlQo5jb9XqWaKw";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get command line arguments
const startIndex = parseInt(process.argv[2]) || 0;
const batchCount = parseInt(process.argv[3]) || 200; // Default to 200 matches per run

async function fixMatchYearsBatch() {
  console.log(`🔧 Fixing match years from 2025 to 2024 (starting at index ${startIndex}, processing ${batchCount} matches)...`);

  try {
    // First, get all matches that need fixing
    const { data: matchesToFix, error: countError } = await supabase
      .from("matches")
      .select("id, match_date, status")
      .gte("match_date", "2025-01-01")
      .lte("match_date", "2025-12-31")
      .order("id", { ascending: true });

    if (countError) {
      console.error("Error counting matches to fix:", countError);
      return;
    }

    console.log(`Found ${matchesToFix?.length || 0} total matches with 2025 dates`);

    if (!matchesToFix || matchesToFix.length === 0) {
      console.log("No matches to fix!");
      return;
    }

    // Calculate batch range
    const endIndex = Math.min(startIndex + batchCount, matchesToFix.length);
    const batchToProcess = matchesToFix.slice(startIndex, endIndex);

    console.log(`\nProcessing matches ${startIndex + 1} to ${endIndex} (${batchToProcess.length} matches)`);

    // Show sample of matches to be fixed
    console.log("\nSample of matches in this batch:");
    batchToProcess.slice(0, 5).forEach((match) => {
      console.log(
        `- Match ${match.id}: ${match.match_date} (Status: ${match.status})`
      );
    });

    console.log("\n⚠️  Starting update...");

    // Update matches in smaller chunks
    const chunkSize = 25;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < batchToProcess.length; i += chunkSize) {
      const chunk = batchToProcess.slice(i, i + chunkSize);
      const chunkPromises = [];

      for (const match of chunk) {
        const oldDate = new Date(match.match_date);
        const newDate = new Date(oldDate);
        newDate.setFullYear(2024);

        const updatePromise = supabase
          .from("matches")
          .update({
            match_date: newDate.toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          })
          .eq("id", match.id)
          .then((result) => {
            if (result.error) {
              console.error(`Error updating match ${match.id}:`, result.error);
              errors++;
            } else {
              updated++;
            }
          });

        chunkPromises.push(updatePromise);
      }

      // Wait for chunk to complete
      await Promise.all(chunkPromises);

      const overallProgress = startIndex + updated;
      console.log(
        `Progress: ${updated}/${batchToProcess.length} in this batch | ${overallProgress}/${matchesToFix.length} overall (${Math.round((overallProgress / matchesToFix.length) * 100)}%)`
      );
      
      // Small delay between chunks
      if (i + chunkSize < batchToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(
      `\n✅ Batch complete: ${updated} matches updated (${errors} errors)`
    );

    // Check if there are more matches to process
    const remaining = matchesToFix.length - endIndex;
    if (remaining > 0) {
      console.log(`\n📌 ${remaining} matches still need updating.`);
      console.log(`To continue, run: npm run fix-matches-batch ${endIndex} ${batchCount}`);
    } else {
      console.log("\n🎉 All matches have been updated!");
      
      // Now fix status for past matches
      console.log("\n🔧 Fixing status for past matches...");

      const today = new Date().toISOString().split("T")[0];
      const { data: pastMatchesWithWrongStatus, error: statusError } =
        await supabase
          .from("matches")
          .select("id, match_date, status, home_score, away_score")
          .lt("match_date", today)
          .or("status.eq.Not Started,status.eq.Scheduled,status.eq.NS")
          .not("home_score", "is", null);

      if (pastMatchesWithWrongStatus && pastMatchesWithWrongStatus.length > 0) {
        console.log(
          `Found ${pastMatchesWithWrongStatus.length} past matches with wrong status`
        );

        let statusUpdated = 0;
        for (const match of pastMatchesWithWrongStatus) {
          const { error: updateError } = await supabase
            .from("matches")
            .update({
              status: "Finished",
              updated_at: new Date().toISOString(),
            })
            .eq("id", match.id);

          if (!updateError) {
            statusUpdated++;
          }
        }

        console.log(`✅ Updated status for ${statusUpdated} matches`);
      }
    }
  } catch (error) {
    console.error("Error in fixMatchYearsBatch:", error);
  }
}

// Run the fix
fixMatchYearsBatch();