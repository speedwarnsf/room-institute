-- Add display_order column for manual design sorting
ALTER TABLE public.listing_designs ADD COLUMN IF NOT EXISTS display_order integer;

-- Add spread_data column for cached Go Deeper magazine spreads
ALTER TABLE public.listing_designs ADD COLUMN IF NOT EXISTS spread_data jsonb;

-- Set Monochrome Depths first in Living Room
UPDATE public.listing_designs SET display_order = 1 WHERE id = '071cb86d-5a7d-4ec8-a05d-a67cc2ab213e';
UPDATE public.listing_designs SET display_order = 2 WHERE id = 'dc7ec589-12a2-4910-85a7-df6ce321124f';
UPDATE public.listing_designs SET display_order = 3 WHERE id = 'ef89c4aa-e7f0-41f8-bd8b-f2450f6320e6';
