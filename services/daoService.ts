import { Proposal } from '../types';

export const daoService = {
  async getProposals(): Promise<Proposal[]> {
    return [];
  },

  async castVote(_proposalId: string, _vote: 'for' | 'against', _votingPower: number): Promise<{ success: boolean }> {
    throw new Error('DAO voting is not connected to a verified governance contract yet.');
  },

  calculateVotingPower(xp: number, earnings: number): number {
    return Math.floor(xp + (earnings * 10));
  }
};
