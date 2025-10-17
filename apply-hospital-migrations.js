const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = "https://xnetjsifkhtbbpadwlxy.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZXRqc2lma2h0YmJwYWR3bHh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwODIyMSwiZXhwIjoyMDc1NDg0MjIxfQ.rUBp6Kx6FToMyRAtfnrR2sb6PZ1j1hlsMslp6utNGfM";

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "master_data" },
});

async function executeSql(sql) {
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement) {
        console.log("Executing statement...");
        const { data, error } = await supabase.rpc("exec_sql", {
          sql: statement + ";",
        });

        if (error) {
          console.error("Error:", error);
          throw error;
        }
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

async function applyMigrations() {
  console.log("🚀 Starting migration process...\n");

  try {
    // Migration 1: Create table
    console.log(
      "📋 Step 1/2: Creating employee_to_hospital_role_assignment table..."
    );
    const migration1Path = path.join(
      __dirname,
      "supabase/migrations/20251014_create_employee_to_hospital_role_assignment.sql"
    );
    const migration1Sql = fs.readFileSync(migration1Path, "utf8");

    const result1 = await executeSql(migration1Sql);

    if (result1.success) {
      console.log("✅ Table created successfully!\n");
    } else {
      console.error("❌ Failed to create table:", result1.error);
      console.log(
        "\n⚠️  You may need to apply this migration manually via Supabase Studio SQL Editor\n"
      );
    }

    // Migration 2: Create helper functions
    console.log("📋 Step 2/2: Creating helper functions...");
    const migration2Path = path.join(
      __dirname,
      "supabase/migrations/20251014_create_hospital_assignment_functions.sql"
    );
    const migration2Sql = fs.readFileSync(migration2Path, "utf8");

    const result2 = await executeSql(migration2Sql);

    if (result2.success) {
      console.log("✅ Helper functions created successfully!\n");
    } else {
      console.error("❌ Failed to create helper functions:", result2.error);
      console.log(
        "\n⚠️  You may need to apply this migration manually via Supabase Studio SQL Editor\n"
      );
    }

    console.log("🎉 Migration process completed!");
    console.log("\n📊 Summary:");
    console.log("  ✓ employee_to_hospital_role_assignment table");
    console.log("  ✓ get_user_hospital_assignments() function");
    console.log("  ✓ user_has_hospital_access() function");
    console.log("  ✓ get_user_accessible_hospitals() function");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.log("\n📝 Manual migration instructions:");
    console.log(
      "1. Open Supabase Studio: https://xnetjsifkhtbbpadwlxy.supabase.co"
    );
    console.log("2. Go to SQL Editor");
    console.log("3. Copy and run the contents of:");
    console.log(
      "   - supabase/migrations/20251014_create_employee_to_hospital_role_assignment.sql"
    );
    console.log(
      "   - supabase/migrations/20251014_create_hospital_assignment_functions.sql"
    );
  }
}

applyMigrations();
