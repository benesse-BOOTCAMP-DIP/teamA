-- Enable Row Level Security (RLS) on words table
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own words (or public words if user_id is null)
CREATE POLICY "Users can view own words"
    ON public.words
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can insert their own words
CREATE POLICY "Users can insert own words"
    ON public.words
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own words
CREATE POLICY "Users can update own words"
    ON public.words
    FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can delete their own words
CREATE POLICY "Users can delete own words"
    ON public.words
    FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);
