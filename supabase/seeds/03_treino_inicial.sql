-- Perfil (anamnese v1) + treino PPL inicial (6 dias) para o usuário de
-- desenvolvimento local criado em 02_usuario_dev.sql. Valores vêm da seção 6
-- do prompt original (perfil inicial do Rodrigo).

insert into public.anamneses (
  user_id, versao, idade, altura_cm, peso_inicial_kg, nivel, lesoes,
  objetivo, dias_disponiveis, local_treino, observacoes
) values (
  '11111111-1111-1111-1111-111111111111', 1, 39, 180, 110, 'intermediario', null,
  'Perda de gordura + hipertrofia', 6, 'academia',
  'Estrutura atual: Push/Pull/Legs x2 (6 dias), com cardio pela manhã (caminhada inclinada). Opção de adaptar para casa.'
);

do $$
declare
  v_user_id uuid := '11111111-1111-1111-1111-111111111111';
  v_treino_id uuid;
  v_dia_id uuid;
begin
  insert into public.treinos (user_id, nome_ciclo, status, origem)
  values (v_user_id, 'PPL inicial', 'ativo', 'manual')
  returning id into v_treino_id;

  -- Push A
  insert into public.treino_dias (user_id, treino_id, ordem, nome, grupos_musculares)
  values (v_user_id, v_treino_id, 1, 'Push A', array['peitoral', 'ombros', 'triceps'])
  returning id into v_dia_id;

  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 1, 4, 6, 8, 120
  from public.exercicios where origem = 'base' and nome = 'Barbell Bench Press - Medium Grip' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 2, 3, 8, 10, 90
  from public.exercicios where origem = 'base' and nome = 'Dumbbell Shoulder Press' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 3, 3, 10, 12, 60
  from public.exercicios where origem = 'base' and nome = 'Incline Dumbbell Flyes' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 4, 3, 10, 12, 60
  from public.exercicios where origem = 'base' and nome = 'Triceps Pushdown' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 5, 3, 8, 12, 60
  from public.exercicios where origem = 'base' and nome = 'Dips - Triceps Version' limit 1;

  -- Pull A
  insert into public.treino_dias (user_id, treino_id, ordem, nome, grupos_musculares)
  values (v_user_id, v_treino_id, 2, 'Pull A', array['dorsais', 'meio_das_costas', 'biceps'])
  returning id into v_dia_id;

  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 1, 4, 6, 8, 120
  from public.exercicios where origem = 'base' and nome = 'Bent Over Barbell Row' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 2, 3, 10, 12, 90
  from public.exercicios where origem = 'base' and nome = 'Wide-Grip Lat Pulldown' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 3, 3, 6, 10, 90
  from public.exercicios where origem = 'base' and nome = 'Pullups' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 4, 3, 10, 12, 60
  from public.exercicios where origem = 'base' and nome = 'Barbell Curl' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 5, 3, 12, 15, 45
  from public.exercicios where origem = 'base' and nome = 'Face Pull' limit 1;

  -- Legs A
  insert into public.treino_dias (user_id, treino_id, ordem, nome, grupos_musculares)
  values (v_user_id, v_treino_id, 3, 'Legs A', array['quadriceps', 'posterior_de_coxa', 'panturrilha'])
  returning id into v_dia_id;

  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 1, 4, 6, 8, 150
  from public.exercicios where origem = 'base' and nome = 'Barbell Squat' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 2, 3, 8, 10, 120
  from public.exercicios where origem = 'base' and nome = 'Romanian Deadlift' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 3, 3, 10, 12, 90
  from public.exercicios where origem = 'base' and nome = 'Leg Press' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 4, 3, 10, 12, 60
  from public.exercicios where origem = 'base' and nome = 'Seated Leg Curl' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 5, 4, 12, 15, 45
  from public.exercicios where origem = 'base' and nome = 'Standing Barbell Calf Raise' limit 1;

  -- Push B
  insert into public.treino_dias (user_id, treino_id, ordem, nome, grupos_musculares)
  values (v_user_id, v_treino_id, 4, 'Push B', array['peitoral', 'ombros', 'triceps'])
  returning id into v_dia_id;

  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 1, 4, 8, 10, 120
  from public.exercicios where origem = 'base' and nome = 'Dumbbell Bench Press' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 2, 3, 8, 10, 90
  from public.exercicios where origem = 'base' and nome = 'Barbell Shoulder Press' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 3, 3, 12, 15, 60
  from public.exercicios where origem = 'base' and nome = 'Incline Cable Flye' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 4, 3, 8, 10, 90
  from public.exercicios where origem = 'base' and nome = 'Close-Grip Barbell Bench Press' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 5, 3, 10, 12, 60
  from public.exercicios where origem = 'base' and nome = 'Reverse Grip Triceps Pushdown' limit 1;

  -- Pull B
  insert into public.treino_dias (user_id, treino_id, ordem, nome, grupos_musculares)
  values (v_user_id, v_treino_id, 5, 'Pull B', array['dorsais', 'meio_das_costas', 'biceps'])
  returning id into v_dia_id;

  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 1, 4, 5, 6, 180
  from public.exercicios where origem = 'base' and nome = 'Barbell Deadlift' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 2, 3, 10, 12, 90
  from public.exercicios where origem = 'base' and nome = 'Seated Cable Rows' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 3, 3, 10, 12, 90
  from public.exercicios where origem = 'base' and nome = 'Close-Grip Front Lat Pulldown' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 4, 3, 10, 12, 60
  from public.exercicios where origem = 'base' and nome = 'Alternate Hammer Curl' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 5, 3, 12, 15, 45
  from public.exercicios where origem = 'base' and nome = 'Reverse Flyes' limit 1;

  -- Legs B
  insert into public.treino_dias (user_id, treino_id, ordem, nome, grupos_musculares)
  values (v_user_id, v_treino_id, 6, 'Legs B', array['quadriceps', 'posterior_de_coxa', 'panturrilha'])
  returning id into v_dia_id;

  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 1, 4, 8, 10, 120
  from public.exercicios where origem = 'base' and nome = 'Front Barbell Squat' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 2, 3, 10, 12, 90
  from public.exercicios where origem = 'base' and nome = 'Narrow Stance Leg Press' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 3, 3, 10, 12, 60
  from public.exercicios where origem = 'base' and nome = 'Lying Leg Curls' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 4, 3, 12, 15, 60
  from public.exercicios where origem = 'base' and nome = 'Leg Extensions' limit 1;
  insert into public.treino_exercicios (user_id, treino_dia_id, exercicio_id, ordem, series, repeticoes_min, repeticoes_max, descanso_segundos)
  select v_user_id, v_dia_id, id, 5, 4, 12, 15, 45
  from public.exercicios where origem = 'base' and nome = 'Seated Calf Raise' limit 1;

end $$;
