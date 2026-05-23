import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initializes with the secure SERVICE ROLE key (bypasses RLS for backend uploads)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `bounty-proof-${Date.now()}-${file.name}`;

    // Upload to your Supabase 'vault-assets' storage bucket
    const { data, error } = await supabase.storage
      .from('vault-assets') 
      .upload(fileName, buffer, { contentType: file.type });

    if (error) throw error;

    // Get the public URL to save in the database
    const { data: publicUrlData } = supabase.storage.from('vault-assets').getPublicUrl(fileName);
    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Asset upload failed' }, { status: 500 });
  }
}
