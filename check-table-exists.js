const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://xnetjsifkhtbbpadwlxy.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZXRqc2lma2h0YmJwYWR3bHh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwODIyMSwiZXhwIjoyMDc1NDg0MjIxfQ.rUBp6Kx6FToMyRAtfnrR2sb6PZ1j1hlsMslp6utNGfM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log(
    "🔍 Checking if employee_to_hospital_role_assignment table exists...\n"
  );

  try {
    // Try to query the table in master_data schema
    const { data, error } = await supabase
      .schema("master_data")
      .from("employee_to_hospital_role_assignment")
      .select("*")
      .limit(1);

    if (error) {
      if (
        error.message.includes("does not exist") ||
        error.message.includes("relation") ||
        error.code === "42P01"
      ) {
        console.log("❌ Table does NOT exist yet");
        console.log("   Error:", error.message);
        console.log(
          "\n📝 You need to run the SQL migrations in Supabase Studio"
        );
        return false;
      } else if (
        error.message.includes("permission denied") ||
        error.message.includes("RLS")
      ) {
        console.log("⚠️  Table EXISTS but RLS policies may be blocking access");
        console.log("   This is expected - the table is there!\n");
        return true;
      } else {
        console.log("⚠️  Unexpected error:", error.message);
        console.log("   Code:", error.code);
        return null;
      }
    }

    console.log("✅ Table EXISTS and is accessible!");
    console.log("   Found", data ? data.length : 0, "records\n");

    // Try to check the helper functions
    console.log("🔍 Checking helper functions...\n");

    const { data: funcData, error: funcError } = await supabase.rpc(
      "get_user_accessible_hospitals",
      {
        p_user_id: "00000000-0000-0000-0000-000000000000",
      }
    );

    if (funcError) {
      if (
        funcError.message.includes("does not exist") ||
        funcError.code === "42883"
      ) {
        console.log("❌ Helper functions do NOT exist yet");
        console.log("   You need to run Migration 2");
      } else {
        console.log("✅ Helper functions appear to exist");
        console.log("   (Got expected error for dummy UUID)");
      }
    } else {
      console.log("✅ Helper functions exist and work!");
    }

    return true;
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    return null;
  }
}

checkTable();
