// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://asfaxqetvdezexbahyni.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmF4cWV0dmRlemV4YmFoeW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNDU3OTYsImV4cCI6MjA0OTYyMTc5Nn0.Nyv0n8X8jYmRkafoRxQ5CMGTw5Pvo_X_Phr6llLyLUQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);