import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvkkobilskibthlbwaew.supabase.co'
const supabaseKey = 'sb_publishable_TXQUDDGk-LG2Gtc2z2zmfw_vvkzOoKc'

export const supabase = createClient(supabaseUrl, supabaseKey)