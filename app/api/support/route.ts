import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const SupportTriageSchema = z.object({
  triageLevel: z.enum(['GENERAL_HELP', 'WALLET_ISSUE', 'CRITICAL_BUG']),
  aiResponseText: z.string().describe("The direct helpful answer to provide to the user right now."),
  needsDeveloperEscalation: z.boolean().describe("Set to true ONLY if this is a genuine contract, API failure, or system-level bug."),
  structuredTicketDetails: z.object({
    severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
    inferredBugContext: z.string().describe("Technical summary of the actual bug for the developer logs, or 'N/A' if general help.")
  }).nullable()
});

export async function POST(req: Request) {
  try {
    const { userMessage, userWalletAddress } = await req.json();

    // 🔥 Lazy-init inside the handler so it doesn't crash during build optimization
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are the automated technical support engine for BaseVault Market. 
                    Your job is to solve standard user problems instantly so the developer doesn't get flooded with noise.
                    
                    KNOWLEDGE BASE CONTEXT:
                    - Wallet Connection Issues: Usually caused by missing the bare injected() provider fallback on mobile in-app browsers. Tell them to copy the link directly into the Coinbase Wallet app browser tab.
                    - Pricing: Items are 0.01 ETH for starters and 0.013 ETH for expansions.
                    - Platform Tax: Secure escrow settlement carries a flat, transparent 4% fee.
                    - Cross-Chain: Powered by LI.FI routing. Users can buy/sell with assets from Solana, Sui, and other EVMs.
                    
                    CRITICAL EXCEPTION: If the user provides an actual console/contract error hash, or describes a broken API route/failed escrow contract execution state where their funds are stuck, mark needsDeveloperEscalation as TRUE.`
        },
        { role: "user", content: `User Wallet: ${userWalletAddress || 'Not Connected'}\nMessage: ${userMessage}` }
      ],
      response_format: zodResponseFormat(SupportTriageSchema, "support_triage"),
    });

    const triageResult = response.choices[0].message.parsed;

    if (triageResult?.needsDeveloperEscalation) {
      console.log("🚨 REAL BUG DETECTED - ESCALATING:", triageResult.structuredTicketDetails);
    }

    return NextResponse.json({ success: true, data: triageResult });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
