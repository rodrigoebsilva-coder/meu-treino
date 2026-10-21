-- Bootstrap do admin em dev local: o usuário dev só existe depois que
-- 02_usuario_dev.sql roda (migrations rodam antes dos seeds em `db reset`),
-- então o bootstrap de admin da migration 0014 não encontra ninguém pra
-- promover localmente (mesma pegadinha da migration 0007/seed 04_dica_casa).
-- Em produção isso não é necessário — lá o usuário já existe antes do
-- `db push` rodar as migrations, então o bootstrap da própria migration
-- 0014 já resolve.
update public.perfis set cargo = 'admin' where email = 'rodrigoebsilva@gmail.com';
