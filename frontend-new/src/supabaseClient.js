// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://odtjxucpoauruzbnbpxi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdGp4dWNwb2F1cnV6Ym5icHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Mjc2ODgsImV4cCI6MjA3NjEwMzY4OH0.91lVdk5XjeHfqBKEm0DNYxAQlnB90HEgGEz8uhvb6s0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);