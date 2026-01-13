
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Opportunity, Stats, AiStaffMember, User, StaffProposal, SyncBrief, BriefArtifacts, StudioSuggestion, DistributionSubmission } from "../types";

const getAiClient = () => {
  return new GoogleGenerativeAI(process.env.API_KEY || '');
};

const getModel = (modelName: string = "gemini-1.5-flash") => {
  const ai = getAiClient();
  return ai.getGenerativeModel({ model: modelName });
};

export interface ChatContext {
  currentView: string;
  stats: Stats;
  opportunities: Opportunity[];
  user?: User;
  agentRole?: AiStaffMember['role'] | 'Team Hub';
  pendingDistributions?: DistributionSubmission[];
}

/**
 * SOUND MERGE CORE INTELLIGENCE ENGINE
 */
export const chatWithGemini = async (message: string, history: any[], context: ChatContext): Promise<string> => {
  try {
    const model = getModel("gemini-1.5-flash");

    const goalText = context.user?.primaryGoal ? `The artist's current primary goal is: ${context.user.primaryGoal}.` : "";
    const distContext = context.pendingDistributions && context.pendingDistributions.length > 0
      ? `The artist has ${context.pendingDistributions.length} pending distribution releases.`
      : "";

    const systemPrompt = `You are an elite Music Industry Professional and Senior Strategist at Sound Merge.
Your tone is authoritative, highly competent, and conversational.

GUIDELINES:
- Respond in PLAIN TEXT ONLY. No markdown, no bolding, no headers.
- Be punchy and concise. Max 2-3 sentences.
- Proactively suggest next steps based on the user's view: ${context.currentView}.

Current Stats: ${context.stats.totalStreams} streams, ${context.stats.totalEarnings} earnings.
Role: ${context.agentRole || 'Consultant'}.
${goalText}
${distContext}`;

    const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}`);
    const response = await result.response;
    return response.text() || "Synchronizing with industry signals...";
  } catch (e) {
    console.error("Gemini error:", e);
    return "The Sound Merge brain is currently recalculating. Please try again in a moment.";
  }
};

export const getStudioAgentSuggestions = async (styleInput: string, lyrics: string): Promise<StudioSuggestion[]> => {
  try {
    const model = getModel("gemini-1.5-flash");
    const prompt = `Act as a professional production team. Generate 3 proactive musical suggestions.
Style: "${styleInput}"
Lyrics: "${lyrics}"

Return a JSON array with objects containing: id, agentId, type, title, description, promptAddon`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]).map((d: any) => ({ ...d, timestamp: new Date().toISOString() }));
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const parseBriefToSchema = async (rawText: string): Promise<Partial<SyncBrief>> => {
  try {
    const model = getModel("gemini-1.5-flash");
    const result = await model.generateContent(`Normalize this sync brief into JSON: "${rawText}"`);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { title: "Imported Brief" };
  } catch (e) {
    return { title: "Imported Brief" };
  }
};

export const searchAddresses = async (query: string): Promise<any[]> => {
  // Google Maps integration not available in npm package
  return [];
};

export const generateBriefArtifacts = async (brief: SyncBrief): Promise<BriefArtifacts> => {
  try {
    const model = getModel("gemini-1.5-flash");
    const result = await model.generateContent(`Blueprint for: "${brief.title} - ${brief.description}". Return JSON.`);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { id: `art_${Date.now()}`, briefId: brief.id, ...JSON.parse(jsonMatch[0]) };
    }
    throw new Error("No JSON found");
  } catch (e) {
    return { id: 'err', briefId: brief.id, productionPromptPack: { arrangement: '', mood: '', tempo: '', genre: '', instruments: [], keywordsInclude: [] }, pitchChecklist: { technical: [], legal: [] } };
  }
};

export const generatePitchEmail = async (opportunity: Opportunity, trackTitle: string): Promise<string> => {
  try {
    const model = getModel("gemini-1.5-flash");
    const result = await model.generateContent(`Professional pitch for "${opportunity.brief_title}" using track "${trackTitle}".`);
    const response = await result.response;
    return response.text() || "Draft currently unavailable.";
  } catch (e) {
    return "Draft currently unavailable.";
  }
};

export const generateBattleCommentary = async (genre: string, p1: string, p2: string, status: string): Promise<string> => {
  try {
    const model = getModel("gemini-1.5-flash");
    const result = await model.generateContent(`${p1} vs ${p2} in ${genre}. One sentence hype.`);
    const response = await result.response;
    return response.text() || "The sonic clash continues!";
  } catch (e) {
    return "The sonic clash continues!";
  }
};

export const generateProactiveProposal = async (context: ChatContext): Promise<StaffProposal | null> => {
  try {
    const model = getModel("gemini-1.5-flash");
    const result = await model.generateContent(`Proposal for ${context.agentRole} based on views. Return JSON.`);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return { id: `prop_${Date.now()}`, agentId: context.agentRole || 'mgr', timestamp: new Date().toISOString(), ...data };
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const generateBrandImage = async (prompt: string, size: string, aspectRatio: string): Promise<string | null> => {
  // Image generation not available in basic npm package
  console.log("Image generation requires Vertex AI or AI Studio");
  return null;
};

export const editBrandImage = async (imgBase64: string, prompt: string, size: string): Promise<string | null> => {
  // Image editing not available in basic npm package
  return null;
};

export const analyzeImage = async (imgBase64: string): Promise<string[]> => {
  try {
    const model = getModel("gemini-1.5-flash");
    const result = await model.generateContent([
      { text: "List objects/themes in this image as a JSON array of strings." },
      { inlineData: { mimeType: 'image/png', data: imgBase64.split(',')[1] || imgBase64 } }
    ]);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const generateVideoFromText = async (prompt: string, aspectRatio: string): Promise<string | null> => {
  // Video generation not available in npm package
  console.log("Video generation requires Vertex AI");
  return null;
};

export const generateVideoFromImage = async (imgBase64: string, prompt: string, aspectRatio: string): Promise<string | null> => {
  // Video generation not available in npm package
  return null;
};

export const searchVenues = async (query: string, location?: { latitude: number, longitude: number }): Promise<{ text: string, places: any[] }> => {
  // Google Maps integration not available in npm package
  return { text: "Venue search requires additional configuration.", places: [] };
};

// LiveSession class - stubbed as Live API not available in npm package
export class LiveSession {
  public onAudioData: () => void = () => {};

  async connect() {
    console.log("Live audio sessions require AI Studio runtime");
    return null;
  }

  disconnect() {}
}
