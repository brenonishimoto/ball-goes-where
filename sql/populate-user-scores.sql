-- Popula a tabela public.user_scores para todos os usuários que ainda não possuem entrada
-- Roda no banco (psql, neon, ou ferramenta de sua preferência)

INSERT INTO public.user_scores (user_id, total_score, phase02_score, calculated_at, updated_at)
SELECT u.id, 0, 0, now(), now()
FROM neon_auth."user" u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_scores us WHERE us.user_id = u.id
);

-- Opcional: verificar quantos foram inseridos
-- SELECT count(*) FROM public.user_scores;
