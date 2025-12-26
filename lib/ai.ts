import { createVertex } from '@ai-sdk/google-vertex';   
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';


const vertexThirdParty = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });


// Parse the service account key from environment variable
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY as string);

// Create a Vertex AI provider instance with explicit credentials
const vertex = createVertex({
    project: 'chatapp-by-amanm',
    location: 'global',
    googleAuthOptions: {
        credentials: credentials,  // Pass the parsed JSON credentials directly
    },
});


const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });



export { vertex, google, vertexThirdParty };