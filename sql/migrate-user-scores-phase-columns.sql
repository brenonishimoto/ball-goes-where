-- Migration: add phase1_score and phase2_score to user_scores and remove legacy phase02_score

ALTER TABLE public.user_scores
ADD COLUMN IF NOT EXISTS phase1_score integer NOT NULL DEFAULT 0;

ALTER TABLE public.user_scores
ADD COLUMN IF NOT EXISTS phase2_score integer NOT NULL DEFAULT 0;

UPDATE public.user_scores
SET phase2_score = COALESCE(NULLIF(phase2_score, 0), phase02_score, 0),
    phase1_score = COALESCE(NULLIF(phase1_score, 0), 0);

ALTER TABLE public.user_scores
DROP COLUMN IF EXISTS phase02_score;