import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log("Starting migration...");
  console.log("Supabase URL:", supabaseUrl);

  // Test if tables already exist by selecting from them
  const { error: carErr } = await supabase.from("car_data").select("id").limit(1);
  const { error: histErr } = await supabase.from("prediction_history").select("id").limit(1);
  const { error: modelErr } = await supabase.from("model_state").select("id").limit(1);

  if (!carErr && !histErr && !modelErr) {
    console.log("All tables already exist! No migration needed.");
    return;
  }

  console.log("Some tables are missing. Creating via SQL...");
  console.log("car_data:", carErr ? "MISSING" : "EXISTS");
  console.log("prediction_history:", histErr ? "MISSING" : "EXISTS");
  console.log("model_state:", modelErr ? "MISSING" : "EXISTS");

  // Use the SQL query approach via the REST API
  const sqlStatements = `
    CREATE TABLE IF NOT EXISTS public.car_data (
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
    );

    CREATE TABLE IF NOT EXISTS public.prediction_history (
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
    );

    CREATE TABLE IF NOT EXISTS public.model_state (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      version TEXT NOT NULL,
      weights JSONB NOT NULL,
      scaling_params JSONB NOT NULL,
      train_metrics JSONB NOT NULL,
      test_metrics JSONB NOT NULL,
      feature_importance JSONB NOT NULL,
      statistics JSONB NOT NULL,
      trained_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.car_data ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.prediction_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.model_state ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'car_data' AND policyname = 'car_data_public_read') THEN
        CREATE POLICY car_data_public_read ON public.car_data FOR SELECT USING (true);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'car_data' AND policyname = 'car_data_public_insert') THEN
        CREATE POLICY car_data_public_insert ON public.car_data FOR INSERT WITH CHECK (true);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prediction_history' AND policyname = 'prediction_history_public_read') THEN
        CREATE POLICY prediction_history_public_read ON public.prediction_history FOR SELECT USING (true);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prediction_history' AND policyname = 'prediction_history_public_insert') THEN
        CREATE POLICY prediction_history_public_insert ON public.prediction_history FOR INSERT WITH CHECK (true);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'model_state' AND policyname = 'model_state_public_read') THEN
        CREATE POLICY model_state_public_read ON public.model_state FOR SELECT USING (true);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'model_state' AND policyname = 'model_state_public_insert') THEN
        CREATE POLICY model_state_public_insert ON public.model_state FOR INSERT WITH CHECK (true);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'model_state' AND policyname = 'model_state_public_update') THEN
        CREATE POLICY model_state_public_update ON public.model_state FOR UPDATE USING (true);
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS idx_car_data_year ON public.car_data(year);
    CREATE INDEX IF NOT EXISTS idx_car_data_fuel ON public.car_data(fuel_type);
    CREATE INDEX IF NOT EXISTS idx_prediction_history_created ON public.prediction_history(created_at DESC);
  `;

  // Execute via Supabase REST SQL endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
  });

  console.log("Trying direct SQL via pg...");
  
  // Use the postgres connection via pg package
  const { default: pg } = await import('pg');
  
  // Get the direct connection URL
  const pgUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!pgUrl) {
    console.log("No POSTGRES_URL found. Please run this SQL manually in the Supabase SQL editor:");
    console.log(sqlStatements);
    return;
  }

  const client = new pg.Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log("Connected to PostgreSQL!");
    
    await client.query(sqlStatements);
    console.log("All tables created successfully!");
    
    // Verify
    const result = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('car_data', 'prediction_history', 'model_state')");
    console.log("Created tables:", result.rows.map(r => r.tablename));
  } catch (err) {
    console.error("Error running migration:", err.message);
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
