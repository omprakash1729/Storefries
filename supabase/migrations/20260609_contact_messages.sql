-- Create contact_messages table to store contact submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/anonymous users) to insert messages into the table
CREATE POLICY "Allow public inserts" ON public.contact_messages
    FOR INSERT 
    WITH CHECK (true);
