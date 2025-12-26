import { 
  streamText, 
  UIMessage, 
  convertToModelMessages, 
  generateText,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai';
import { google, vertex, vertexThirdParty } from '@/lib/ai';
import { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { nanoid } from 'nanoid';

const googleModels = [
    'models/gemini-3-flash-preview',
    'models/gemini-3-pro-preview',
    'models/gemini-2.5-flash-image',
];

const vertexThirdPartyModels = [
    'minimaxai/minimax-m2-maas',
    'moonshotai/kimi-k2-thinking-maas',
];

// Valid aspect ratios for image generation
type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';

// Allow streaming responses up to 60 seconds for image generation
export const maxDuration = 60;

export async function POST(req: Request) {
  const { 
    model, 
    messages, 
    webSearch,
    aspectRatio = '1:1',
  }: { 
    messages: UIMessage[]; 
    model: string;
    webSearch?: boolean;
    aspectRatio?: AspectRatio;
  } = await req.json();

  // Handle image generation model separately
  if (model.includes('image')) {
    const result = await generateText({
      model: google(model),
      messages: await convertToModelMessages(messages),
      providerOptions: {
        google: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        } satisfies GoogleGenerativeAIProviderOptions,
      },
    });

    // Create a UI message stream to send the response
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const textId = nanoid();
        
        // Write text part if present
        if (result.text) {
          writer.write({ type: 'text-start', id: textId });
          writer.write({ type: 'text-delta', delta: result.text, id: textId });
          writer.write({ type: 'text-end', id: textId });
        }
        
        // Write each generated image as a file part
        for (const file of result.files) {
          const dataUrl = `data:${file.mediaType};base64,${file.base64}`;
          writer.write({ 
            type: 'file', 
            url: dataUrl, 
            mediaType: file.mediaType,
          });
        }
      },
    });

    return createUIMessageStreamResponse({ stream });
  }
  
  // Standard text streaming for non-image models
  const result = streamText({
    model: googleModels.includes(model) ? google(model) : vertexThirdPartyModels.includes(model) ? vertexThirdParty.chat(model) : vertex(model),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}