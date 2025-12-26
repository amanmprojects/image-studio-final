import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { google, vertex, vertexThirdParty } from '@/lib/ai';

const googleModels = [
    'models/gemini-3-flash-preview',
    'models/gemini-3-pro-preview',
    'models/gemini-2.5-flash-image',
];

const vertexThirdPartyModels = [
    'minimaxai/minimax-m2-maas',
    'moonshotai/kimi-k2-thinking-maas',
];

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
export async function POST(req: Request) {
  const { 
    model, 
    messages, 
    webSearch 
  }: { 
    messages: UIMessage[]; 
    model: string;
    webSearch?: boolean;
  } = await req.json();


  if(model.includes('image')){
    
  }
  
  const result = streamText({
    model: googleModels.includes(model) ? google(model) : vertexThirdPartyModels.includes(model) ? vertexThirdParty.chat(model) : vertex(model),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}