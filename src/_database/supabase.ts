import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.PROJECT_URL!,
  process.env.SUPABASE_API_KEY!,
);

export const supabaseAdmin = createClient(
  process.env.PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
