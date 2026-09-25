
import { User, WebhookLog, Opportunity } from '../types';
import { auth } from './firebase';

// System webhook destinations are server-side only.\n// Local storage for logs (Mock Database for Webhooks)
let webhookLogs: WebhookLog[] = [];

export const webhookService = {
    
    /**
     * Sends critical user data to the system backup (Supabase) and CRM (HighLevel).
     * This is called immediately after signup.
     */
    sendSystemEvent: async (eventType: 'signup' | 'profile_update' | 'plan_change' | 'admin_test' | 'sync_match', userData: User, extraData?: any) => {
        const payload = {
            event: eventType,
            timestamp: new Date().toISOString(),
            user: {
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName,
                phone: userData.phoneNumber || '',
                plan: userData.plan,
                photoURL: userData.photoURL
            },
            ...extraData
        };

        const logEntry: WebhookLog = {
            id: `hook_${Date.now()}`,
            timestamp: new Date().toISOString(),
            event: eventType,
            status: 'pending',
            payload: payload,
            destination: '/api/system/event'
        };

        webhookLogs.unshift(logEntry); // Add to local log

        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error('No authenticated session for system event.');

            const response = await fetch('/api/system/event', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            logEntry.status = response.ok ? 'success' : 'failed';
            logEntry.responseCode = response.status;
            
            console.log(`[System Webhook] Sent ${eventType} event through secure relay. Status: ${response.status}`);

        } catch (e) {
            console.error("Error sending system webhook", e);
            logEntry.status = 'failed';
        }
    },

    /**
     * Specifically send a sync match notification
     */
    sendSyncMatchNotification: async (user: User, opportunity: Opportunity) => {
        if (!user.notificationSettings?.emailSyncMatches) return;

        console.log(`[Notification] Dispatching email alert for ${user.email}: New match for ${opportunity.brief_title}`);
        
        await webhookService.sendSystemEvent('sync_match', user, {
            opportunity: {
                id: opportunity.id,
                title: opportunity.brief_title,
                payout: `${opportunity.payout_min} - ${opportunity.payout_max}`,
                usage: opportunity.usage_type
            }
        });
    },

    /**
     * Triggers a user-defined webhook if they have one configured in their profile.
     * Used for things like "New Sale", "New Stream Milestone".
     */
    triggerUserWebhook: async (user: User, event: 'sale' | 'stream' | 'placement', data: any) => {
        if (!user.webhooks?.enabled || !user.webhooks.url) return;
        
        // Check if user subscribed to this event type
        if (user.webhooks.events && !user.webhooks.events.includes(event)) return;

        const payload = {
            event,
            timestamp: new Date().toISOString(),
            data
        };

        const logEntry: WebhookLog = {
            id: `user_hook_${Date.now()}`,
            timestamp: new Date().toISOString(),
            event: event,
            status: 'pending',
            payload: payload,
            destination: user.webhooks.url
        };
        webhookLogs.unshift(logEntry);

        try {
            const response = await fetch(user.webhooks.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            logEntry.status = response.ok ? 'success' : 'failed';
            logEntry.responseCode = response.status;

            console.log(`[User Webhook] Triggered for ${user.email}`);
        } catch (e) {
            console.error(`[User Webhook] Failed for ${user.email}`, e);
            logEntry.status = 'failed';
        }
    },

    /**
     * Admin Function: Retrieve logs for the dashboard
     */
    getLogs: (): WebhookLog[] => {
        return webhookLogs;
    },

    /**
     * Admin Function: Clear logs
     */
    clearLogs: () => {
        webhookLogs = [];
    }
};
