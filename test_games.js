import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: games, error } = await supabase.from('games').select('*');
  console.log('games:', games);
  if (error) console.error(error);
}
run();
