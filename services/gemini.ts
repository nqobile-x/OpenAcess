import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { UserProfile, MapGroundingChunk, SearchGroundingChunk, AspectRatio, ImageSize } from "../types";
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from "./audioUtils";

// Initialize the client. API_KEY is guaranteed to be available in process.env.API_KEY
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Map Grounding Search ---
export const searchVenues = async (query: string, location: { lat: number; lng: number } | null) => {
  const ai = getAiClient();
  const locationContext = location 
    ? `The user is located at latitude ${location.lat}, longitude ${location.lng}. Prioritize nearby places.` 
    : '';

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Find accessible places matching this query: "${query}". ${locationContext}
    Provide a list of places. If possible, mention specific accessibility features like ramps, elevators, or wide doors based on available data.`,
    config: {
      tools: [{ googleMaps: {} }],
      // Optional retrieval config if we want strict location bias
      // toolConfig: location ? { retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } } } : undefined
    },
  });

  const text = response.text || "No results found.";
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  // Extract map links
  const places = chunks
    .filter((c: any) => c.maps)
    .map((c: any) => ({
        uri: c.maps.uri,
        title: c.maps.title,
        source: c.maps.placeAnswerSources?.[0]
    }));

  return { text, places };
};

// --- Chat with Search Grounding & Thinking ---
export const chatWithAssistant = async (
  message: string, 
  history: any[], 
  profile: UserProfile, 
  useThinking: boolean = false
) => {
  const ai = getAiClient();
  const profileContext = `User Accessibility Profile: ${JSON.stringify(profile)}`;
  
  // Model Selection
  let model = "gemini-3-pro-preview"; // Default for complex chat
  let config: any = {
    systemInstruction: `You are OpenAccess Assistant, an expert in accessibility for Gauteng, South Africa. 
    ${profileContext}
    Always prioritize the user's accessibility needs. 
    For transport queries, use Google Search grounding.
    For generic questions, provide helpful, empathetic responses.`,
  };

  if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 };
      // Thinking model handles complex reasoning
  } else {
      // Use Search Grounding for standard info retrieval if not thinking
      config.tools = [{ googleSearch: {} }];
      // Use Flash for faster search-based responses if complexity is low, but user requested "Chatbot" which maps to Pro.
      // However, "Use Google Search data" maps to gemini-3-flash-preview. 
      // Let's stick to Pro for general chat as requested by "AI powered chatbot" feature, 
      // but if we need Search specifically, we might switch.
      // The prompt asks to use 'gemini-3-flash-preview' for Search Grounding.
      // Let's use 3-Flash for queries that look like information seeking, and 3-Pro for pure chat.
      // For simplicity in this function, we default to Pro but add search tool.
      // Actually, per spec: "Use gemini-3-flash-preview (with googleSearch tool)"
      model = "gemini-3-flash-preview"; 
  }

  const chat = ai.chats.create({
    model: model,
    config: config,
    history: history
  });

  const response = await chat.sendMessage({ message });
  
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const urls = groundingChunks
    .filter((c: any) => c.web)
    .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));

  return { text: response.text, urls };
};

// --- Fast Response (Lite) ---
export const fastCheck = async (query: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest', // gemini-flash-lite-latest
    contents: `Quickly answer this accessibility question: ${query}`,
  });
  return response.text;
};

// --- Image Generation ---
export const generateAccessibleImage = async (prompt: string, size: ImageSize, aspectRatio: AspectRatio) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: aspectRatio
      }
    }
  });

  // Extract images
  const images: string[] = [];
  if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
              images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          }
      }
  }
  return images;
};

// --- Image Editing ---
export const editImageWithAi = async (base64Image: string, prompt: string, mimeType: string = 'image/jpeg') => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    }
  });
  
  // Look for image output
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
  }
  return null; // or handle text fallback
};

// --- TTS ---
export const speakText = async (text: string): Promise<AudioBuffer | null> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            const audioBytes = base64ToUint8Array(base64Audio);
            return await decodeAudioData(audioBytes, ctx, 24000, 1);
        }
    } catch (e) {
        console.error("TTS Error", e);
    }
    return null;
}

// --- Live API Connector ---
export const connectLiveSession = async (
    onAudioData: (buffer: AudioBuffer) => void,
    onClose: () => void
) => {
    const ai = getAiClient();
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    
    // Request mic access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: "You are a helpful, real-time accessibility assistant for the OpenAccess app. Keep responses concise.",
        },
        callbacks: {
            onopen: () => {
                console.log("Live session opened");
                const source = inputAudioContext.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                
                scriptProcessor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                };
                
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
                const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                     const bytes = base64ToUint8Array(base64Audio);
                     const buffer = await decodeAudioData(bytes, outputAudioContext, 24000, 1);
                     onAudioData(buffer);
                }
            },
            onclose: (e) => {
                console.log("Live session closed", e);
                onClose();
            },
            onerror: (e) => {
                console.error("Live session error", e);
                onClose();
            }
        }
    });

    return {
        disconnect: () => {
            sessionPromise.then(s => s.close());
            inputAudioContext.close();
            outputAudioContext.close();
            stream.getTracks().forEach(t => t.stop());
        }
    };
};
