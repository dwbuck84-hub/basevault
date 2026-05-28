import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. LAZY INITIALIZATION: Only connect when the route is actually called!
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("API Gateway Error: Missing Supabase Environment Variables");
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. FILE PROCESSING
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `bounty-proof-${Date.now()}-${file.name}`;

    // 3. SECURE UPLOAD
    const { data, error } = await supabase.storage
      .from('vault-assets') 
      .upload(fileName, buffer, { contentType: file.type });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from('vault-assets').getPublicUrl(fileName);
    return NextResponse.json({ url: publicUrlData.publicUrl });
    
  } catch (error) {
    console.error("API Upload Crash:", error);
    return NextResponse.json({ error: 'Asset upload failed' }, { status: 500 });
  }
}
