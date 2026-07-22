-- AI Assistant: prefer GPT-5.5 as the school default model
ALTER TABLE schools
  ALTER COLUMN ai_tutor_model SET DEFAULT 'gpt-5.5';

UPDATE schools
SET ai_tutor_model = 'gpt-5.5'
WHERE ai_tutor_model IS NULL
   OR ai_tutor_model IN ('gpt-4o', 'gpt-4o-mini');
