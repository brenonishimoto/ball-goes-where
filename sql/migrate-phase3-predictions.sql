-- Migration: add phase3 predictions and score columns

ALTER TABLE public.user_predictions
ADD COLUMN IF NOT EXISTS phase3_predictions jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.user_predictions
SET phase3_predictions = '{}'::jsonb
WHERE phase3_predictions IS NULL;

ALTER TABLE public.user_scores
ADD COLUMN IF NOT EXISTS phase3_score integer NOT NULL DEFAULT 0;

UPDATE public.user_scores
SET total_score = COALESCE(phase1_score, 0) + COALESCE(phase2_score, 0) + COALESCE(phase3_score, 0);
