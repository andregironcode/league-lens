import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://septerrkdnojsmtmmska.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0MDY4MCwiZXhwIjoyMDYzOTE2NjgwfQ.0jHWphqfH1vYUpZoXCBLI_IFpoupFUlQo5jb9XqWaKw";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyDates() {
  console.log("🔍 Verifying match dates...\n");

  try {
    // Count matches with 2025 dates
    const { data: matches2025, error: error2025 } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .gte("match_date", "2025-01-01")
      .lte("match_date", "2025-12-31");

    console.log(`Matches with 2025 dates: ${matches2025?.length || 0}`);

    // Count matches with 2024 dates
    const { data: matches2024, count: count2024 } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .gte("match_date", "2024-01-01")
      .lte("match_date", "2024-12-31");

    console.log(`Matches with 2024 dates: ${count2024 || 0}`);

    // Get some sample matches from recent dates
    const { data: recentMatches } = await supabase
      .from("matches")
      .select("id, match_date, home_team_name, away_team_name, status")
      .gte("match_date", "2024-01-01")
      .order("match_date", { ascending: false })
      .limit(10);

    console.log("\nSample of recent matches:");
    recentMatches?.forEach(match => {
      console.log(`- ${match.match_date}: ${match.home_team_name} vs ${match.away_team_name} (${match.status})`);
    });

    // Check for any past matches still showing as "Not Started"
    const today = new Date().toISOString().split("T")[0];
    const { data: wrongStatus, count: wrongStatusCount } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .lt("match_date", today)
      .or("status.eq.Not Started,status.eq.Scheduled,status.eq.NS");

    console.log(`\nPast matches with wrong status: ${wrongStatusCount || 0}`);

  } catch (error) {
    console.error("Error verifying dates:", error);
  }
}

verifyDates();