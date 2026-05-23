import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const CombinedProcessSchema = z.object({
  identifiedItemName: z.string().describe("Clean, searchable title of the detected asset."),
  itemCategory: z.enum(['TCG_Cards', 'Electronics_Hardware', 'Collectibles_Memorabilia', 'Other']),
  marketUsdValue: z.number().describe("Estimated secondary fair market value in USD."),
  pricingStrategies: z.object({
    fastLiquidateEth: z.number(),
    fairMarketEth: z.number(),
    premiumChoiceEth: z.number()
  }),
  authenticityMetrics: z.object({
    isStockOrInternetPhoto: z.boolean().describe("True if the photo is an official retail stock shot or marketing render instead of a real-world photo."),
    detectedConditionScore: z.enum(['Mint', 'Near Mint', 'Good', 'Fair', 'Poor']).describe("Visual wear assessment from the physical proof photo."),
    confidenceRating: z.number().min(0).max(100)
  })
});

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    const currentEthPriceUsd = 3100.00; 

    // 🔥 Lazy-init inside the handler so it doesn't crash during build optimization
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a high-fidelity real-world asset appraisal unit embedded inside the BaseVault Market protocol. 
                    The current live market price of Ethereum is exactly $${currentEthPriceUsd} USD per 1 ETH. 
                    Analyze the user's item image, determine its real-world USD value, check if it looks like a stock/internet download photo vs an organic unique smartphone image, and calculate precise, accurate listing recommendations directly in ETH units based on this exact exchange rate.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this item and provide optimized ETH listing recommendations." },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      response_format: zodResponseFormat(CombinedProcessSchema, "smart_appraisal"),
    });

    return NextResponse.json({ success: true, data: response.choices[0].message.parsed });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
