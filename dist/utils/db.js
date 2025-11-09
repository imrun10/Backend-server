"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = 'https://fnrybrdpexijtloepdhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucnlicmRwZXhpanRsb2VwZGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTUzMTcsImV4cCI6MjA3Mjc3MTMxN30.P_kqYUIDT6iWUpuYb_1gc4IIx1UxhBCzj5ERc2a0Ef0';
const supabaseKey = SUPABASE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
exports.default = supabase;
