-- Migration: Add phase1_predictions column to user_predictions table
-- This file should be executed if user_predictions table already exists without phase1_predictions column

ALTER TABLE public.user_predictions 
ADD COLUMN IF NOT EXISTS phase1_predictions jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Update existing rows to have empty object for phase1_predictions if NULL
UPDATE public.user_predictions 
SET phase1_predictions = '{}'::jsonb 
WHERE phase1_predictions IS NULL;
