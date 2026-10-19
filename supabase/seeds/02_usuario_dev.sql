-- Usuário de desenvolvimento local. Só existe na stack local do Supabase
-- (nunca é aplicado em cloud/produção — seeds não são enviados por
-- `supabase db push`). Permite logar e testar a Fase 2 (login) antes mesmo
-- de a tela de cadastro existir, e dá um user_id real para o resto do seed
-- (anamnese + treino PPL inicial) referenciar.
--
-- Login local: rodrigoebsilva@gmail.com / treino123

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'rodrigoebsilva@gmail.com',
  extensions.crypt('treino123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '', '', '', ''
);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"rodrigoebsilva@gmail.com"}',
  'email',
  now(),
  now(),
  now()
);
