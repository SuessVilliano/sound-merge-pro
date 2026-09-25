const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyDJpetLrw16a7osby9SM2PEXOgSorGdD5Y";
const PROTOCOL_VERSION = "2026-07-28";

const providers = [
  { id:"higgsfield", label:"Higgsfield", capabilities:["video","image","character","lip_sync","motion"], modes:["api","mcp","web"], preferred:"mcp_for_agents_api_for_in_app" },
  { id:"suno", label:"Suno", capabilities:["music_generation","lyrics","covers","stems"], modes:["api"], preferred:"api" },
  { id:"mureka", label:"Mureka", capabilities:["music_generation"], modes:["api"], preferred:"api" },
  { id:"music_ai", label:"Music.AI", capabilities:["stems","transcription","voice_detection","metadata","audio_workflows"], modes:["api"], preferred:"api" },
  { id:"landr", label:"LANDR", capabilities:["mastering"], modes:["api"], preferred:"api" },
  { id:"chartmetric", label:"Chartmetric", capabilities:["analytics","artist_data","playlist_data","audience"], modes:["api","mcp"], preferred:"mcp_for_agents_api_for_dashboards" },
  { id:"songstats", label:"Songstats", capabilities:["cross_platform_analytics"], modes:["api"], preferred:"api" },
  { id:"spotify", label:"Spotify", capabilities:["catalog","profile","playlists","playback"], modes:["api"], preferred:"api" },
  { id:"apple_music", label:"Apple Music", capabilities:["catalog","library","playlists","replay"], modes:["api"], preferred:"api" },
  { id:"youtube", label:"YouTube", capabilities:["video_upload","channel_data","analytics","revenue_analytics"], modes:["api"], preferred:"api" },
  { id:"soundcloud", label:"SoundCloud", capabilities:["track_upload","playback","social","search"], modes:["api"], preferred:"api" },
  { id:"tiktok", label:"TikTok", capabilities:["creator_profile","video_display","content_posting"], modes:["api"], preferred:"api" },
  { id:"bandsintown", label:"Bandsintown", capabilities:["events","venues","ticket_links"], modes:["api"], preferred:"api" },
  { id:"musixmatch", label:"Musixmatch", capabilities:["licensed_lyrics","lyric_metadata"], modes:["api"], preferred:"api" },
  { id:"musicbrainz", label:"MusicBrainz", capabilities:["metadata","isrc","iswc","artist_release_lookup"], modes:["api"], preferred:"api" },
  { id:"distrokid", label:"DistroKid", capabilities:["distribution"], modes:["browser_agent"], preferred:"browser_agent_until_partner_api_verified" },
  { id:"the_mlc", label:"The MLC", capabilities:["mechanical_registration"], modes:["browser_agent","bulk_file","cwr"], preferred:"browser_agent_or_bulk_file" },
  { id:"bmi_ascap", label:"BMI / ASCAP / PRO portals", capabilities:["performance_registration"], modes:["browser_agent"], preferred:"browser_agent_with_final_approval" },
  { id:"soundexchange", label:"SoundExchange", capabilities:["neighboring_rights","repertoire_matching"], modes:["browser_agent","partner_api"], preferred:"browser_agent_or_approved_api" }
];

const toolDefinitions = [
  {
    name:"sound_merge_status",
    description:"Return Sound Merge's current provider routing map and MCP server status.",
    inputSchema:{type:"object",properties:{},additionalProperties:false}
  },
  {
    name:"route_capability",
    description:"Choose the strongest current provider connection mode for an artist capability such as video, music generation, mastering, analytics, distribution, rights registration, touring, lyrics, or metadata.",
    inputSchema:{type:"object",properties:{capability:{type:"string"}},required:["capability"],additionalProperties:false}
  },
  {
    name:"build_prompt_pack",
    description:"Turn a rough music idea into a structured title, style prompt, lyrics, BPM, arrangement and generation notes using Sound Merge Prompt Architect.",
    inputSchema:{type:"object",properties:{
      brief:{type:"string"},
      currentStyle:{type:"string"},
      currentLyrics:{type:"string"},
      instrumental:{type:"boolean"},
      targetEngine:{type:"string",enum:["suno","mureka","udio","studio"]}
    },required:["brief"],additionalProperties:false}
  },
  {
    name:"musicbrainz_search",
    description:"Search MusicBrainz for artist, recording, release, or work metadata. Useful for metadata reconciliation before distribution/rights registration.",
    inputSchema:{type:"object",properties:{
      query:{type:"string"},
      entity:{type:"string",enum:["artist","recording","release","work"]},
      limit:{type:"integer",minimum:1,maximum:10}
    },required:["query"],additionalProperties:false}
  },
  {
    name:"higgsfield_video_route",
    description:"Return the best Higgsfield path for a music-video task: web, official MCP, or API, including official setup URLs.",
    inputSchema:{type:"object",properties:{
      goal:{type:"string"},
      wantsInAppGeneration:{type:"boolean"},
      wantsExistingPlanCredits:{type:"boolean"}
    },required:["goal"],additionalProperties:false}
  },
  {
    name:"create_music_job",
    description:"Start a music-generation job through a configured Sound Merge provider. Returns the provider job/task payload and never pretends completion.",
    inputSchema:{type:"object",properties:{
      provider:{type:"string",enum:["suno","mureka"]},
      prompt:{type:"string"},
      lyrics:{type:"string"},
      instrumental:{type:"boolean"},
      title:{type:"string"},
      vocalGender:{type:"string",enum:["male","female","none"]}
    },required:["provider","prompt"],additionalProperties:false}
  },
  {
    name:"release_readiness",
    description:"Evaluate whether a release is ready for distribution and rights rails without submitting anything.",
    inputSchema:{type:"object",properties:{
      title:{type:"string"},
      artistName:{type:"string"},
      trackCount:{type:"integer",minimum:1},
      masterReady:{type:"boolean"},
      coverReady:{type:"boolean"},
      splitsConfirmed:{type:"boolean"},
      aiAssisted:{type:"boolean"},
      humanAuthorshipNotes:{type:"string"},
      samplesCleared:{type:"boolean"}
    },required:["title","artistName","trackCount"],additionalProperties:false}
  }
];

const textContent = (value) => ({ content:[{ type:"text", text: typeof value === "string" ? value : JSON.stringify(value,null,2) }] });

function rpcResult(id, result){ return {jsonrpc:"2.0",id,result}; }
function rpcError(id, code, message, data){ return {jsonrpc:"2.0",id,error:{code,message,...(data!==undefined?{data}:{})}}; }

async function authenticate(req){
  const header=req.headers?.authorization || req.headers?.Authorization || "";
  if(!header.startsWith("Bearer ")) return null;
  const token=header.slice(7).trim();
  if(!token) return null;

  if(process.env.SOUND_MERGE_MCP_KEY && token === process.env.SOUND_MERGE_MCP_KEY){
    return {uid:"sound-merge-service",email:"",displayName:"Sound Merge MCP"};
  }

  try{
    const response=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({idToken:token})
    });
    if(!response.ok) return null;
    const data=await response.json();
    const user=data?.users?.[0];
    if(!user?.localId) return null;
    return {uid:user.localId,email:user.email||"",displayName:user.displayName||""};
  }catch{
    return null;
  }
}

async function geminiPromptPack(args){
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  const model=process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const prompt=`
You are Sound Merge's senior music producer and prompt architect.
Turn this brief into production-ready JSON for ${args.targetEngine || "suno"}.
Do not name living artists as style targets. Describe traits directly.
Return ONLY JSON:
{"title":"","stylePrompt":"","lyrics":"","negativePrompt":"","tags":[],"bpm":120,"keyFeel":"","structure":[],"generationNotes":""}
BRIEF: ${args.brief || ""}
CURRENT STYLE: ${args.currentStyle || ""}
CURRENT LYRICS: ${args.currentLyrics || ""}
INSTRUMENTAL: ${args.instrumental ? "yes" : "no"}
`;
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:0.8}})
  });
  const data=await response.json();
  if(!response.ok) throw new Error(data?.error?.message || "Prompt Architect failed.");
  const raw=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("") || "{}";
  return JSON.parse(raw.trim().replace(/^```json\s*/i,"").replace(/^```/,"").replace(/```$/,""));
}

async function musicBrainzSearch(args){
  const entity=args.entity || "recording";
  const limit=Math.max(1,Math.min(Number(args.limit||5),10));
  const url=`https://musicbrainz.org/ws/2/${entity}/?query=${encodeURIComponent(args.query)}&limit=${limit}&fmt=json`;
  const response=await fetch(url,{headers:{"User-Agent":"SoundMerge/3.0 (contact: support@soundmerge.app)","Accept":"application/json"}});
  const data=await response.json();
  if(!response.ok) throw new Error("MusicBrainz lookup failed.");
  return data;
}

function routeCapability(capability){
  const q=String(capability||"").toLowerCase();
  const aliases={
    video:["video","lip","visual","music video","image"],
    music_generation:["song","music","beat","generate","composition"],
    mastering:["master","mastering","lufs"],
    analytics:["analytics","stats","audience","playlist","chart"],
    distribution:["distribution","distribute","dsp","release"],
    rights:["rights","pro","mechanical","mlc","publishing","neighboring"],
    touring:["tour","show","gig","concert","venue"],
    lyrics:["lyrics","lyric"],
    metadata:["metadata","isrc","iswc","catalog"]
  };
  const matched=Object.entries(aliases).find(([,terms])=>terms.some(t=>q.includes(t)))?.[0] || q;
  const capabilityMap={
    video:["higgsfield"],
    music_generation:["suno","mureka"],
    mastering:["landr","music_ai"],
    analytics:["chartmetric","songstats","spotify","youtube","apple_music"],
    distribution:["distrokid","soundcloud"],
    rights:["the_mlc","bmi_ascap","soundexchange","musicbrainz"],
    touring:["bandsintown"],
    lyrics:["musixmatch"],
    metadata:["musicbrainz","spotify","apple_music"]
  };
  const ids=capabilityMap[matched] || [];
  return providers.filter(p=>ids.includes(p.id));
}

async function createMusicJob(args){
  if(args.provider==="mureka"){
    const apiKey=process.env.MUREKA_API_KEY;
    if(!apiKey) throw new Error("MUREKA_API_KEY is not configured.");
    const instrumental=Boolean(args.instrumental);
    const url=instrumental ? "https://api.mureka.ai/v1/instrumental/generate" : "https://api.mureka.ai/v1/song/generate";
    const body=instrumental
      ? {model:"auto",prompt:String(args.prompt).slice(0,1024),n:1}
      : {model:"auto",prompt:String(args.prompt).slice(0,1024),lyrics:String(args.lyrics||"").slice(0,5000),n:1,...(["male","female"].includes(args.vocalGender)?{gender:args.vocalGender}:{})};
    const response=await fetch(url,{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await response.json();
    if(!response.ok) throw new Error(data?.error?.message || "Mureka generation failed.");
    return {provider:"mureka",submitted:true,completed:false,providerResponse:data};
  }
  if(args.provider==="suno"){
    const apiKey=process.env.SUNO_API_KEY;
    const generateUrl=process.env.SUNO_GENERATE_URL;
    if(!apiKey || !generateUrl) throw new Error("Suno Platform adapter requires SUNO_API_KEY and SUNO_GENERATE_URL.");
    const response=await fetch(generateUrl,{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({
      prompt:args.prompt,lyrics:args.instrumental?"":(args.lyrics||""),instrumental:Boolean(args.instrumental),title:args.title||""
    })});
    const data=await response.json();
    if(!response.ok) throw new Error(data?.error?.message || data?.message || "Suno generation failed.");
    return {provider:"suno",submitted:true,completed:false,providerResponse:data};
  }
  throw new Error("Unsupported music provider.");
}

function releaseReadiness(args){
  const blockers=[];
  const warnings=[];
  if(!args.masterReady) blockers.push("Final master not confirmed.");
  if(!args.coverReady) blockers.push("Cover art not confirmed.");
  if(!args.splitsConfirmed) blockers.push("Writer/composer splits not confirmed.");
  if(!args.samplesCleared) blockers.push("Samples/covers clearance not confirmed.");
  if(args.aiAssisted && !String(args.humanAuthorshipNotes||"").trim()) warnings.push("Document human-authored contribution before rights registration.");
  return {
    ready:blockers.length===0,
    blockers,
    warnings,
    nextSteps:[
      "Stage canonical release record in Release Rails.",
      "Submit distribution through verified API/partner or approval-gated browser agent.",
      "Capture assigned ISRC/UPC after distributor response.",
      "Register composition with applicable PRO and The MLC.",
      "Connect master-side/neighboring-rights registration.",
      "Reconcile live DSP URLs and royalty sources."
    ]
  };
}

async function callTool(name,args){
  switch(name){
    case "sound_merge_status":
      return textContent({server:"Sound Merge MCP",protocolVersion:PROTOCOL_VERSION,providers});
    case "route_capability":
      return textContent({capability:args.capability,recommended:routeCapability(args.capability)});
    case "build_prompt_pack":
      return textContent(await geminiPromptPack(args));
    case "musicbrainz_search":
      return textContent(await musicBrainzSearch(args));
    case "higgsfield_video_route":{
      const mode=args.wantsInAppGeneration ? "api" : (args.wantsExistingPlanCredits ? "mcp" : "web");
      return textContent({
        goal:args.goal,
        recommendedMode:mode,
        web:"https://higgsfield.ai",
        mcpSetup:"https://higgsfield.ai/mcp",
        mcpEndpoint:"https://mcp.higgsfield.ai/mcp",
        apiConsole:"https://open.higgsfield.ai",
        note: mode==="mcp"
          ? "Official Higgsfield MCP uses the artist's existing Higgsfield account/plan credits."
          : mode==="api"
            ? "Higgsfield API is the path for generation embedded directly inside Sound Merge and uses separate API billing."
            : "Open the Higgsfield web app when the artist prefers its native UI and plan/unlimited allowances."
      });
    }
    case "create_music_job":
      return textContent(await createMusicJob(args));
    case "release_readiness":
      return textContent(releaseReadiness(args));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Sound Merge MCP uses HTTP POST."});

  const body=req.body || {};
  const id=body.id ?? null;

  if(body.method==="initialize"){
    return res.status(200).json(rpcResult(id,{
      protocolVersion:PROTOCOL_VERSION,
      capabilities:{tools:{listChanged:false}},
      serverInfo:{name:"sound-merge",version:"3.0.0"},
      instructions:"Sound Merge centralizes independent-artist creation, media, release, rights, analytics and revenue workflows. Use API providers when deterministic software access exists, MCP for agent-native providers, and approval-gated browser workflows for portals without verified APIs."
    }));
  }

  if(body.method==="notifications/initialized"){
    return res.status(204).end();
  }

  const identity=await authenticate(req);
  if(!identity) return res.status(401).json(rpcError(id,-32001,"Unauthorized","Use a valid Firebase ID token or SOUND_MERGE_MCP_KEY."));

  if(body.method==="ping") return res.status(200).json(rpcResult(id,{}));

  if(body.method==="tools/list"){
    return res.status(200).json(rpcResult(id,{tools:toolDefinitions}));
  }

  if(body.method==="tools/call"){
    const name=body.params?.name;
    const args=body.params?.arguments || {};
    try{
      const result=await callTool(name,args);
      return res.status(200).json(rpcResult(id,result));
    }catch(error){
      return res.status(200).json(rpcResult(id,{content:[{type:"text",text:error?.message || "Tool failed."}],isError:true}));
    }
  }

  return res.status(200).json(rpcError(id,-32601,"Method not found"));
}
