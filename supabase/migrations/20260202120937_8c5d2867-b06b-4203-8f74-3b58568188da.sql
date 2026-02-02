-- Tabela vehicles (cadastro de veículos)
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL UNIQUE,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'Disponível',
  current_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela vehicle_trips (registro de viagens)
CREATE TABLE public.vehicle_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  status text NOT NULL DEFAULT 'Em andamento',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela vehicle_trip_points (pontos GPS da rota)
CREATE TABLE public.vehicle_trip_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.vehicle_trips(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  is_stop boolean NOT NULL DEFAULT false,
  stop_duration_seconds integer DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_trip_points ENABLE ROW LEVEL SECURITY;

-- Políticas para vehicles
CREATE POLICY "Public read vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Public insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update vehicles" ON public.vehicles FOR UPDATE USING (true);
CREATE POLICY "Public delete vehicles" ON public.vehicles FOR DELETE USING (true);

-- Políticas para vehicle_trips
CREATE POLICY "Public read vehicle_trips" ON public.vehicle_trips FOR SELECT USING (true);
CREATE POLICY "Public insert vehicle_trips" ON public.vehicle_trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update vehicle_trips" ON public.vehicle_trips FOR UPDATE USING (true);
CREATE POLICY "Public delete vehicle_trips" ON public.vehicle_trips FOR DELETE USING (true);

-- Políticas para vehicle_trip_points
CREATE POLICY "Public read vehicle_trip_points" ON public.vehicle_trip_points FOR SELECT USING (true);
CREATE POLICY "Public insert vehicle_trip_points" ON public.vehicle_trip_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update vehicle_trip_points" ON public.vehicle_trip_points FOR UPDATE USING (true);
CREATE POLICY "Public delete vehicle_trip_points" ON public.vehicle_trip_points FOR DELETE USING (true);

-- Trigger para updated_at em vehicles
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();