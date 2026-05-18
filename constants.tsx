
import { Opportunity, Track, Stats, Battle, User, SyncBrief } from './types';

export const APP_NAME = "Sound Merge";

export const VIEWS = {
  DASHBOARD: 'dashboard',
  ALL_TOOLS: 'all-tools',
  STAFF: 'staff',
  BATTLES: 'battles',
  CATALOG: 'catalog',
  STUDIO: 'studio',
  AR_DASHBOARD: 'ar-dashboard',
  MY_MUSIC: 'my-music',
  OPPORTUNITIES: 'opportunities',
  TOURING: 'touring',
  REVENUE: 'revenue',
  ADVANCES: 'advances', // Renamed from funding
  BRAND: 'brand',
  ACADEMY: 'academy',
  COMMUNITY: 'community',
  MASTERING: 'mastering',
  ANALYTICS: 'analytics',
  PROFILE: 'profile',
  CRM: 'crm',
  VOICE: 'voice',
  DISTRIBUTION: 'distribution',
  RIGHTS: 'rights',
  DAO: 'dao',
  MONITORING: 'monitoring',
  SETTINGS: 'settings',
  LIVE_AGENT: 'live-agent',
  AFFILIATES: 'affiliates',
  SMART_WALLET: 'smart-wallet',
  ADMIN: 'admin',
  BOOKING: 'booking'
};

/**
 * NAVIGATION WITH PROGRESSIVE DISCLOSURE
 * milestone: 'core' | 'first_asset' | 'reputation_500' | 'reputation_1000' | 'reputation_2000' | 'pro_only' | 'always'
 */
export const NAVIGATION_ITEMS = [
  { id: VIEWS.DASHBOARD, label: 'Dashboard', icon: 'LayoutDashboard', milestone: 'core' },
  { id: VIEWS.ALL_TOOLS, label: 'All Tools', icon: 'Grid', milestone: 'always' },
  { id: VIEWS.STAFF, label: 'AI Staff', icon: 'MessageSquare', ai: true, milestone: 'core' },
  { id: VIEWS.STUDIO, label: 'AI Studio', icon: 'Wand2', ai: true, milestone: 'core' },
  { id: VIEWS.VOICE, label: 'Voice Market', icon: 'Mic', ai: true, milestone: 'core' },
  { id: VIEWS.RIGHTS, label: 'Rights Hub', icon: 'ShieldCheck', milestone: 'core' },

  // UNLOCKS AFTER FIRST ASSET (XP > 0)
  { id: VIEWS.MY_MUSIC, label: 'My Library', icon: 'Music', milestone: 'first_asset' },
  { id: VIEWS.CATALOG, label: 'Music Catalog', icon: 'Disc', milestone: 'first_asset' },
  
  // UNLOCKS AT LEVEL 2 (XP > 500)
  { id: VIEWS.OPPORTUNITIES, label: 'Opportunities', icon: 'Zap', milestone: 'reputation_500' },
  { id: VIEWS.BRAND, label: 'Brand Builder', icon: 'Briefcase', milestone: 'reputation_500' },
  { id: VIEWS.BATTLES, label: 'Music Battles', icon: 'Swords', milestone: 'reputation_500' },
  { id: VIEWS.AFFILIATES, label: 'Partners', icon: 'DollarSign', milestone: 'reputation_500' },

  // UNLOCKS AT LEVEL 3 (XP > 1000)
  { id: VIEWS.DISTRIBUTION, label: 'Distribution', icon: 'Radio', milestone: 'reputation_1000' },
  { id: VIEWS.REVENUE, label: 'Revenue Recovery', icon: 'DollarSign', milestone: 'reputation_1000' },
  { id: VIEWS.TOURING, label: 'Gig Finder', icon: 'MapPin', milestone: 'reputation_1000' },

  // BUSINESS & INSTITUTIONAL (XP > 2000 or Pro)
  { id: VIEWS.CRM, label: 'CRM', icon: 'Mail', milestone: 'reputation_2000' },
  { id: VIEWS.ADVANCES, label: 'Advances', icon: 'Landmark', milestone: 'reputation_2000' }, // Renamed label to Advances
  { id: VIEWS.SMART_WALLET, label: 'Smart Wallet', icon: 'Wallet', milestone: 'reputation_2000' },
  
  // ENTERPRISE & SOCIAL
  { id: VIEWS.ANALYTICS, label: 'Insights', icon: 'BarChart2', milestone: 'pro_only' },
  { id: VIEWS.AR_DASHBOARD, label: 'A&R Dashboard', icon: 'Star', milestone: 'pro_only' },
  { id: VIEWS.DAO, label: 'DAO', icon: 'Vote', milestone: 'reputation_2000' },
  
  // ADMIN & SYSTEM
  { id: VIEWS.MONITORING, label: 'System Monitor', icon: 'Activity', ai: true, adminOnly: true, milestone: 'core' },
];

export const MOCK_STATS: Stats = {
  totalEarnings: 12450,
  totalStreams: 452000,
  activeOpportunities: 12,
  brandScore: 'A-',
  earningsGrowth: 12.5,
  streamsGrowth: 8.2,
  opportunitiesNew: true,
  artistLevel: "Rising Star",
  xp: 1250,
  nextLevelXp: 2000
};

export const MOCK_BRIEFS: SyncBrief[] = [
  {
    id: 'sb_1',
    source: 'PartnerAPI',
    title: 'High-Energy Electronic for Major Airline Campaign',
    description: 'A global airline is looking for an uplifting, high-energy electronic or pop track for their 2025 global rebrand launch.',
    mediaType: 'Ad',
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    budget: { min: 5000, max: 15000, currency: 'USD' },
    requiredGenres: ['Electronic', 'Modern Pop'],
    moods: ['Uplifting', 'Expansive', 'Energetic'],
    tempo: '124-128 BPM',
    vocal: 'Either',
    references: ['Flume', 'Odesza'],
    deliverables: ['Full Mix', 'Instrumental', '30s Cut', 'Stems'],
    territory: ['Worldwide'],
    usage: ['1 Year', 'All Media'],
    rightsRequired: { master: true, publishing: true },
    createdAt: new Date().toISOString(),
    readinessScore: 85
  }
];

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'op1',
    source_platform: 'songtradr',
    brief_title: 'Upbeat Track for Travel Commercial',
    description: 'High-energy electronic or pop track needed for a global airline campaign.',
    usage_type: 'Ad',
    duration_required: 120,
    payout_min: 500,
    payout_max: 2000,
    deadline_datetime: new Date(Date.now() + 86400000 * 3).toISOString(),
    submission_status: 'matched',
    match_score: 92,
    mood_tags: ['Uplifting', 'Travel', 'Energy']
  }
];

export const MOCK_BATTLES: Battle[] = [
    {
        id: 'b1',
        title: 'The Turing Test Challenge',
        description: 'Can you spot the AI? A human-produced track vs a pure generative model.',
        type: 'Hybrid',
        genre: 'Pop',
        status: 'Live',
        endTime: new Date(Date.now() + 3600000).toISOString(),
        totalVotes: 4210,
        listeners: 156,
        config: { rewards: { cash: 1000, xp: 2500 }, customRules: ['Blind Listen Only'] },
        participants: [
            { id: 'p1', artistName: 'Artist Anonymous', isAi: false, trackTitle: 'Heart in a Box', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', image: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&w=400&q=80', votes: 2150 },
            { id: 'p2', artistName: 'Model-X Gen3', isAi: true, trackTitle: 'Neural Pulse', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80', votes: 2060 }
        ]
    }
];

export const FEATURED_ARTISTS: Partial<User>[] = [
    {
        uid: 'f1',
        displayName: 'Alex Rivera',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        role: 'artist',
        isFeatured: true
    }
];

export const PRO_PLATFORMS = [
  { name: 'ASCAP', type: 'PRO', url: 'https://www.ascap.com/' },
  { name: 'BMI', type: 'PRO', url: 'https://www.bmi.com/' },
  { name: 'SESAC', type: 'PRO', url: 'https://www.sesac.com/' },
  { name: 'SoundExchange', type: 'Digital Performance', url: 'https://www.soundexchange.com/' },
  { name: 'The MLC', type: 'Mechanical', url: 'https://www.themlc.com/' },
  { name: 'PRS for Music', type: 'PRO', url: 'https://www.prsformusic.com/' },
];

/**
 * RIGHTS REGISTRATION COCKPIT
 * Each registry an artist's works must be filed with. None of these bodies
 * expose a public submission API, so Sound Merge prepares copy-paste-ready
 * data packets and routes the artist into the correct portal.
 */
export const RIGHTS_REGISTRIES = [
  {
    id: 'copyright_us',
    name: 'U.S. Copyright Office',
    short: 'Copyright',
    registers: 'Composition + Master',
    tagline: 'Your legal proof of authorship.',
    purpose: 'Creates the official public record that you authored the song. Registration is required before you can sue for infringement, and it unlocks statutory damages and attorney fees.',
    cost: '$45–$85 per filing',
    timeline: 'Several months to receive a certificate',
    needs: [
      'Work title',
      'Legal name of every author',
      'Year the work was completed',
      'Date + nation of first publication (if released)',
      'Deposit copy: lyric sheet + audio master',
    ],
    steps: [
      'Create a free account at the Copyright Office eCO portal.',
      'Start a Standard Application for a musical work (add the sound recording if you own it).',
      'Enter the title, authors, and year of creation from the packet below.',
      'Add first-publication details if the song has been released.',
      'Pay the filing fee and upload your lyric sheet + audio deposit copy.',
    ],
    portalLinks: [
      { label: 'Open eCO Filing Portal', url: 'https://eco.copyright.gov/' },
      { label: 'Copyright.gov Music Guide', url: 'https://www.copyright.gov/registration/music/' },
    ],
  },
  {
    id: 'mlc',
    name: 'The MLC',
    short: 'Mechanical',
    registers: 'Composition',
    tagline: 'Collects your US mechanical royalties.',
    purpose: 'The Mechanical Licensing Collective pays mechanical royalties for streams and downloads in the US. Registering your compositions lets the MLC match them to recordings and pay the songwriters.',
    cost: 'Free for self-administered songwriters',
    timeline: 'Registration is quick; matching is ongoing',
    needs: [
      'Work title',
      'ISWC (if one has been assigned)',
      'Every songwriter + their IPI/CAE number',
      'Publisher(s) — or a self-published designation',
      'Ownership shares totalling exactly 100%',
      'Matched recording ISRC(s)',
    ],
    steps: [
      'Create a Member account in the MLC portal.',
      'Open Add/Edit Works and start a new work registration.',
      'Enter writers, publishers, and shares exactly as listed below.',
      'Attach the recording by ISRC so streams can be matched.',
      'Submit the work and confirm it appears in your catalog.',
    ],
    portalLinks: [
      { label: 'Open The MLC Portal', url: 'https://portal.themlc.com/' },
      { label: 'The MLC Home', url: 'https://www.themlc.com/' },
    ],
  },
  {
    id: 'soundexchange',
    name: 'SoundExchange',
    short: 'Digital Performance',
    registers: 'Master',
    tagline: 'Royalties from digital + satellite radio.',
    purpose: 'SoundExchange collects digital performance royalties for sound recordings played on non-interactive services like SiriusXM and internet radio. It pays the featured artist and the recording owner directly.',
    cost: 'Free to register',
    timeline: 'Register anytime; royalties accrue continuously',
    needs: [
      'ISRC for the recording',
      'Recording title',
      'Featured artist name(s)',
      'Sound recording owner / label',
      'Release date',
    ],
    steps: [
      'Create a SoundExchange account.',
      'Register as a recording artist and/or rights owner.',
      'Add your recordings using the ISRC and details below.',
      'Submit and verify your recordings are listed.',
    ],
    portalLinks: [
      { label: 'Open SoundExchange Registration', url: 'https://www.soundexchange.com/artist-copyright-owner/register-now/' },
      { label: 'SoundExchange Home', url: 'https://www.soundexchange.com/' },
    ],
  },
  {
    id: 'pro',
    name: 'PRO — ASCAP / BMI / SESAC',
    short: 'Performance',
    registers: 'Composition',
    tagline: 'Performance royalties from radio, TV + venues.',
    purpose: 'A Performing Rights Organization collects public-performance royalties whenever your song is played publicly. Join one PRO as a writer, then register every work so performances are tracked to you.',
    cost: 'BMI free · ASCAP ~$50 one-time · SESAC by invitation',
    timeline: 'Join once; register each work as it is finished',
    needs: [
      'Active PRO membership (writer + publisher)',
      'Work title as it will be registered',
      'Each writer IPI/CAE number',
      'Publisher details + splits',
      'Performance shares totalling 100%',
    ],
    steps: [
      'Join one PRO as a writer — and set up your publisher entity.',
      'Log in to your PRO member portal.',
      'Start a new work registration.',
      'Enter writers, publishers, and shares from the packet below.',
      'Submit and note the work ID the PRO assigns.',
    ],
    portalLinks: [
      { label: 'Join / Open ASCAP', url: 'https://www.ascap.com/' },
      { label: 'Join / Open BMI', url: 'https://www.bmi.com/' },
      { label: 'SESAC', url: 'https://www.sesac.com/' },
    ],
  },
];

/**
 * CAREER STAGES
 * Captured during onboarding to personalise the artist's registration
 * roadmap inside the Rights Hub.
 */
export const CAREER_STAGES = [
  {
    id: 'hobbyist',
    label: 'Hobbyist',
    icon: 'Sprout',
    tagline: 'Making music for the love of it.',
    description: 'You write and record, mostly for yourself or a small audience. Releases are occasional.',
    roadmap: [
      { title: 'Copyright your first finished song', detail: 'A copyright registration is your legal proof of authorship — file it once a song is done.' },
      { title: 'Join a free PRO as a writer', detail: 'BMI is free to join, so even occasional radio or playlist plays get tracked to you.' },
      { title: 'Keep a clean record of your splits', detail: 'Note who wrote what now — it is far harder to reconstruct later.' },
    ],
  },
  {
    id: 'emerging',
    label: 'Emerging Artist',
    icon: 'Rocket',
    tagline: 'Building toward your first real releases.',
    description: 'You are preparing to release and want your rights set up correctly from day one.',
    roadmap: [
      { title: 'Join a PRO and register every work', detail: 'Performance royalties only reach you once each song is registered with your PRO.' },
      { title: 'Register your compositions with The MLC', detail: 'The MLC pays mechanical royalties from US streams — register before your release goes live.' },
      { title: 'Copyright each song before release', detail: 'Filing before publication strengthens your legal position.' },
      { title: 'Lock in songwriter splits in writing', detail: 'Confirm shares with every collaborator before the song is out.' },
    ],
  },
  {
    id: 'releasing',
    label: 'Active Releasing Artist',
    icon: 'Radio',
    tagline: 'Putting music out on a regular schedule.',
    description: 'You release consistently and need every new work registered across all bodies.',
    roadmap: [
      { title: 'Run the full registration stack on every release', detail: 'Copyright, PRO, The MLC and SoundExchange — each new song should clear all four.' },
      { title: 'Register recordings with SoundExchange', detail: 'Digital and satellite radio royalties for your masters are collected here.' },
      { title: 'Confirm splits before each release date', detail: 'Use the split editor so shares total 100% before the song ships.' },
      { title: 'Track filing status so nothing slips', detail: 'Mark each registry Submitted, then Confirmed, as you go.' },
    ],
  },
  {
    id: 'catalog',
    label: 'Established Catalog',
    icon: 'Library',
    tagline: 'A back catalog that needs cleaning up.',
    description: 'You have a body of work — some of it may be unregistered or registered incompletely.',
    roadmap: [
      { title: 'Import your full catalog with Find My Songs', detail: 'Pull every release tied to your name into the Hub so nothing is missed.' },
      { title: 'Audit each work against all four registries', detail: 'Older songs are often missing from the MLC or SoundExchange.' },
      { title: 'Reconcile splits and publisher info', detail: 'Fix any work whose shares do not total 100% or is missing a publisher.' },
      { title: 'Chase down unclaimed royalties', detail: 'Registering back catalog with the MLC and SoundExchange can surface money already owed to you.' },
    ],
  },
];

export const DISTRIBUTION_PARTNERS = [
  { name: 'Spotify', icon: 'Music' },
  { name: 'Apple Music', icon: 'Music' },
  { name: 'TikTok', icon: 'Music' },
  { name: 'YouTube Music', icon: 'Music' },
  { name: 'Instagram', icon: 'Music' },
  { name: 'Deezer', icon: 'Music' },
];

export const MASTERING_STYLES = [
  { id: 'balanced', name: 'Balanced', description: 'Clean and transparent with natural dynamics.' },
  { id: 'warm', name: 'Warm', description: 'Vintage analog character with soft saturation.' },
  { id: 'bright', name: 'Bright', description: 'Enhanced high-end clarity and presence.' },
  { id: 'aggressive', name: 'Aggressive', description: 'Maximum loudness and punch for club tracks.' },
  { id: 'custom', name: 'Custom AI', description: 'Provide specific instructions to the neural engine.' },
];

export const MOCK_COURSES = [
  { 
    id: 'c1', 
    title: 'Sync Licensing Masterclass', 
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80', 
    category: 'Business', 
    duration: '4h 20m', 
    lessons: 12 
  },
  { 
    id: 'c2', 
    title: 'AI-Powered Production', 
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80', 
    category: 'Technical', 
    duration: '3h 45m', 
    lessons: 10 
  },
  { 
    id: 'c3', 
    title: 'On-Chain Rights & IP', 
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80', 
    category: 'Legal', 
    duration: '2h 15m', 
    lessons: 8 
  },
];
