import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    // Using OpenAI format as standard, swap URL/body if using Gemini/Anthropic
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_SECRET_KEY}` // Locked securely in Vercel
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are the BaseVault Terminal AI Co-Processor. You assist hunters with appraisals, contract audits, and node compliance. Keep responses tactical and concise.' },
          { role: 'user', content: prompt }
        ]
      })
    });
    
    const data = await response.json();
    return NextResponse.json({ text: data.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
  }
}
