-- Meta estruturada (peso-alvo + prazo) pra dar pra calcular um ritmo
-- kg/semana pedido e comparar com um ritmo saudável — a checagem de
-- realismo da meta (Fase 7 do roteiro trazido da análise do
-- mt-rodrigo.netlify.app). Os dois são opcionais: nem toda anamnese tem uma
-- meta de peso (objetivo pode ser "ganhar força", sem alvo numérico).
alter table public.anamneses
  add column meta_peso_kg numeric,
  add column meta_prazo date;
