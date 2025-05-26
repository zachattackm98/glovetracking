// Minimal upload script for Supabase Storage (public bucket)
// Usage: node test_upload.js <path-to-file>

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bnuvleioydsvyouhveak.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudXZsZWlveWRzdnlvdWh2ZWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjUxMzksImV4cCI6MjA2Mzc0MTEzOX0.AOqxBnxD8jE4bfxi2NNZzfsN-iN5j7jMsvMO0wlOXIs';
const BUCKET = 'certificationdocuments'; // Change if your bucket name is different

if (process.argv.length < 3) {
  console.error('Usage: node test_upload.js <path-to-file>');
  process.exit(1);
}

const filePath = process.argv[2];
const fileName = filePath.split('/').pop();
const fileBuffer = fs.readFileSync(filePath);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function upload() {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, fileBuffer, { upsert: true });
  if (error) {
    console.error('Upload error:', error);
  } else {
    console.log('Upload success:', data);
  }
}

upload(); 