import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const statements = [
  // Create car_data table
  `CREATE TABLE IF NOT EXISTS public.car_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_name TEXT NOT NULL,
    year INTEGER NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL,
    present_price NUMERIC(10, 2) NOT NULL,
    driven_kms INTEGER NOT NULL,
    fuel_type TEXT NOT NULL,
    selling_type TEXT NOT NULL,
    transmission TEXT NOT NULL,
    owner INTEGER NOT NULL DEFAULT 0,
    is_original BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  // Create prediction_history table
  `CREATE TABLE IF NOT EXISTS public.prediction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    present_price NUMERIC(10, 2) NOT NULL,
    driven_kms INTEGER NOT NULL,
    fuel_type TEXT NOT NULL,
    selling_type TEXT NOT NULL,
    transmission TEXT NOT NULL,
    owner INTEGER NOT NULL DEFAULT 0,
    predicted_price NUMERIC(10, 2) NOT NULL,
    model_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  // Create model_state table
  `CREATE TABLE IF NOT EXISTS public.model_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    weights JSONB NOT NULL,
    scaling_params JSONB NOT NULL,
    train_metrics JSONB NOT NULL,
    test_metrics JSONB NOT NULL,
    feature_importance JSONB NOT NULL,
    statistics JSONB NOT NULL,
    trained_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
];

async function runMigration() {
  console.log("Starting migration...");
  console.log("Supabase URL:", supabaseUrl);

  for (let i = 0; i < statements.length; i++) {
    console.log(`Running statement ${i + 1}/${statements.length}...`);
    const { error } = await supabase.rpc("exec_sql", { sql: statements[i] });
    if (error) {
      console.log(`Statement ${i + 1} via RPC failed:`, error.message);
      console.log("Trying direct approach...");
    } else {
      console.log(`Statement ${i + 1} completed successfully.`);
    }
  }

  // Test by trying to select from car_data
  const { data, error } = await supabase.from("car_data").select("id").limit(1);
  if (error) {
    console.log("Table car_data test result:", error.message);
    console.log("Tables may need to be created via Supabase dashboard SQL editor.");
    console.log("Copy the SQL from /scripts/001_create_tables.sql and run it in the SQL editor.");
  } else {
    console.log("Table car_data exists! Migration successful.");
    console.log("Data:", data);
  }

  // Also test prediction_history
  const { error: err2 } = await supabase.from("prediction_history").select("id").limit(1);
  if (err2) {
    console.log("Table prediction_history test:", err2.message);
  } else {
    console.log("Table prediction_history exists!");
  }

  // Also test model_state
  const { error: err3 } = await supabase.from("model_state").select("id").limit(1);
  if (err3) {
    console.log("Table model_state test:", err3.message);
  } else {
    console.log("Table model_state exists!");
  }
}

runMigration().catch(console.error);
