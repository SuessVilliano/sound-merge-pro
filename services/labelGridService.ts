import { auth } from './firebase';

export type LabelGridAction =
  | 'connection'
  | 'releases'
  | 'release'
  | 'delivery_status'
  | 'analytics_summary'
  | 'royalties'
  | 'statements'
  | 'transactions'
  | 'outlets'
  | 'create_release'
  | 'validate_release'
  | 'distribute_release';

const token = async () => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('Sign in to use the LabelGrid rail.');
  return idToken;
};

const parse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'LabelGrid request failed.');
  return data;
};

export const labelGridService = {
  async get(action: Extract<LabelGridAction, 'connection' | 'releases' | 'release' | 'delivery_status' | 'analytics_summary' | 'royalties' | 'statements' | 'transactions' | 'outlets'>, params: Record<string, string> = {}) {
    const qs = new URLSearchParams({ action, ...params });
    return parse(await fetch(`/api/labelgrid?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${await token()}` }
    }));
  },

  async post(action: Extract<LabelGridAction, 'create_release' | 'validate_release' | 'distribute_release'>, payload: Record<string, any>) {
    return parse(await fetch('/api/labelgrid', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await token()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, ...payload })
    }));
  },

  async connection() {
    return this.get('connection');
  },

  async deliveryStatus(releaseId: string) {
    return this.get('delivery_status', { id: releaseId });
  },

  async royalties() {
    return this.get('royalties');
  },

  async statements() {
    return this.get('statements');
  },

  async analyticsSummary() {
    return this.get('analytics_summary');
  }
};
