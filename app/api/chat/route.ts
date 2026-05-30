import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    // 🚨 DEEP SCAN DIAGNOSTIC 
    // This looks at the literal keys Next.js loaded, filtering for anything related to OpenAI
    const openAiKeys = Object.keys(process.env).filter(key => key.toUpperCase().includes('OPEN'));
    console.log("DEEP SCAN -> Found these related variables in memory:", openAiKeys);
    console.log("SERVER CHECK -> Exact OPENAI_API_KEY loaded:", process.env.OPENAI_API_KEY ? "YES ✅" : "NO ❌");

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ reply: "SYSTEM ERROR: API Key missing in runtime. Check terminal logs." }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { message } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4", 
      messages: [
        { 
          role: "system", 
          content: "You are the BaseVault AI Matrix. You are a highly technical, cyberpunk-themed AI assistant managing a decentralized Web3 marketplace. You answer questions about blockchain mechanics, node deployment, escrow fees (4% protocol takeover), and fulfillment logistics concisely. Speak in a clinical, precise, and futuristic tone." 
        },
        { role: "user", content: message }
      ],
    });

    return NextResponse.json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error("OpenAI Error:", error);
    return NextResponse.json({ reply: "SYSTEM FAULT: Connection to core LLM matrix failed." }, { status: 500 });
  }
}
