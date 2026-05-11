-- Migration: rename user_predictions.games to phase2_predictions
-- Run this against existing databases that already have the games column.

ALTER TABLE public.user_predictions
RENAME COLUMN games TO phase2_predictions;
