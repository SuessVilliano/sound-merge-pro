import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Sparkles, Save, Upload, X, Wand2, CheckCircle2 } from 'lucide-react';
import { artworkService } from '../services/artworkService';
import { assetStorageService } from '../services/assetStorageService';
import { authService } from '../services/authService';

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export const ArtworkGenerator: React.FC = () => {
  const user = authService.getCurrentUser();
  const refInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState(user?.displayName || '');
  const [prompt, setPrompt] = useState('');
  const [references, setReferences] = useState<{file: File; url: string}[]>([]);
  const [generated, setGenerated] = useState('');
  const [model, setModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');

  const addReferences = async (files: FileList | null) => {
    const items = Array.from(files || []).slice(0, 5 - references.length);
    const next = await Promise.all(items.map(async file => ({ file, url: await fileToDataUrl(file) })));
    setReferences(prev => [...prev, ...next].slice(0, 5));
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setSavedUrl('');
    try {
      const result = await artworkService.generate({
        prompt,
        title,
        artistName,
        aspectRatio: '1:1',
        imageSize: '2K',
        referenceImages: references.map(r => r.url)
      });
      setGenerated(result.dataUrl);
      setModel(result.model);
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: { title: 'Artwork Generation', message: e?.message || 'Could not generate artwork.', type: 'info' }
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const saveArtwork = async () => {
    if (!generated || !user) return;
    setIsSaving(true);
    try {
      const blob = await dataUrlToBlob(generated);
      const filename = `${(title || 'sound-merge-cover').replace(/[^a-z0-9-_]+/gi,'-')}.png`;
      const uploaded = await assetStorageService.uploadFile({
        userId: user.uid,
        file: blob,
        filename,
        folder: 'artwork'
      });
      setSavedUrl(uploaded.url);
      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: { title: 'Artwork Saved', message: 'Cover art is stored in your Sound Merge artwork folder.', type: 'success' }
      }));
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('sf-notification', {
        detail: { title: 'Artwork Save', message: e?.message || 'Could not save artwork.', type: 'error' }
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-yellow-300 text-[9px] font-black uppercase tracking-[0.22em]">
            <Sparkles className="w-4 h-4" /> Nano Banana 2
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Cover Artwork</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            Generate square release art from a creative brief. Add reference images for face, wardrobe, logo, mood or brand consistency.
          </p>
        </div>
        <div className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-300">
          Google Gemini Image
        </div>
      </div>

      <div className="grid xl:grid-cols-[.9fr_1.1fr] gap-6">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Release title" className="rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm text-white" />
            <input value={artistName} onChange={e=>setArtistName(e.target.value)} placeholder="Artist name" className="rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm text-white" />
          </div>

          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe the cover art. Example: luxury retro-futurist album cover, midnight blue penthouse, chrome typography, soulful house energy, no platform logos..." className="w-full min-h-[170px] rounded-2xl bg-slate-900 border border-slate-800 p-4 text-sm text-white resize-none" />

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Reference Images</div>
                <div className="text-[10px] text-slate-600 mt-1">Optional — up to 5.</div>
              </div>
              <button onClick={()=>refInput.current?.click()} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" /> Add
              </button>
              <input ref={refInput} type="file" accept="image/*" multiple className="hidden" onChange={e=>addReferences(e.target.files)} />
            </div>

            {references.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {references.map((item,index)=>(
                  <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-800">
                    <img src={item.url} className="w-full h-full object-cover" />
                    <button onClick={()=>setReferences(prev=>prev.filter((_,i)=>i!==index))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={generate} disabled={isGenerating || !prompt.trim()} className="w-full py-3.5 rounded-xl bg-yellow-300 hover:bg-yellow-200 text-slate-950 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40">
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Cover...</> : <><Wand2 className="w-4 h-4" /> Generate with Nano Banana 2</>}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-black/20 min-h-[430px] flex items-center justify-center overflow-hidden relative">
          {generated ? (
            <>
              <img src={generated} className="w-full h-full object-contain" />
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 justify-between items-center rounded-xl bg-slate-950/85 backdrop-blur p-3 border border-slate-800">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white">{model || 'Nano Banana'}</div>
                  {savedUrl && <div className="text-[9px] text-emerald-300 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Saved to artwork storage</div>}
                </div>
                <button onClick={saveArtwork} disabled={isSaving} className="px-3 py-2 rounded-lg bg-white text-slate-950 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Artwork
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-700 p-8">
              <ImagePlus className="w-14 h-14 mx-auto" />
              <div className="text-sm font-black text-slate-500 mt-4">Your cover will appear here.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
