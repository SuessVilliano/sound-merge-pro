import { DistributionSubmission, ReleaseRailRecord, ReleaseRailState, ReleaseType, ReleaseWriter } from '../types';

const now = () => new Date().toISOString();

const makeStep = (state: ReleaseRailState, note?: string) => ({
  state,
  updatedAt: now(),
  ...(note ? { note } : {})
});

export const releaseRailsService = {
  fromDistribution(submission: DistributionSubmission, releaseType: ReleaseType = 'Single'): ReleaseRailRecord {
    const writers: ReleaseWriter[] = [];
    const seen = new Set<string>();

    submission.tracks.forEach(track => {
      (track.contributors || [])
        .filter(c => c.role === 'Songwriter' || c.role === 'Composer')
        .forEach(c => {
          const key = `${c.name}::${c.role}`;
          if (!seen.has(key)) {
            seen.add(key);
            writers.push({
              id: c.id,
              legalName: c.name,
              role: c.role as 'Songwriter' | 'Composer',
              share: c.share ?? 0
            });
          }
        });
    });

    const hasCoreMetadata = Boolean(
      submission.title &&
      submission.artistName &&
      submission.releaseDate &&
      submission.recordLabel &&
      submission.primaryGenre &&
      submission.tracks.length > 0 &&
      submission.tracks.every(t => t.title && t.asset_id)
    );

    const masterOwner = submission.tracks.find(t => t.p_line)?.p_line;
    const publishingAdmin = submission.tracks.find(t => t.c_line)?.c_line;
    const hasRightsBasics = Boolean(masterOwner && publishingAdmin && writers.length > 0);

    const isrcByAssetId = submission.tracks.reduce<Record<string, string>>((acc, track) => {
      if (track.isrc) acc[track.asset_id] = track.isrc;
      return acc;
    }, {});

    return {
      id: `rail_${submission.release_id || crypto.randomUUID()}`,
      userId: submission.userId,
      releaseId: submission.release_id,
      assetIds: submission.tracks.map(t => t.asset_id),
      title: submission.title,
      artistName: submission.artistName,
      releaseType,
      releaseDate: submission.releaseDate,
      recordLabel: submission.recordLabel,
      primaryGenre: submission.primaryGenre,
      coverUrl: submission.coverUrl,
      distributor: 'LabelGrid',
      createdAt: submission.createdAt || now(),
      updatedAt: now(),
      sourceSubmissionId: submission.id,
      identifiers: {
        upc: submission.upcCode,
        isrcByAssetId,
        distributorReleaseId: submission.proprietary_id
      },
      rights: {
        masterOwner,
        publishingAdmin,
        writers,
        splitsConfirmed: writers.length > 0 && writers.every(w => w.share > 0) && Math.abs(writers.reduce((a, b) => a + b.share, 0) - 100) < 0.01,
        samplesCleared: false,
        voiceLikenessCleared: false,
        aiAssisted: Boolean(submission.metadata?.aiAssisted),
        humanAuthorshipNotes: submission.metadata?.humanAuthorshipNotes || ''
      },
      links: {},
      rails: {
        created: makeStep('complete', 'Release record created in Sound Merge.'),
        mastered: makeStep('review', 'Confirm the final master and technical audio file.'),
        metadata: makeStep(hasCoreMetadata ? 'ready' : 'review', hasCoreMetadata ? 'Core release metadata is present.' : 'Complete required release metadata.'),
        rights: makeStep(hasRightsBasics ? 'review' : 'blocked', hasRightsBasics ? 'Rights data exists but splits/clearances still need confirmation.' : 'Add master, publishing and writer information.'),
        distribution: makeStep('ready', 'Release record is ready to route to LabelGrid API/MCP or another selected distributor after QA.'),
        identifiers: makeStep(Object.keys(isrcByAssetId).length ? 'review' : 'pending', 'Capture distributor-assigned ISRC/UPC after submission.'),
        pro: makeStep('pending', 'Composition registration not yet confirmed.'),
        mlc: makeStep('pending', 'MLC registration not yet confirmed.'),
        masterRights: makeStep('pending', 'Master-side registration not yet confirmed.'),
        live: makeStep('pending', 'Store URLs not yet confirmed.'),
        royalties: makeStep('pending', 'Royalty monitoring begins after identifiers and live links are connected.')
      }
    };
  },

  validate(record: ReleaseRailRecord) {
    const issues: string[] = [];
    if (!record.title) issues.push('Release title is missing.');
    if (!record.artistName) issues.push('Artist name is missing.');
    if (!record.releaseDate) issues.push('Release date is missing.');
    if (!record.coverUrl) issues.push('Cover art is missing.');
    if (!record.assetIds.length) issues.push('No tracks are attached.');
    if (!record.rights.masterOwner) issues.push('Master owner is missing.');
    if (!record.rights.publishingAdmin) issues.push('Publishing admin is missing.');
    if (!record.rights.writers.length) issues.push('No songwriter/composer is attached.');
    if (record.rights.writers.length && !record.rights.splitsConfirmed) issues.push('Writer splits must total 100%.');
    return { ok: issues.length === 0, issues };
  },

  progress(record: ReleaseRailRecord) {
    const steps = Object.values(record.rails);
    const complete = steps.filter(s => s.state === 'complete' || s.state === 'not_applicable').length;
    return Math.round((complete / steps.length) * 100);
  }
};
