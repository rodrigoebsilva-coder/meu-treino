-- Marca os exercícios base de cardio (espelho do UPDATE da migration 0019, que não acha linhas no db reset local).
update public.exercicios
   set tipo = 'cardio'
 where origem = 'base' and nome in (
  'Bicycling',
  'Bicycling, Stationary',
  'Elliptical Trainer',
  'Jogging, Treadmill',
  'Rowing, Stationary',
  'Running, Treadmill',
  'Stairmaster',
  'Step Mill',
  'Trail Running/Walking',
  'Walking, Treadmill',
  'Rope Jumping',
  'Skating',
  'Fast Skipping',
  'Mountain Climbers',
  'Battling Ropes'
);
