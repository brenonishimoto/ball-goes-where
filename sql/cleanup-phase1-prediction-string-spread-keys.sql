-- Cleanup: remove numeric keys created when a JSON string was spread as an object.

UPDATE public.user_predictions
SET phase1_predictions = phase1_predictions - '0' - '1',
    updated_at = now()
WHERE phase1_predictions ? '0'
   OR phase1_predictions ? '1';
