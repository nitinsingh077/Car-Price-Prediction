-- Create car_data table to store all vehicle records
CREATE TABLE IF NOT EXISTS public.car_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_name TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1990),
  selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
  present_price NUMERIC(10, 2) NOT NULL CHECK (present_price >= 0),
  driven_kms INTEGER NOT NULL CHECK (driven_kms >= 0),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel', 'CNG')),
  selling_type TEXT NOT NULL CHECK (selling_type IN ('Dealer', 'Individual')),
  transmission TEXT NOT NULL CHECK (transmission IN ('Manual', 'Automatic')),
  owner INTEGER NOT NULL DEFAULT 0 CHECK (owner >= 0),
  is_original BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create prediction_history table
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

-- Create model_state table to cache model weights and params
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

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_car_data_fuel_type ON public.car_data(fuel_type);
CREATE INDEX IF NOT EXISTS idx_car_data_year ON public.car_data(year);
CREATE INDEX IF NOT EXISTS idx_car_data_transmission ON public.car_data(transmission);
CREATE INDEX IF NOT EXISTS idx_car_data_selling_type ON public.car_data(selling_type);
CREATE INDEX IF NOT EXISTS idx_prediction_history_created ON public.prediction_history(created_at DESC);

-- Disable RLS for these tables since this is a public prediction tool (no user auth required)
ALTER TABLE public.car_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_state ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (anon key) since this is a public ML tool
CREATE POLICY "Allow public read on car_data" ON public.car_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert on car_data" ON public.car_data FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on prediction_history" ON public.prediction_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on prediction_history" ON public.prediction_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on prediction_history" ON public.prediction_history FOR DELETE USING (true);

CREATE POLICY "Allow public read on model_state" ON public.model_state FOR SELECT USING (true);
CREATE POLICY "Allow public insert on model_state" ON public.model_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on model_state" ON public.model_state FOR DELETE USING (true);
