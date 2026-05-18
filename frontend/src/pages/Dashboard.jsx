import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { useToast } from '../components/Toast';
import { BarChart3, Zap, Database } from 'lucide-react';

function CampaignSetup() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [adName, setAdName] = useState('');
  const [clickUrl, setClickUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [publicApiUrl, setPublicApiUrl] = useState('http://localhost:8000');
  const navigate = useNavigate();
  const toast = useToast();

  const fetchCampaigns = () => {
    fetch(`http://localhost:8000/api/campaigns/me`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCampaigns(data);
      });
  };

  useEffect(() => { 
    fetchCampaigns(); 
    fetch('http://localhost:8000/api/settings/public_url')
      .then(r => r.json())
      .then(data => setPublicApiUrl(data.public_api_url))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!websiteUrl || !file) { toast.warning('Please provide a URL and ad media file.'); return; }
    if (!adName.trim()) { toast.warning('Please give your ad a name.'); return; }
    setLoading(true);

    const formData = new FormData();
    formData.append('website_url', websiteUrl);
    formData.append('file', file);
    formData.append('ad_name', adName);
    formData.append('click_url', clickUrl);

    try {
      const apiBase = 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${apiBase}/api/campaigns`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: formData
      });

      if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/auth');
        return;
      }

      if (res.ok) {
        toast.success('Campaign created successfully!');
        setWebsiteUrl(''); setAdName(''); setClickUrl(''); setFile(null);
        fetchCampaigns();
      } else {
        const err = await res.json();
        if (res.status === 403 && err.detail && err.detail.includes('Campaign limit')) {
          toast.warning('You have reached your free campaign limit. Please upgrade to Pro!');
          navigate('/subscription');
          return;
        }
        toast.error(err.detail || 'Failed to create campaign');
      }
    } catch (e) {
      toast.error('Error connecting to backend.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">

      {/* Campaign Form */}
      <div className="glass-card p-10 rounded-3xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accentBlue/10 blur-3xl rounded-full pointer-events-none group-hover:bg-accentBlue/20 transition-colors"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accentOrange/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-4xl font-black tracking-tight drop-shadow-xl text-white mb-2">
            Launch Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentOrange to-orange-400">Campaign</span>
          </h2>
          <p className="text-gray-400 font-medium">Input your destination URL, name your ad, and upload your creative to start tracking.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Target Website URL</label>
              <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-[#1A202C]/80 backdrop-blur border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-accentOrange text-white shadow-inner transition-colors"
                placeholder="https://example.com" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Ad Name</label>
              <input type="text" value={adName} onChange={(e) => setAdName(e.target.value)}
                className="w-full bg-[#1A202C]/80 backdrop-blur border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-accentOrange text-white shadow-inner transition-colors"
                placeholder="e.g. Summer Sale Banner" />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Ad Click-Through URL <span className="text-gray-600 normal-case">(where clicking the ad takes the user)</span></label>
            <input type="url" value={clickUrl} onChange={(e) => setClickUrl(e.target.value)}
              className="w-full bg-[#1A202C]/80 backdrop-blur border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-accentOrange text-white shadow-inner transition-colors"
              placeholder="https://your-product-page.com" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Upload Ad Media (Image/Video)</label>
            <div className="w-full bg-[#1A202C]/80 backdrop-blur border border-gray-700 rounded-xl px-4 py-4 focus-within:border-accentOrange shadow-inner transition-colors">
              <input type="file" onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-accentOrange/10 file:text-accentOrange hover:file:bg-accentOrange/20 transition-colors"
                accept="image/*,video/*" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-accentOrange to-orange-500 text-white font-bold py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(255,77,41,0.2)] hover:shadow-[0_0_30px_rgba(255,77,41,0.4)] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none">
            {loading ? 'UPLOADING...' : 'LAUNCH CAMPAIGN'}
          </button>
        </form>
      </div>

      {/* Integration Guide Section */}
      <div className="glass-card p-10 rounded-3xl border-l-4 border-accentBlue relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accentBlue/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accentBlue/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-accentBlue" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Integrate on Any Site</h3>
              <p className="text-gray-400 text-sm">Copy the snippet below to start tracking attention on your own website.</p>
            </div>
          </div>

          <div className="bg-black/40 rounded-2xl p-6 border border-white/5 font-mono text-sm relative group/code overflow-x-auto">
            <button 
              onClick={() => {
                const api = publicApiUrl;
                navigator.clipboard.writeText(`<script src="${api}/static/trace.js"></script>`);
                toast.success('Script copied to clipboard!');
              }}
              className="absolute top-4 right-4 bg-white/5 hover:bg-white/10 p-2 rounded-lg text-gray-400 transition-colors"
              title="Copy to clipboard"
            >
              <Database className="w-4 h-4" />
            </button>
            <p className="text-gray-500 mb-2 text-[10px] uppercase font-sans">Option A: Auto-Match (Based on Website URL)</p>
            <code className="text-accentBlue block mb-6">
              &lt;script <span className="text-blue-300">src</span>=<span className="text-orange-400">"{publicApiUrl}/static/trace.js"</span>&gt;&lt;/script&gt;
            </code>

            <p className="text-gray-500 mb-2 text-[10px] uppercase font-sans">Option B: Manual Targeting (Run Specific Campaign)</p>
            <code className="text-accentBlue block">
              &lt;script <span className="text-blue-300">src</span>=<span className="text-orange-400">"{publicApiUrl}/static/trace.js"</span> <span className="text-blue-300">data-campaign</span>=<span className="text-orange-400">"CAMPAIGN_ID"</span>&gt;&lt;/script&gt;
            </code>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-accentBlue font-black text-xs uppercase tracking-widest">Step 1</p>
              <p className="text-gray-400 text-xs leading-relaxed">Paste the script tag just before the closing &lt;/body&gt; tag of your website.</p>
            </div>
            <div className="space-y-2">
              <p className="text-accentBlue font-black text-xs uppercase tracking-widest">Step 2</p>
              <p className="text-gray-400 text-xs leading-relaxed">Ensure your campaign URL matches your website domain for auto-tracking.</p>
            </div>
            <div className="space-y-2">
              <p className="text-accentBlue font-black text-xs uppercase tracking-widest">Step 3</p>
              <p className="text-gray-400 text-xs leading-relaxed">Our AI will automatically detect, track, and report interaction data.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Running Campaigns */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white px-2">Currently Running</h3>
        {campaigns.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center border border-white/5">
            <p className="text-gray-400 text-lg mb-4">No running campaigns right now.</p>
            <p className="text-gray-500 text-sm">Add them above to start gathering real-time intelligence!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map(c => (
              <div key={c.id} className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-accentBlue/30 transition-colors">
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                    {c.ad_media && c.ad_media.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      <video src={`http://localhost:8000/${c.ad_media.replaceAll('\\','/')}`} className="w-full h-full object-cover opacity-70" />
                    ) : (
                      <img src={`http://localhost:8000/${c.ad_media.replaceAll('\\','/')}`} className="w-full h-full object-cover opacity-70" alt="ad" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-white font-bold truncate group-hover:text-accentBlue transition-colors">{c.ad_name || 'Unnamed Ad'}</p>
                    <p className="text-gray-500 text-sm truncate">{c.website_url}</p>
                    <p className="text-gray-600 text-xs flex items-center mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Active
                    </p>
                  </div>
                </div>
                <button onClick={() => navigate(`/simulator/${c.id}`)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ml-4">
                  Test Ad
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HeatmapCanvas({ data }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const h = data.length, w = data[0]?.length || 0;
    if (w === 0) return;
    canvas.width = w; canvas.height = h;
    const imgData = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = data[y][x] || 0;
        const i = (y * w + x) * 4;
        if (v < 0.25) { imgData.data[i]=0; imgData.data[i+1]=Math.floor(v*4*255); imgData.data[i+2]=255; }
        else if (v < 0.5) { imgData.data[i]=0; imgData.data[i+1]=255; imgData.data[i+2]=Math.floor((1-(v-0.25)*4)*255); }
        else if (v < 0.75) { imgData.data[i]=Math.floor((v-0.5)*4*255); imgData.data[i+1]=255; imgData.data[i+2]=0; }
        else { imgData.data[i]=255; imgData.data[i+1]=Math.floor((1-(v-0.75)*4)*255); imgData.data[i+2]=0; }
        imgData.data[i+3] = Math.floor(Math.max(30, v * 220));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [data]);
  return <canvas ref={canvasRef} className="w-full h-full rounded-xl" style={{ imageRendering: 'auto' }} />;
}

function Analytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/api/campaigns/me', {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      }
    }).then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setCampaigns(data);
        if (data.length > 0) handleSelectCampaign(data[0].id);
      }
    });
  }, []);

  const handleSelectCampaign = (id) => {
    setSelectedCampaign(id);
    setLoading(true);
    fetch(`${localStorage.getItem('public_api_url') || 'http://localhost:8000'}/api/analytics/${id}`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      }
    }).then(r => r.json()).then(data => { setAnalytics(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const selectedCamp = campaigns.find(c => c.id === selectedCampaign);
  const a = analytics || {};

  const emotionData = Object.entries(a.emotion_distribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value
  })).filter(d => d.value > 0);

  const EMOTION_COLORS = { Happy:'#22c55e', Neutral:'#94a3b8', Surprise:'#f59e0b', Sad:'#6366f1', Angry:'#ef4444', Fear:'#a855f7', Disgust:'#14b8a6' };
  const COLORS = emotionData.map(d => EMOTION_COLORS[d.name] || '#FF4D29');

  const scoreColor = (a.avg_engagement_score || 0) >= 70 ? 'text-green-400' :
    (a.avg_engagement_score || 0) >= 40 ? 'text-yellow-400' : 'text-red-400';

  const StatCard = ({ label, value, sub, color = 'text-accentOrange' }) => (
    <div className="glass-card p-5 rounded-2xl text-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <p className={`text-3xl font-black ${color} relative z-10`}>{value}</p>
      <p className="text-gray-400 text-xs uppercase tracking-widest mt-1 relative z-10">{label}</p>
      {sub && <p className="text-gray-600 text-[10px] mt-1 relative z-10">{sub}</p>}
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto pb-20">
      <div className="text-center pt-6 mb-8">
        <h1 className="text-4xl lg:text-5xl font-black mb-3 tracking-tight text-white">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentBlue to-blue-400">Ad Analytics</span> Dashboard
        </h1>
        <p className="text-gray-400 font-medium">Aggregated average insights across all user sessions</p>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">No Campaigns Found</h2>
          <p className="text-gray-400 mb-8">Deploy a campaign first to view analytics.</p>
          <button onClick={() => navigate('/dashboard/campaigns')}
            className="bg-gradient-to-r from-accentOrange to-orange-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            CREATE CAMPAIGN
          </button>
        </div>
      ) : (
        <>
          {/* Campaign Selector */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-[#1A202C]/80 backdrop-blur border border-white/5 p-4 rounded-2xl gap-4">
            <div className="flex items-center space-x-4 w-full md:w-auto relative">
              <label className="text-gray-400 text-sm font-bold uppercase tracking-widest whitespace-nowrap">Campaign:</label>
              <div className="relative group w-full md:w-96">
                <select 
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl focus:outline-none border border-white/10 focus:border-accentBlue/50 transition-all cursor-pointer appearance-none shadow-inner"
                  value={selectedCampaign || ''} 
                  onChange={(e) => handleSelectCampaign(e.target.value)}
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#111620] text-white">
                      {c.ad_name || 'Unnamed Ad'} — {c.website_url}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
            {selectedCampaign && (
              <div className="flex gap-3">
                <button onClick={() => navigate(`/simulator/${selectedCampaign}`)}
                  className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 px-5 py-2 rounded-xl text-sm font-bold transition-all">
                  ▶ TEST AD
                </button>
                <a href={`http://localhost:8000/api/analytics/${selectedCampaign}/report?token=${localStorage.getItem('token')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-400 px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> 📥 DOWNLOAD FULL REPORT
                </a>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20"><div className="w-12 h-12 border-4 border-accentOrange border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : a.total_sessions === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center">
              <h2 className="text-xl font-bold text-gray-300 mb-3">No Sessions Yet</h2>
              <p className="text-gray-500">Test the ad using the simulator or wait for real user interactions.</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Total Sessions" value={a.total_sessions} />
                <StatCard label="Engagement Score" value={`${a.avg_engagement_score}/100`} color={scoreColor} />
                <StatCard label="Avg Time" value={`${a.avg_time_spent}s`} color="text-blue-400" />
                <StatCard label="Avg Clicks" value={a.avg_clicks} color="text-purple-400" />
                <StatCard label="Face Detection" value={`${a.total_face_detected_pct}%`} color="text-cyan-400" sub="Webcam accuracy" />
                <StatCard label="Active Time" value={`${a.avg_active_pct}%`} color="text-green-400" sub={`Idle: ${a.avg_idle_pct}%`} />
              </div>

              {/* Report Card */}
              <div className="glass-card p-6 rounded-2xl border-l-4 border-accentOrange">
                <h3 className="text-lg font-bold text-white mb-3">📊 Campaign Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 uppercase tracking-widest text-[10px] mb-1">Overall Engagement</p>
                    <p className={`text-2xl font-black ${scoreColor}`}>{a.avg_engagement_score} <span className="text-gray-500 text-sm">/ 100</span></p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase tracking-widest text-[10px] mb-1">Peak Attention</p>
                    <p className="text-2xl font-black text-green-400">{a.peak_attention_second}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase tracking-widest text-[10px] mb-1">Lowest Attention</p>
                    <p className="text-2xl font-black text-red-400">{a.lowest_attention_second}</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                    <span className="text-accentOrange font-bold not-italic">PRO INSIGHTS:</span> 
                    Peak attention indicates the moment users were most emotionally engaged and focused on the ad. 
                    Lowest attention often occurs during transitions or if content loses momentum. 
                    Aim for "Consistent" results for maximum brand recall.
                  </p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Engagement Timeline */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-lg font-bold mb-4 text-gray-300">Engagement Over Time</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={a.engagement_timeline || []}>
                        <defs>
                          <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF4D29" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#FF4D29" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="second" stroke="#888" label={{ value: 'Seconds', position: 'insideBottom', offset: -5, fill: '#888' }} />
                        <YAxis stroke="#888" domain={[0, 100]} label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#888' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #333', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="score" stroke="#FF4D29" strokeWidth={2} fill="url(#engGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Emotion Distribution */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-lg font-bold mb-4 text-gray-300">Emotion Distribution</h3>
                  <div className="h-64 flex items-center">
                    {emotionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={emotionData} innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                            {emotionData.map((entry, i) => <Cell key={i} fill={COLORS[i]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: 'none', borderRadius: '8px' }} formatter={(v) => `${v}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center w-full">No emotion data yet</p>
                    )}
                  </div>
                </div>

                {/* Attention Heatmap */}
                <div className="glass-card p-6 rounded-2xl md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-300">Attention Heatmap</h3>
                    <span className="text-gray-600 text-xs">Aggregated gaze + mouse data</span>
                  </div>
                    <div className="h-80 bg-[#0A0D14] rounded-xl overflow-hidden border border-white/5 relative">
                      {a.heatmap_data && a.heatmap_data.length > 0 ? (
                        <HeatmapCanvas data={a.heatmap_data} />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-600">No heatmap data — interact with the ad to generate</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Heatmap Legend */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]"></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[2px]">Low Attention</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[2px]">Medium</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]"></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[2px]">High</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[2px]">Extreme focus</span>
                      </div>
                    </div>
                </div>
              </div>

            </>
          )}
        </>
      )}
    </div>
  );
}

function CampaignHistory() {
  const [campaigns, setCampaigns] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchCampaigns = () => {
    fetch(`${localStorage.getItem('public_api_url') || 'http://localhost:8000'}/api/campaigns/me`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCampaigns(data);
      });
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will permanently delete this campaign and all its analytics data.')) return;
    setDeleting(id);
    try {
      const apiBase = localStorage.getItem('public_api_url') || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        toast.success('Campaign deleted successfully.');
        fetchCampaigns();
      } else {
        toast.error('Failed to delete campaign.');
      }
    } catch (e) {
      toast.error('Error deleting campaign.');
    }
    setDeleting(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center relative z-10 pt-6">
        <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight text-white drop-shadow-xl">
          See your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-accentBlue">Running Campaigns</span>
        </h1>
        <p className="text-gray-400 font-medium max-w-2xl mx-auto">Monitor your active ad deployments and review historical performance data across all tracked properties.</p>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center max-w-2xl mx-auto relative overflow-hidden group mt-12">
          <div className="absolute inset-0 bg-gradient-to-tr from-accentOrange/10 to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4">No Campaigns Running</h2>
            <p className="text-gray-400 mb-8">Deploy an ad campaign to start tracking interaction history.</p>
            <button onClick={() => navigate('/dashboard/campaigns')}
              className="bg-gradient-to-r from-accentOrange to-orange-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,77,41,0.3)] hover:shadow-[0_0_30px_rgba(255,77,41,0.5)] transform hover:-translate-y-1 inline-flex items-center">
              CREATE CAMPAIGN - LET'S START
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {campaigns.map(c => (
            <div key={c.id} className="glass-card p-6 rounded-3xl hover:-translate-y-2 transition-transform duration-300 group border border-white/5 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-accentBlue/20 blur-3xl rounded-full group-hover:bg-accentBlue/40 transition-colors"></div>

              <div className="flex flex-col h-full relative z-10">
                <div className="w-full h-40 bg-gray-900 rounded-xl overflow-hidden mb-6 border border-gray-800">
                  {c.ad_media && c.ad_media.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                    <video src={`http://localhost:8000/${c.ad_media.replaceAll('\\','/')}`} className="w-full h-full object-cover opacity-80" autoPlay loop muted playsInline />
                  ) : (
                    <img src={`http://localhost:8000/${c.ad_media ? c.ad_media.replaceAll('\\','/') : ''}`} className="w-full h-full object-cover opacity-80" alt="ad" />
                  )}
                </div>

                <div className="flex-grow">
                  <p className="text-xs text-accentBlue font-bold uppercase tracking-widest mb-2 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Active
                  </p>
                  <h3 className="text-xl font-bold text-white mb-1 truncate">{c.ad_name || 'Unnamed Ad'}</h3>
                  <p className="text-gray-500 text-sm truncate">{c.website_url}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center gap-2">
                  <button onClick={() => navigate('/dashboard/analytics')}
                    className="flex-grow text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    View Analytics →
                  </button>
                  <a href={`${localStorage.getItem('public_api_url') || 'http://localhost:8000'}/api/analytics/${c.id}/report?token=${localStorage.getItem('token')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/50 px-3 py-2 rounded-lg transition-all"
                    title="Download Report">
                    📥
                  </a>
                  <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                    className="text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                    {deleting === c.id ? 'Deleting...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



function Dashboard() {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!localStorage.getItem('user_id')) navigate('/auth');
  }, [navigate]);

  return (
    <div className="px-12 py-10 min-h-[80vh] flex flex-col gap-10">
      <Routes>
        <Route path="/" element={<Analytics />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/campaigns" element={<CampaignSetup />} />
        <Route path="/history" element={<CampaignHistory />} />
      </Routes>
    </div>
  );
}

export default Dashboard;
