import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No target asset found inside form streaming lines." }, { status: 400 });
    }

    const pinataFormPayload = new FormData();
    pinataFormPayload.append('file', file);

    const pinataMetadata = JSON.stringify({
      name: `BaseVault_Delivery_Node_${Date.now()}`,
    });
    pinataFormPayload.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormPayload.append('pinataOptions', pinataOptions);

    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT_SECRET}`
      },
      body: pinataFormPayload
    });

    const pinataData = await pinataResponse.json();
    return NextResponse.json(pinataData);

  } catch (err) {
    console.error("Internal Gateway Core Error:", err);
    return NextResponse.json({ error: "Decentralized cluster uplink timeout." }, { status: 500 });
  }
}