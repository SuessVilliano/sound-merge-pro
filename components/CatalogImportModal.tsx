import React, { useMemo, useRef, useState } from 'react';
import {
  X, Library, UploadCloud, Music2, ImagePlus, Trash2, Loader2,
  CheckCircle2, Link2, Barcode, CalendarDays
} from 'lucide-react';
import { User, ReleaseRailRecord, ReleaseType } from '../types';
import { assetStorageService } from '../services/assetStorageService';
import { dataService } from '../services/dataService';

interface CatalogImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

type ImportTrack = {
  id: string;
  file: File;
  title: string;
  isrc: string;
};

const now = () => new Date().toISOString();
const step = (state: any, note: string) => ({ state, updatedAt: now(), note });

export const CatalogImportModal: React.FC<CatalogImportModalProps> = ({ isOpen, onClose, user }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [tracks, setTracks] = useState<ImportTrack[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [releaseTitle, setReleaseTitle] = useState('');
  const [artistName, setArtistName] = useState(user.displayName || '');
  const [releaseType, setReleaseType] = useState<ReleaseType>('Album');
  const [releaseDate, setReleaseDate] = useState('');
  const [label, setLabel] = useState('Independent');
  const [genre, setGenre] = useState('');
  const [upc, setUpc] = useState('');
  const [distributorReleaseId, setDistributorReleaseId] = useState('');
  const [spotify, setSpotify] = useState('');
  const [appleMusic, setAppleMusic] = useState('');
  const [youtubeMusic, setYoutubeMusic] = useState('');
  const [masterOwner, setMasterOwner] = useState(user.displayName || '');
  const [publishingAdmin, setPublishingAdmin] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState('');

  const allIsrc = useMemo(() => tracks.length > 0 && tracks.every(t => t.isrc.trim()), [tracks]);
  const hasLiveLinks = Boolean(spotify || appleMusic || youtubeMusic);

  if (!isOpen) return null;

  const addFiles = (files: FileList | null) => {
    const next = Array.from(files || [])
      .filter(file => file.type.startsWith('audio/'))
      .map(file => ({
        id: crypto.randomUUID(),
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        isrc: ''
      }));
    setTracks(prev => [...prev, ...next]);
  };

  const updateTrack = (id: string, patch: Partial<ImportTrack>) => {
    setTracks(prev => prev.map(track => track.id === id ? { ...track, ...patch } : track));
  };

  const importCatalog = async () => {
    if (!tracks.length || !releaseTitle.trim() || !artistName.trim()) {
      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: { title: 'Catalog Import', message: 'Add at least one master plus a release title and artist name.', type: 'info' }
      }));
      return;
    }

    setIsImporting(true);
    try {
      let coverUrl = '';
      if (cover) {
        setProgress('Uploading cover art...');
        const uploadedCover = await assetStorageService.uploadFile({
          userId: user.uid,
          file: cover,
          filename: cover.name,
          folder: 'artwork'
        });
        coverUrl = uploadedCover.url;
      }

      const assetIds: string[] = [];
      const isrcByAssetId: Record<string, string> = {};

      for (let index = 0; index < tracks.length; index++) {
        const item = tracks[index];
        setProgress(`Uploading master ${index + 1} of ${tracks.length}: ${item.title}`);

        const uploaded = await assetStorageService.uploadFile({
          userId: user.uid,
          file: item.file,
          filename: item.file.name,
          folder: 'masters'
        });

        const assetId = `track_${crypto.randomUUID()}`;
        assetIds.push(assetId);
        if (item.isrc.trim()) isrcByAssetId[assetId] = item.isrc.trim();

        await dataService.saveTrack(user.uid, {
          id: assetId,
          title: item.title || `Track ${index + 1}`,
          artist: artistName,
          audioUrl: uploaded.url,
          imageUrl: coverUrl,
          tags: genre ? [genre] : [],
          duration: 0,
          engine: 'uploaded',
          isSaved: true,
          createdAt: now(),
          source: 'catalog_import',
          storagePath: uploaded.path,
          isrc: item.isrc.trim() || undefined,
          upc: upc.trim() || undefined,
          recordLabel: label,
          genre,
          releaseTitle,
          originalReleaseDate: releaseDate || undefined
        } as any);
      }

      const record: ReleaseRailRecord = {
        id: `rail_${crypto.randomUUID()}`,
        userId: user.uid,
        releaseId: `catalog_${crypto.randomUUID()}`,
        assetIds,
        title: releaseTitle.trim(),
        artistName: artistName.trim(),
        releaseType,
        releaseDate: releaseDate || '',
        recordLabel: label || 'Independent',
        primaryGenre: genre || '',
        coverUrl: coverUrl || undefined,
        distributor: 'Other',
        createdAt: now(),
        updatedAt: now(),
        identifiers: {
          upc: upc.trim() || undefined,
          isrcByAssetId,
          distributorReleaseId: distributorReleaseId.trim() || undefined
        },
        rights: {
          masterOwner: masterOwner.trim() || undefined,
          publishingAdmin: publishingAdmin.trim() || undefined,
          writers: [],
          splitsConfirmed: false,
          samplesCleared: false,
          voiceLikenessCleared: true,
          aiAssisted: false,
          humanAuthorshipNotes: 'Imported existing catalog; no AI authorship assumed by Sound Merge.'
        },
        links: {
          spotify: spotify.trim() || undefined,
          appleMusic: appleMusic.trim() || undefined,
          youtubeMusic: youtubeMusic.trim() || undefined
        },
        rails: {
          created: step('complete', 'Existing catalog release imported into Sound Merge.'),
          mastered: step('complete', 'Imported files are treated as artist-supplied masters.'),
          metadata: step(releaseDate && genre ? 'complete' : 'review', 'Review imported release metadata.'),
          rights: step(masterOwner ? 'review' : 'blocked', 'Add writers, splits, publishing administration and clearance details.'),
          distribution: step(hasLiveLinks ? 'complete' : 'review', hasLiveLinks ? 'Existing live release links imported.' : 'Existing distributor/store delivery has not been confirmed.'),
          identifiers: step(allIsrc && upc ? 'complete' : 'review', 'Reconcile ISRC/UPC and work/party identifiers in Catalog Identity.'),
          pro: step('pending', 'PRO registration has not been confirmed in Sound Merge.'),
          mlc: step('pending', 'Mechanical registration has not been confirmed in Sound Merge.'),
          masterRights: step('pending', 'Neighboring/master-side registration has not been confirmed.'),
          live: step(hasLiveLinks ? 'complete' : 'pending', hasLiveLinks ? 'At least one existing DSP link is connected.' : 'Add existing DSP links.'),
          royalties: step('pending', 'Connect distributor/publishing/neighboring-rights money sources to reconcile statements.')
        }
      };

      await dataService.saveReleaseRail(record);
      setProgress('Catalog imported.');

      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: {
          title: 'Catalog Imported',
          message: `${releaseTitle} is now in My Music, Release Rails and Catalog Identity.`,
          type: 'success'
        }
      }));

      onClose();
    } catch (error: any) {
      console.error('[CatalogImport]', error);
      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: { title: 'Catalog Import Failed', message: error?.message || 'Could not import this catalog.', type: 'error' }
      }));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-[9px] font-black uppercase tracking-[0.22em]">
              <Library className="w-4 h-4" /> Existing Catalog
            </div>
            <h2 className="text-2xl font-black text-white mt-1">Import an Existing Release</h2>
            <p className="text-xs text-slate-500 mt-1">No AI generation required. Bring the music you already made.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-500"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-7 custom-scrollbar">
          <div className="grid md:grid-cols-[180px_1fr] gap-5">
            <button onClick={() => coverInput.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center">
              {cover ? <img src={URL.createObjectURL(cover)} className="w-full h-full object-cover" /> : <div className="text-center text-slate-500"><ImagePlus className="w-8 h-8 mx-auto" /><span className="text-[9px] font-black uppercase tracking-widest mt-2 block">Cover Art</span></div>}
            </button>
            <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={e => setCover(e.target.files?.[0] || null)} />

            <div className="grid md:grid-cols-2 gap-4">
              <input value={releaseTitle} onChange={e => setReleaseTitle(e.target.value)} placeholder="Release / album title" className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
              <input value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Artist name" className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
              <select value={releaseType} onChange={e => setReleaseType(e.target.value as ReleaseType)} className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white"><option>Single</option><option>EP</option><option>Album</option></select>
              <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label / independent" className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
              <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Primary genre" className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
              <div className="relative"><Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" /><input value={upc} onChange={e => setUpc(e.target.value)} placeholder="Existing UPC / EAN" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 pl-10 text-sm text-white font-mono" /></div>
              <input value={distributorReleaseId} onChange={e => setDistributorReleaseId(e.target.value)} placeholder="Distributor release ID (optional)" className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div><h3 className="text-white font-black">Masters</h3><p className="text-xs text-slate-500">Upload the final files you already own. Add existing ISRCs when known.</p></div>
              <button onClick={() => fileInput.current?.click()} className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Add Masters</button>
              <input ref={fileInput} type="file" accept="audio/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
            </div>

            <div className="space-y-2">
              {tracks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-600"><Music2 className="w-8 h-8 mx-auto" /><div className="mt-2 text-sm">No masters added yet.</div></div>
              ) : tracks.map((track, index) => (
                <div key={track.id} className="grid md:grid-cols-[48px_1fr_220px_40px] gap-3 items-center rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-black text-xs">{index + 1}</div>
                  <input value={track.title} onChange={e => updateTrack(track.id,{title:e.target.value})} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
                  <input value={track.isrc} onChange={e => updateTrack(track.id,{isrc:e.target.value})} placeholder="ISRC if known" className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  <button onClick={() => setTracks(prev => prev.filter(t => t.id !== track.id))} className="p-2 text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="relative"><Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" /><input value={spotify} onChange={e => setSpotify(e.target.value)} placeholder="Spotify release URL" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 pl-10 text-xs text-white" /></div>
            <div className="relative"><Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" /><input value={appleMusic} onChange={e => setAppleMusic(e.target.value)} placeholder="Apple Music release URL" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 pl-10 text-xs text-white" /></div>
            <div className="relative"><Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" /><input value={youtubeMusic} onChange={e => setYoutubeMusic(e.target.value)} placeholder="YouTube Music release URL" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 pl-10 text-xs text-white" /></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input value={masterOwner} onChange={e => setMasterOwner(e.target.value)} placeholder="Master owner / ℗" className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
            <input value={publishingAdmin} onChange={e => setPublishingAdmin(e.target.value)} placeholder="Publisher/admin if known" className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-slate-400">
            Importing a release does not claim that BMI/ASCAP/MLC/SoundExchange registrations are complete. Sound Merge creates the identity and rights checklist, then tracks each confirmed registration separately.
          </div>
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-950">
          {progress && <div className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">{isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}{progress}</div>}
          <button onClick={importCatalog} disabled={isImporting || !tracks.length} className="w-full py-3.5 rounded-xl bg-white hover:bg-cyan-300 text-slate-950 font-black uppercase tracking-widest text-[10px] disabled:opacity-40">
            {isImporting ? 'Importing Catalog...' : 'Import Existing Release'}
          </button>
        </div>
      </div>
    </div>
  );
};
