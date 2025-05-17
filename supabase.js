// supabase.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
export async function saveJobTag({ id, has_pms, complexity = null }) {
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
  
    // ✅ Check for empty response before calling .json()
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      console.error('JSON parse error:', err);
    }
  
    if (!response.ok) {
      console.error(`Failed to upsert job ${id}:`, data || response.statusText);
    } else {
      console.log(`✅ Saved job ${id}`);
    }
  }
  