

import { CRMContact, CRMAutomaton, CRMCampaign, MessageThread, ChatMessage, SocialPost, CommunicationChannel } from '../types';

// Headless GHL Gateway URL (Institutional Rails)
const API_BASE = "https://api.soundmerge.co/api";

export const crmService = {
    
    /**
     * Headless Provisioning: Creates GHL sub-account via Sound Merge Gateway
     */
    provisionUser: async (userId: string, role: string, addressData: any): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE}/integrations/ghl/provision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role, addressData })
            });
            return await response.json();
        } catch (e) {
            console.error("GHL Provisioning failed", e);
            return { success: false, error: "Gateway Unreachable" };
        }
    },

    /**
     * Unified Inbox Matrix: Consolidation of LeadConnector V2 Channels
     */
    getThreads: async (): Promise<MessageThread[]> => {
        try {
            const res = await fetch(`${API_BASE}/inbox/threads`);
            if (!res.ok) throw new Error();
            return await res.json();
        } catch (e) {
            console.warn("CRM inbox unavailable", e);
            return [];
        }
    },

    getMessages: async (threadId: string): Promise<ChatMessage[]> => {
        try {
            const res = await fetch(`${API_BASE}/inbox/threads/${threadId}/messages`);
            if (!res.ok) throw new Error();
            return await res.json();
        } catch (e) {
            console.warn("CRM messages unavailable", e);
            return [];
        }
    },

    sendMessage: async (threadId: string, body: string, channel: string): Promise<any> => {
        // Real logic: POST to gateway which calls LeadConnector conversations API
        try {
            const response = await fetch(`${API_BASE}/inbox/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId, body, preferredChannel: channel })
            });
            return await response.json();
        } catch (e) {
            console.error("CRM send failed", e);
            return { success: false, error: "CRM gateway unavailable" };
        }
    },

    getContacts: async (): Promise<CRMContact[]> => {
        try {
            const res = await fetch(`${API_BASE}/registry/contacts`);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.warn("CRM contacts unavailable", e);
            return [];
        }
    }
};
