import { Opportunity, Stats, AiStaffMember, User, StaffProposal, SyncBrief, BriefArtifacts, StudioSuggestion, DistributionSubmission } from "../types";
import { auth } from "./firebase";

export interface ChatContext {
  currentView: string;
  stats: Stats;
  opportunities: Opportunity[];
  user?: User;
  agentRole?: AiStaffMember['role'] | 'Team Hub';
  pendingDistributions?: DistributionSubmission[];
}

const aiTask = async <T = any>(task: string, payload: any): Promise<T> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in to use Sound Merge AI.');

  const response = await fetch('/api/ai/task', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ task, payload })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Sound Merge AI request failed.');
  return data as T;
};

export const chatWithGemini = async (message: string, _history: any[], context: ChatContext): Promise<string> => {
  try {
    const result = await aiTask<{ text: string }>('chat', { message, context });
    return result.text || 'The Sound Merge brain is recalculating.';
  } catch (e) {
    console.error('AI chat error:', e);
    return 'The Sound Merge brain is currently unavailable. Check Integration Center and try again.';
  }
};

export const getStudioAgentSuggestions = async (styleInput: string, lyrics: string): Promise<StudioSuggestion[]> => {
  try {
    const result = await aiTask<{ data: any[] }>('studio_suggestions', { styleInput, lyrics });
    return (result.data || []).map((d: any, index: number) => ({
      id: d.id || `suggestion_${Date.now()}_${index}`,
      agentId: d.agentId || 'engineer',
      type: d.type || 'fx',
      title: d.title || 'Production Note',
      description: d.description || '',
      promptAddon: d.promptAddon || '',
      timestamp: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Studio suggestions unavailable:', e);
    return [];
  }
};

export const parseBriefToSchema = async (rawText: string): Promise<Partial<SyncBrief>> => {
  try {
    const result = await aiTask<{ data: Partial<SyncBrief> }>('parse_brief', { rawText });
    return result.data || { title: 'Imported Brief' };
  } catch (e) {
    console.warn('Brief parser unavailable:', e);
    return { title: 'Imported Brief' };
  }
};

export const searchAddresses = async (_query: string): Promise<any[]> => {
  return [];
};

export const generateBriefArtifacts = async (brief: SyncBrief): Promise<BriefArtifacts> => {
  try {
    const result = await aiTask<{ data: any }>('brief_artifacts', { brief });
    return {
      id: `art_${Date.now()}`,
      briefId: brief.id,
      productionPromptPack: result.data?.productionPromptPack || {
        arrangement: '', mood: '', tempo: '', genre: '', instruments: [], keywordsInclude: []
      },
      pitchChecklist: result.data?.pitchChecklist || { technical: [], legal: [] }
    };
  } catch (e) {
    return {
      id: 'err',
      briefId: brief.id,
      productionPromptPack: { arrangement: '', mood: '', tempo: '', genre: '', instruments: [], keywordsInclude: [] },
      pitchChecklist: { technical: [], legal: [] }
    };
  }
};

export const generatePitchEmail = async (opportunity: Opportunity, trackTitle: string): Promise<string> => {
  try {
    const result = await aiTask<{ text: string }>('pitch_email', { opportunity, trackTitle });
    return result.text || 'Draft currently unavailable.';
  } catch (e) {
    return 'Draft currently unavailable.';
  }
};

export const generateBattleCommentary = async (genre: string, p1: string, p2: string, status: string): Promise<string> => {
  try {
    const result = await aiTask<{ text: string }>('battle_commentary', { genre, p1, p2, status });
    return result.text || 'The music battle continues.';
  } catch (e) {
    return 'The music battle continues.';
  }
};

export const generateProactiveProposal = async (context: ChatContext): Promise<StaffProposal | null> => {
  try {
    const result = await aiTask<{ data: any }>('proactive_proposal', { context });
    const data = result.data;
    if (!data) return null;
    return {
      id: `prop_${Date.now()}`,
      agentId: context.agentRole || 'mgr',
      timestamp: new Date().toISOString(),
      type: data.type || 'strategy',
      title: data.title || 'Suggested Next Step',
      description: data.description || '',
      impact: data.impact || 'medium',
      actionLabel: data.actionLabel || 'Review'
    };
  } catch (e) {
    return null;
  }
};

export const generateBrandImage = async (_prompt: string, _size: string, _aspectRatio: string): Promise<string | null> => {
  return null;
};

export const editBrandImage = async (_imgBase64: string, _prompt: string, _size: string): Promise<string | null> => {
  return null;
};

export const analyzeImage = async (imgBase64: string): Promise<string[]> => {
  try {
    const result = await aiTask<{ data: string[] }>('analyze_image', { imgBase64 });
    return result.data || [];
  } catch (e) {
    return [];
  }
};

export const generateVideoFromText = async (_prompt: string, _aspectRatio: string): Promise<string | null> => {
  return null;
};

export const generateVideoFromImage = async (_imgBase64: string, _prompt: string, _aspectRatio: string): Promise<string | null> => {
  return null;
};

export const searchVenues = async (_query: string, _location?: { latitude: number, longitude: number }): Promise<{ text: string, places: any[] }> => {
  return { text: 'Venue search requires an active places integration.', places: [] };
};

export class LiveSession {
  public onAudioData: () => void = () => {};

  async connect() {
    throw new Error('Live audio sessions are not connected in Sound Merge yet.');
  }

  disconnect() {}
}
