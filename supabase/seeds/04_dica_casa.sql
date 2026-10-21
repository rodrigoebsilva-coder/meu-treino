-- Curadoria inicial de dica_casa: só os ~30 exercícios do PPL inicial
-- semeado (mesmo motivo do youtube_url/nome em inglês — curar os 876 da
-- base inteira é trabalho manual incremental, não bloqueia a fase).
update public.exercicios set dica_casa = v.dica
from (values
  ('Barbell Bench Press - Medium Grip', 'Flexão de braço com os pés elevados numa cadeira, controlando a descida'),
  ('Dumbbell Shoulder Press', 'Flexão pike (corpo em V invertido) ou desenvolvimento com galão de água'),
  ('Incline Dumbbell Flyes', 'Flexão com as mãos afastadas, descida lenta e controlada'),
  ('Triceps Pushdown', 'Mergulho (dips) entre duas cadeiras firmes'),
  ('Dips - Triceps Version', 'Mergulho entre duas cadeiras ou num sofá firme'),
  ('Bent Over Barbell Row', 'Remada unilateral com mochila cheia de livros/garrafas'),
  ('Wide-Grip Lat Pulldown', 'Remada com elástico preso numa porta, ou toalha numa barra'),
  ('Pullups', 'Remada invertida numa mesa firme ou barra de box'),
  ('Barbell Curl', 'Rosca com galões de água ou mochila'),
  ('Face Pull', 'Elástico preso numa porta, puxando em direção ao rosto'),
  ('Barbell Squat', 'Agachamento com mochila cheia nas costas, ou agachamento búlgaro com cadeira'),
  ('Romanian Deadlift', 'Stiff unilateral com galão de água numa mão'),
  ('Leg Press', 'Agachamento búlgaro (pé de trás numa cadeira) com mochila'),
  ('Seated Leg Curl', 'Elevação de quadril (hip thrust) com os pés numa cadeira'),
  ('Standing Barbell Calf Raise', 'Elevação de panturrilha na borda de um degrau, segurando apoio'),
  ('Dumbbell Bench Press', 'Flexão de braço tradicional ou com os pés elevados'),
  ('Barbell Shoulder Press', 'Flexão pike ou desenvolvimento com galões de água'),
  ('Incline Cable Flye', 'Flexão com pés elevados numa cadeira, mãos afastadas'),
  ('Close-Grip Barbell Bench Press', 'Flexão de braço com as mãos próximas, cotovelos colados ao corpo'),
  ('Reverse Grip Triceps Pushdown', 'Mergulho (dips) com pegada supinada entre cadeiras'),
  ('Barbell Deadlift', 'Levantamento terra com mochila cheia ou dois galões de água'),
  ('Seated Cable Rows', 'Remada com elástico preso numa porta, sentado no chão'),
  ('Close-Grip Front Lat Pulldown', 'Remada invertida numa mesa, pegada fechada'),
  ('Alternate Hammer Curl', 'Rosca martelo com galões de água'),
  ('Reverse Flyes', 'Elevação posterior curvado, com galões de água leves'),
  ('Front Barbell Squat', 'Agachamento goblet com um galão de água no peito'),
  ('Narrow Stance Leg Press', 'Agachamento com pés juntos, usando mochila'),
  ('Lying Leg Curls', 'Elevação de quadril unilateral com os pés numa cadeira'),
  ('Leg Extensions', 'Agachamento isométrico na parede (wall sit)'),
  ('Seated Calf Raise', 'Elevação de panturrilha sentado, com peso no colo')
) as v(nome, dica)
where exercicios.nome = v.nome and exercicios.origem = 'base';
