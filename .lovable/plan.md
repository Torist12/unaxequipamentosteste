
# Plano: Sistema Completo de Veiculos com Rastreamento GPS

## Visao Geral

Implementar um modulo completo de gerenciamento de veiculos integrado ao sistema existente, incluindo:
- Cadastro simples (placa e modelo)
- Rastreamento GPS em tempo real com Leaflet/OpenStreetMap
- Deteccao automatica de paradas
- Historico de viagens com visualizacao de rotas
- Exportacao PDF e Excel

---

## Fase 1: Banco de Dados

### Tabelas a Criar

**vehicles** - Cadastro de veiculos
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK, gen_random_uuid() |
| plate | text | Placa do veiculo (UNIQUE) |
| model | text | Modelo do veiculo |
| status | text | Disponivel, Em uso, Manutencao |
| current_user_id | uuid | FK para users (nullable) |
| created_at | timestamp | Data de cadastro |
| updated_at | timestamp | Ultima atualizacao |

**vehicle_trips** - Registro de viagens
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| vehicle_id | uuid | FK para vehicles |
| user_id | uuid | FK para users |
| start_time | timestamp | Inicio da viagem |
| end_time | timestamp | Fim da viagem (null se em andamento) |
| status | text | Em andamento, Finalizada |
| created_at | timestamp | Data de criacao |

**vehicle_trip_points** - Pontos GPS da rota
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| trip_id | uuid | FK para vehicle_trips |
| latitude | numeric | Coordenada |
| longitude | numeric | Coordenada |
| is_stop | boolean | Indica parada |
| stop_duration_seconds | integer | Duracao da parada |
| recorded_at | timestamp | Momento do registro |

### Politicas RLS
- Mesmas politicas das outras tabelas (public access)
- DELETE, INSERT, SELECT, UPDATE habilitados

---

## Fase 2: Dependencias

Instalar pacotes para mapas:
- `leaflet` - Biblioteca de mapas
- `react-leaflet` - Componentes React para Leaflet

---

## Fase 3: Arquivos a Criar

### Tipos (src/types/database.ts)
Adicionar interfaces:
- Vehicle
- VehicleTrip
- VehicleTripPoint

### Hooks

**src/hooks/useVehicles.ts**
- `useVehicles()` - Lista todos os veiculos
- `useCreateVehicle()` - Cria veiculo com validacao de placa unica
- `useUpdateVehicle()` - Atualiza veiculo
- `useDeleteVehicle()` - Exclui veiculo (validando se nao esta em uso)

**src/hooks/useVehicleTrips.ts**
- `useVehicleTrips()` - Lista viagens com pontos
- `useTripsByVehicle(vehicleId)` - Viagens de um veiculo
- `useStartTrip()` - Inicia viagem (muda status do veiculo)
- `useEndTrip()` - Finaliza viagem
- `useAddTripPoint()` - Adiciona ponto GPS

**src/hooks/useGeolocation.ts**
- `useGeolocation()` - Captura posicao do dispositivo
- `useWatchPosition()` - Monitora posicao continuamente

### Componentes

**src/components/vehicles/VehicleForm.tsx**
- Formulario de cadastro (placa, modelo)
- Validacao com Zod
- Mesma estrutura do EquipmentPage

**src/components/vehicles/VehicleList.tsx**
- Tabela de veiculos
- Edicao inline
- Botoes de excluir
- StatusBadge para status

**src/components/vehicles/TripTracker.tsx**
- Selecao de veiculo disponivel
- Botao Iniciar/Finalizar Viagem
- Indicador de GPS ativo
- Timer de duracao

**src/components/vehicles/TripMap.tsx**
- Mapa Leaflet com OpenStreetMap
- Polyline da rota
- Marcadores de paradas
- Popup com info de parada

**src/components/vehicles/TripHistory.tsx**
- Lista de viagens passadas
- Filtros por veiculo/data
- Click para ver rota no mapa

### Pagina Principal

**src/pages/VehiclesPage.tsx**
- Estrutura com Tabs (Cadastro, Uso, Historico)
- Mesma estrutura do EquipmentPage
- Exportacao PDF/Excel

### Navegacao

**src/components/layout/Sidebar.tsx**
- Adicionar item "Veiculos" com icone Car

**src/App.tsx**
- Adicionar rota /vehicles

### Validacao

**src/lib/validation.ts**
- Adicionar `vehicleSchema` com validacao de placa

### Relatorios

**src/lib/vehicleReport.ts**
- `generateVehiclePdfReport()` - PDF de veiculos
- `generateVehicleExcelReport()` - Excel de veiculos
- `generateTripPdfReport()` - PDF de viagens
- `generateTripExcelReport()` - Excel de viagens

---

## Fase 4: Logica de Rastreamento GPS

### Fluxo de Inicio de Viagem
1. Usuario seleciona veiculo disponivel
2. Clica em "Iniciar Viagem"
3. Sistema solicita permissao de geolocalizacao
4. Captura posicao inicial
5. Cria registro em `vehicle_trips`
6. Atualiza status do veiculo para "Em uso"
7. Inicia `watchPosition` a cada 30 segundos

### Deteccao de Paradas
- Compara posicao atual com anterior
- Se distancia < 10 metros por > 2 minutos = parada
- Marca ponto com `is_stop = true`
- Acumula `stop_duration_seconds`

### Fluxo de Finalizacao
1. Usuario clica em "Finalizar Viagem"
2. Captura posicao final
3. Salva ultimo ponto
4. Atualiza `end_time` e `status = 'Finalizada'`
5. Atualiza veiculo para "Disponivel"
6. Para `watchPosition`

---

## Fase 5: Estrutura Visual

### Aba Cadastro
- Header com titulo e botao "Novo Veiculo"
- Tabela/Cards com lista de veiculos
- Dialog para formulario

### Aba Uso de Veiculos
- Selecao de veiculo
- Mapa em tempo real
- Botao Iniciar/Finalizar
- Painel de status (tempo, paradas)

### Aba Historico
- Filtros por veiculo e data
- Lista de viagens
- Mapa com rota ao clicar
- Exportacao PDF/Excel

---

## Secao Tecnica

### Migracao SQL
```sql
-- Tabela vehicles
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL UNIQUE,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'Disponível',
  current_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela vehicle_trips
CREATE TABLE public.vehicle_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  status text NOT NULL DEFAULT 'Em andamento',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela vehicle_trip_points
CREATE TABLE public.vehicle_trip_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.vehicle_trips(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  is_stop boolean NOT NULL DEFAULT false,
  stop_duration_seconds integer DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- RLS e politicas
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_trip_points ENABLE ROW LEVEL SECURITY;

-- Politicas para vehicles, vehicle_trips, vehicle_trip_points
-- (SELECT, INSERT, UPDATE, DELETE com true)

-- Trigger para updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Estrutura de Arquivos
```
src/
├── components/
│   └── vehicles/
│       ├── VehicleForm.tsx
│       ├── VehicleList.tsx
│       ├── TripTracker.tsx
│       ├── TripMap.tsx
│       └── TripHistory.tsx
├── hooks/
│   ├── useVehicles.ts
│   ├── useVehicleTrips.ts
│   └── useGeolocation.ts
├── lib/
│   └── vehicleReport.ts
├── pages/
│   └── VehiclesPage.tsx
└── types/
    └── database.ts (atualizar)
```

### CSS para Leaflet
Adicionar ao index.css:
```css
@import 'leaflet/dist/leaflet.css';
```

### Configuracao Leaflet
Corrigir icons padrao do Leaflet (problema conhecido):
```typescript
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
```

---

## Resultado Final

Sistema completo de veiculos com:
- Cadastro simples (placa e modelo)
- Rastreamento GPS em tempo real
- Mapa interativo com OpenStreetMap (gratuito)
- Deteccao automatica de paradas
- Historico completo de viagens
- Visualizacao de rotas no mapa
- Exportacao PDF e Excel
- Interface consistente com o restante do sistema
