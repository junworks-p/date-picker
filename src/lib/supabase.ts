import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Room = {
  id: string;
  name: string;
  created_at: string;
};

export type DateSelection = {
  id: number;
  room_id: string;
  name: string;
  selected_date: string;
  created_at: string;
};
