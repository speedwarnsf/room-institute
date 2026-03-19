-- Save all generated portrait options so they persist across page reloads
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS portrait_options jsonb;
