import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Instantiate Gemini client safely
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    const genAI = getGeminiClient();
    
    // Fallback Mock for Hackathon Demo if no API KEY is detected in environment
    if (!genAI) {
      console.warn("No GEMINI_API_KEY detected. Using mock fallback parsing.");
      // Small artificial delay to mimic AI response time for presentation
      await new Promise(r => setTimeout(r, 1500));
      return NextResponse.json({
        action: transcript.toLowerCase().includes('send') || transcript.toLowerCase().includes('transfer') ? 'transfer' : 'unknown',
        amount: 5000,
        recipient: 'Damilola'
      });
    }

    // Direct Gemini integration
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a financial AI analyzing voice commands for the Orbit banking app.
    Extract the banking intent from this transcript into strict JSON.
    Format EXCLUSIVELY as: { "action": "transfer", "amount": 5000, "recipient": "Name" }
    
    Transcript: "${transcript}"
    
    Do NOT include markdown like \`\`\`json. Return pure JSON text only.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean string output properly
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(cleanJson);
    return NextResponse.json(parsed);

  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return NextResponse.json({ action: 'unknown' }, { status: 400 });
  }
}
