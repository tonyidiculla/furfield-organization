#!/usr/bin/env node

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString =
  "postgresql://postgres:oJkYRZFZL08BCpAr@db.xnetjsifkhtbbpadwlxy.supabase.co:5432/postgres?sslmode=require";

async function applyMigrations() {
  const client = new Client({ connectionString });

  try {
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected!\n");

    // Migration 1: Create table
    console.log(
      "📋 Step 1/2: Creating employee_to_hospital_role_assignment table..."
    );
    const migration1Path = path.join(
      __dirname,
      "supabase/migrations/20251014_create_employee_to_hospital_role_assignment.sql"
    );
    const migration1Sql = fs.readFileSync(migration1Path, "utf8");

    await client.query(migration1Sql);
    console.log("✅ Table created successfully!\n");

    // Migration 2: Create helper functions
    console.log("📋 Step 2/2: Creating helper functions...");
    const migration2Path = path.join(
      __dirname,
      "supabase/migrations/20251014_create_hospital_assignment_functions.sql"
    );
    const migration2Sql = fs.readFileSync(migration2Path, "utf8");

    await client.query(migration2Sql);
    console.log("✅ Helper functions created successfully!\n");

    console.log("🎉 All migrations applied successfully!\n");
    console.log("📊 Created:");
    console.log("  ✓ master_data.employee_to_hospital_role_assignment table");
    console.log("  ✓ master_data.get_user_hospital_assignments() function");
    console.log("  ✓ master_data.user_has_hospital_access() function");
    console.log("  ✓ master_data.get_user_accessible_hospitals() function");
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error.message);

    if (error.message.includes("already exists")) {
      console.log(
        "\n⚠️  Some objects already exist - this is OK if you ran this before."
      );
    } else {
      console.log(
        "\n📝 You can apply these migrations manually via Supabase Studio:"
      );
      console.log(
        "   https://supabase.com/dashboard/project/xnetjsifkhtbbpadwlxy/sql"
      );
    }
  } finally {
    await client.end();
    console.log("\n👋 Disconnected from database");
  }
}

applyMigrations();
