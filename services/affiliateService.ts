
import { User } from '../types';
import { auth } from './firebase';

const AFFILIATE_DOMAIN = "https://soundmerge.club";

const postAffiliateEvent = async (action: 'signup' | 'sale', payload: Record<string, any>) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) return;
  const response = await fetch('/api/pushlap', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, payload })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'Affiliate tracking failed');
  }
};

export const affiliateService = {
  
  /**
   * Track a new user signup and attribute it to an affiliate if applicable.
   * Matches body structure: { affiliateId, name, email, referredUserExternalId, plan, status }
   */
  trackSignup: async (user: User) => {
    // 1. Check if an affiliate ID exists in the window (set by the script)
    // We check window.affiliateId as per the provided snippet
    // Fixed: Cast window to any for affiliateId access
    const affiliateId = (window as any).affiliateId;
    
    if (!affiliateId) {
        console.debug("No affiliate referral detected (organic signup).");
        return;
    }

    console.log(`Tracking signup for affiliate: ${affiliateId}`);

    const body = {
      affiliateId: affiliateId,
      name: user.displayName,
      email: user.email,
      referredUserExternalId: user.uid, // External ID (Firebase UID)
      plan: user.plan || 'free', // Plan name
      status: 'active', // Status of the referred user
    };

    try {
      await postAffiliateEvent('signup', body);
      console.log('PushLap Signup Tracked Successfully');
    } catch (err) {
      console.error('PushLap Tracking Error:', err);
    }
  },

  /**
   * Track a sale (Upgrade or Merch)
   * Matches body structure: { referralId, externalId, externalInvoiceId, totalEarned, commissionRate? }
   */
  trackSale: async (user: User, amount: number, invoiceId: string, commissionRate?: number) => {
    const body: any = {
      referralId: user.email, // The email of the user who bought the item (links to the referral)
      externalId: user.uid,   // Optional external user ID
      externalInvoiceId: invoiceId, // Unique Invoice ID
      totalEarned: amount,    // Total amount of the sale
    };

    // Optional field to override commission rate
    if (commissionRate !== undefined) {
        body.commissionRate = commissionRate;
    }

    try {
      await postAffiliateEvent('sale', body);
      console.log('PushLap Sale Tracked');
    } catch (err) {
      console.error('PushLap Sale Error:', err);
    }
  },

  /**
   * Generate a sharable affiliate link
   */
  generateLink: (affiliateCode: string) => {
      // Constructs the link using the domain and the affiliate code
      // Uses ?via= parameter which is standard for the affiliate-tracker.js script
      const cleanCode = affiliateCode.trim();
      return `${AFFILIATE_DOMAIN}?via=${cleanCode}`;
  }
};
