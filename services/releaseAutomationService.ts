import { ReleaseRailRecord } from '../types';

export type ReleaseAutomationProvider = 'distrokid' | 'pro' | 'mlc' | 'master_rights';

export interface ReleaseAutomationPacket {
  provider: ReleaseAutomationProvider;
  generatedAt: string;
  releaseRailId: string;
  ready: boolean;
  blockers: string[];
  mode: string;
  payload: Record<string, any>;
  notes: string[];
}

const download = (filename: string, data: any) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const releaseAutomationService = {
  buildDistroKidPacket(record: ReleaseRailRecord): ReleaseAutomationPacket {
    const blockers: string[] = [];
    if (!record.title) blockers.push('Release title missing.');
    if (!record.artistName) blockers.push('Artist name missing.');
    if (!record.releaseDate) blockers.push('Release date missing.');
    if (!record.coverUrl) blockers.push('Cover art missing.');
    if (!record.assetIds.length) blockers.push('No tracks attached.');
    if (record.rails.rights.state !== 'complete') blockers.push('Rights review must be complete.');

    return {
      provider: 'distrokid',
      generatedAt: new Date().toISOString(),
      releaseRailId: record.id,
      ready: blockers.length === 0,
      blockers,
      mode: 'authenticated_browser_submission',
      payload: {
        release: {
          title: record.title,
          primaryArtist: record.artistName,
          releaseType: record.releaseType,
          releaseDate: record.releaseDate,
          label: record.recordLabel,
          genre: record.primaryGenre,
          coverUrl: record.coverUrl
        },
        tracks: record.assetIds.map((assetId, index) => ({
          assetId,
          trackNumber: index + 1,
          existingIsrc: record.identifiers.isrcByAssetId[assetId] || null
        })),
        identifierPolicy: {
          preserveExistingIsrc: true,
          requestNewIsrcWhenMissing: true,
          customUpcForNewUpload: false,
          captureAssignedUpcAfterUpload: true
        }
      },
      notes: [
        'DistroKid can assign ISRCs when a recording does not already have one.',
        'If a recording already has an ISRC, preserve it.',
        'For a new DistroKid upload, capture the UPC assigned by DistroKid after submission.'
      ]
    };
  },

  buildPROPacket(record: ReleaseRailRecord): ReleaseAutomationPacket {
    const blockers: string[] = [];
    if (record.rails.rights.state !== 'complete') blockers.push('Rights review must be complete.');
    if (!record.rights.writers.length) blockers.push('At least one human writer is required.');
    if (!record.rights.splitsConfirmed) blockers.push('Writer splits must be confirmed.');
    if (record.rights.aiAssisted && !record.rights.humanAuthorshipNotes?.trim()) blockers.push('Document the human-authored contribution for AI-assisted work.');

    const targetPROs = Array.from(new Set(record.rights.writers.map(w => w.pro).filter(Boolean)));

    return {
      provider: 'pro',
      generatedAt: new Date().toISOString(),
      releaseRailId: record.id,
      ready: blockers.length === 0,
      blockers,
      mode: 'authenticated_portal_submission',
      payload: {
        workTitle: record.title,
        recordingArtist: record.artistName,
        writers: record.rights.writers.map(w => ({
          legalName: w.legalName,
          role: w.role,
          ownershipShare: w.share,
          ipiCae: w.ipiCae || null,
          pro: w.pro || null,
          publisherName: w.publisherName || null,
          publisherIpi: w.publisherIpi || null
        })),
        targetPROs,
        humanAuthorshipNotes: record.rights.humanAuthorshipNotes || null,
        linkedRecordings: record.assetIds.map(assetId => ({
          assetId,
          isrc: record.identifiers.isrcByAssetId[assetId] || null
        }))
      },
      notes: [
        'Search the selected PRO repertory before creating a duplicate work.',
        'Use legal writer names and IPI/CAE identifiers when available.',
        'Final authorship/ownership attestations require creator confirmation.'
      ]
    };
  },

  buildMLCPacket(record: ReleaseRailRecord): ReleaseAutomationPacket {
    const blockers: string[] = [];
    if (record.rails.rights.state !== 'complete') blockers.push('Rights review must be complete.');
    if (!record.rights.writers.length) blockers.push('Writer information missing.');
    if (!record.rights.splitsConfirmed) blockers.push('Writer splits must be confirmed.');

    const hasPublisherIpi = record.rights.writers.some(w => Boolean(w.publisherIpi));
    const mode = hasPublisherIpi ? 'member_hub_bulk_template_candidate' : 'member_hub_individual_registration';

    return {
      provider: 'mlc',
      generatedAt: new Date().toISOString(),
      releaseRailId: record.id,
      ready: blockers.length === 0,
      blockers,
      mode,
      payload: {
        workTitle: record.title,
        writers: record.rights.writers.map(w => ({
          legalName: w.legalName,
          role: w.role,
          ownershipShare: w.share,
          ipiCae: w.ipiCae || null,
          publisherName: w.publisherName || null,
          publisherIpi: w.publisherIpi || null
        })),
        recordings: record.assetIds.map(assetId => ({
          title: record.title,
          artist: record.artistName,
          isrc: record.identifiers.isrcByAssetId[assetId] || null
        })),
        searchBeforeCreate: true
      },
      notes: [
        'Search The MLC before registering to avoid duplicates.',
        'Use the individual registration flow unless the account has the required publisher setup for bulk registration.',
        'The official Bulk Works spreadsheet must be downloaded from The MLC Member Hub; Sound Merge should populate, not redesign, that template.'
      ]
    };
  },

  buildMasterRightsPacket(record: ReleaseRailRecord): ReleaseAutomationPacket {
    const blockers: string[] = [];
    if (!record.rights.masterOwner) blockers.push('Master owner missing.');
    if (!record.assetIds.length) blockers.push('No recordings attached.');

    return {
      provider: 'master_rights',
      generatedAt: new Date().toISOString(),
      releaseRailId: record.id,
      ready: blockers.length === 0,
      blockers,
      mode: 'sound_recording_admin_review',
      payload: {
        masterOwner: record.rights.masterOwner,
        artistName: record.artistName,
        recordings: record.assetIds.map(assetId => ({
          assetId,
          isrc: record.identifiers.isrcByAssetId[assetId] || null
        }))
      },
      notes: [
        'Keep sound-recording/master administration separate from composition registrations.',
        'Reconcile master-side identifiers after distribution assigns or confirms ISRCs.'
      ]
    };
  },

  build(record: ReleaseRailRecord, provider: ReleaseAutomationProvider): ReleaseAutomationPacket {
    if (provider === 'distrokid') return this.buildDistroKidPacket(record);
    if (provider === 'pro') return this.buildPROPacket(record);
    if (provider === 'mlc') return this.buildMLCPacket(record);
    return this.buildMasterRightsPacket(record);
  },

  download(record: ReleaseRailRecord, provider: ReleaseAutomationProvider) {
    const packet = this.build(record, provider);
    const slug = record.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    download(`${slug || 'release'}-${provider}-packet.json`, packet);
    return packet;
  }
};
