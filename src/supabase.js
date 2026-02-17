import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lzoicmhhwngdzyymuoyf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6b2ljbWhod25nZHp5eW11b3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyODgyOTcsImV4cCI6MjA4Njg2NDI5N30._GY4g1T8YKfq24_jQu6Wcce-_XGVe6e1FXNcvI89CgQ'

export const supabase = createClient(supabaseUrl, supabaseKey)