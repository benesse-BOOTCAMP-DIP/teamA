-- Create words table
CREATE TABLE IF NOT EXISTS public.words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    meaning TEXT NOT NULL,
    example TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching and user filtering
CREATE INDEX IF NOT EXISTS idx_words_user_id ON public.words(user_id);
CREATE INDEX IF NOT EXISTS idx_words_created_at ON public.words(created_at DESC);

-- Trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_words_updated_at
    BEFORE UPDATE ON public.words
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
