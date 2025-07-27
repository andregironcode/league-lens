import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://septerrkdnojsmtmmska.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // You need service key for updates

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ SUPABASE_SERVICE_KEY environment variable is required");
  console.log(
    "Set it with: export SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0MDY4MCwiZXhwIjoyMDYzOTE2NjgwfQ.0jHWphqfH1vYUpZoXCBLI_IFpoupFUlQo5jb9XqWaKw"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixMatchYears() {
  console.log("🔧 Fixing match years from 2025 to 2024...");

  try {
    // First, let's see how many matches we need to fix
    const { data: matchesToFix, error: countError } = await supabase
      .from("matches")
      .select("id, match_date, status")
      .gte("match_date", "2025-01-01")
      .lte("match_date", "2025-12-31");

    if (countError) {
      console.error("Error counting matches to fix:", countError);
      return;
    }

    console.log(`Found ${matchesToFix?.length || 0} matches with 2025 dates`);

    if (!matchesToFix || matchesToFix.length === 0) {
      console.log("No matches to fix!");
      return;
    }

    // Show sample of matches to be fixed
    console.log("\nSample of matches to be fixed:");
    matchesToFix.slice(0, 5).forEach((match) => {
      console.log(
        `- Match ${match.id}: ${match.match_date} (Status: ${match.status})`
      );
    });

    // Ask for confirmation
    console.log(
      `\n⚠️  This will update ${matchesToFix.length} matches from 2025 to 2024`
    );
    console.log("Starting update in 3 seconds...");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Update matches in smaller batches to avoid timeouts
    const batchSize = 50; // Reduced batch size
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < matchesToFix.length; i += batchSize) {
      const batch = matchesToFix.slice(i, i + batchSize);
      const batchPromises = [];

      // Create update promises for parallel processing
      for (const match of batch) {
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

        batchPromises.push(updatePromise);
      }

      // Wait for batch to complete
      await Promise.all(batchPromises);

      console.log(
        `Progress: ${updated}/${matchesToFix.length} matches updated (${errors} errors) - ${Math.round((updated / matchesToFix.length) * 100)}%`
      );
      
      // Add small delay between batches
      if (i + batchSize < matchesToFix.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(
      `\n✅ Successfully updated ${updated} matches from 2025 to 2024 (${errors} errors)`
    );

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
  } catch (error) {
    console.error("Error in fixMatchYears:", error);
  }
}

// Run the fix
fixMatchYears();
