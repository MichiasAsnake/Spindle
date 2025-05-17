// supabase.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export async function saveJobTag({ id, has_pms, complexity }) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/jobs`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify([
      {
        id,
        has_pms,
        complexity,
        updated_at: new Date().toISOString()
      }
    ])
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Failed to upsert job:', data);
  } else {
    console.log(`Saved job ${id}`);
  }
}
