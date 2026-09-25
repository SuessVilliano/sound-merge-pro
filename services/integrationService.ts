import { auth } from './firebase';

export type IntegrationMode = 'api' | 'browser_agent' | 'adapter_needed' | 'not_configured' | 'server_proxy_needed' | 'retiring';

export interface IntegrationStatus {
  id: string;
  label: string;
  category: string;
  configured: boolean;
  mode: IntegrationMode;
  real: boolean;
  note: string;
}

export interface IntegrationHealth {
  checkedAt: string;
  providers: IntegrationStatus[];
}

export const integrationService = {
  async getStatus(): Promise<IntegrationHealth> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Sign in to inspect integrations.');

    const response = await fetch('/api/integrations/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'Integration status unavailable.');
    return data as IntegrationHealth;
  }
};
