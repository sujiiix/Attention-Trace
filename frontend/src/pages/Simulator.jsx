import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { API_BASE_URL } from '../config';

function Simulator() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState(null);
  const [showAd, setShowAd] = useState(false);
  const [showDismiss, setShowDismiss] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const [emotion, setEmotion] = useState('Neutral');
  const toast = useToast();
  
  // Tracking data
  const heatmapData = useRef([]);
  const clicks = useRef(0);
  const startTime = useRef(Date.now());
  const emotionTimeline = useRef([]);
  const gazeTimeline = useRef([]);
  const mouseVelocities = useRef([]);
  const lastMousePos = useRef(null);
  const faceDetectedCount = useRef(0);
  const frameCount = useRef(0);
  const gazeOnAdCount = useRef(0);
  const idleTime = useRef(0);
  const idleStart = useRef(0);
  const isIdle = useRef(false);
  const idleTimerRef = useRef(null);
  const lastSecond = useRef(-1);

  const resetIdleTimer = useCallback(() => {
    if (isIdle.current) { idleTime.current += (Date.now() - idleStart.current) / 1000; isIdle.current = false; }
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => { isIdle.current = true; idleStart.current = Date.now(); }, 3000);
  }, []);

  // ---- WEBCAM: start only when ad is visible ----
  const startWebcam = useCallback(() => {
    try {
      const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
      const wsHost = API_BASE_URL.replace(/^https?:\/\//, '');
      wsRef.current = new WebSocket(`${wsProtocol}://${wsHost}/ws/emotion`);
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          frameCount.current++;
          if (data.face_detected) faceDetectedCount.current++;
          if (data.on_ad) gazeOnAdCount.current++;
          setEmotion(data.emotion || 'neutral');

          const sec = Math.floor((Date.now() - startTime.current) / 1000);
          if (sec !== lastSecond.current) {
            lastSecond.current = sec;
            emotionTimeline.current.push({ second: sec, emotion: data.emotion, scores: data.emotion_scores || {} });
            gazeTimeline.current.push({ second: sec, gaze_x: data.gaze_x, gaze_y: data.gaze_y, on_ad: data.on_ad, face_detected: data.face_detected });
          }
        } catch (e) {
          setEmotion(event.data);
        }
      };
      wsRef.current.onerror = () => console.log('WebSocket error');
    } catch (e) {}

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setWebcamActive(true);

        intervalRef.current = setInterval(() => {
          if (videoRef.current && canvasRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);
            wsRef.current.send(canvasRef.current.toDataURL('image/jpeg', 0.5));
          }
        }, 500);
      })
      .catch(() => console.log('Webcam not available'));
  }, []);

  const stopWebcam = useCallback(() => {
    if (isIdle.current) { idleTime.current += (Date.now() - idleStart.current) / 1000; isIdle.current = false; }
    clearTimeout(idleTimerRef.current);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setWebcamActive(false);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/campaign/${campaignId}/media`)
      .then(r => {
        if (!r.ok) throw new Error('Campaign not found');
        return r.json();
      })
      .then(data => setCampaign(data))
      .catch(e => {
        console.error(e);
        setError('Failed to load campaign. Make sure the backend is running.');
      });

    const adTimer = setTimeout(() => setShowAd(true), 3000);
    const dismissTimer = setTimeout(() => setShowDismiss(true), 13000); // 3s + 10s

    return () => {
      clearTimeout(adTimer);
      clearTimeout(dismissTimer);
      stopWebcam();
    };
  }, [campaignId, stopWebcam]);

  // ---- Start/stop webcam based on ad visibility ----
  useEffect(() => {
    if (showAd) {
      startWebcam();
    }
  }, [showAd, startWebcam]);

  const handleMouseMove = (e) => {
    resetIdleTimer();
    const now = Date.now();
    heatmapData.current.push({ x: e.clientX, y: e.clientY, t: now - startTime.current });

    if (lastMousePos.current) {
      const dt = (now - lastMousePos.current.t) / 1000;
      if (dt > 0) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        mouseVelocities.current.push(Math.sqrt(dx * dx + dy * dy) / dt);
      }
    }
    lastMousePos.current = { x: e.clientX, y: e.clientY, t: now };
  };

  const handleDismiss = async () => {
    stopWebcam();
    setShowAd(false);
    setShowDismiss(false);

    const timeSpent = (Date.now() - startTime.current) / 1000;
    const faceDetectedPct = frameCount.current > 0 ? (faceDetectedCount.current / frameCount.current) * 100 : 0;
    const gazeOnAdPct = frameCount.current > 0 ? (gazeOnAdCount.current / frameCount.current) * 100 : 0;
    const avgVelocity = mouseVelocities.current.length > 0 ? mouseVelocities.current.reduce((a, b) => a + b) / mouseVelocities.current.length : 0;
    const activeTime = Math.max(0, timeSpent - idleTime.current);

    try {
      await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          time_spent: parseFloat(timeSpent.toFixed(2)),
          clicks: clicks.current,
          avg_emotion: emotion,
          heatmap_data: JSON.stringify(heatmapData.current),
          emotion_timeline: emotionTimeline.current,
          gaze_timeline: gazeTimeline.current,
          mouse_velocity_avg: parseFloat(avgVelocity.toFixed(2)),
          idle_time: parseFloat(idleTime.current.toFixed(2)),
          active_time: parseFloat(activeTime.toFixed(2)),
          face_detected_pct: parseFloat(faceDetectedPct.toFixed(1)),
          gaze_on_ad_pct: parseFloat(gazeOnAdPct.toFixed(1))
        })
      });
      toast.success('Session saved! Next ad in 3 minutes.');
    } catch (e) {
      toast.error('Failed to save session.');
    }

    // Reset for next cycle
    heatmapData.current = []; clicks.current = 0; emotionTimeline.current = [];
    gazeTimeline.current = []; mouseVelocities.current = []; lastMousePos.current = null;
    faceDetectedCount.current = 0; frameCount.current = 0; gazeOnAdCount.current = 0;
    idleTime.current = 0; lastSecond.current = -1;
    startTime.current = Date.now();

    setTimeout(() => {
      setShowAd(true);
      setTimeout(() => setShowDismiss(true), 10000);
    }, 180000);
  };

  if (error) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="glass-card p-12 rounded-3xl text-center max-w-lg">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={() => navigate('/dashboard/campaigns')} className="bg-gradient-to-r from-accentOrange to-orange-500 text-white px-6 py-3 rounded-xl font-bold">
          Back to Campaigns
        </button>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accentOrange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 text-lg">Loading Simulator...</p>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-[90vh] overflow-hidden" onMouseMove={handleMouseMove} onClick={() => clicks.current++}>
      {/* Target Website Iframe — ?simulator=1 prevents demo site from showing its own ad */}
      <iframe src={`${campaign.website_url}${campaign.website_url.includes('?') ? '&' : '?'}simulator=1`} className="w-full h-full border-none" title="Target Site" />

      {/* Back button */}
      <button onClick={() => { stopWebcam(); navigate('/dashboard/campaigns'); }}
        className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-gray-700 text-sm font-semibold hover:bg-black/90 transition-colors z-40">
        ← Back to Dashboard
      </button>

      {/* Hidden Webcam for processing — only active when ad is showing */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} width="320" height="240" className="hidden" />



      {/* Ad Modal */}
      {showAd && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-xl shadow-2xl z-50 max-w-2xl w-[90%]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[3px] mb-2">Sponsored Ad</p>
          <a href={campaign.click_url || '#'} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
            {campaign.media_url.startsWith('data:video') ? (
              <video src={campaign.media_url} autoPlay loop muted className="w-full h-auto rounded" />
            ) : (
              <img src={campaign.media_url} alt="Ad" className="w-full h-auto rounded hover:opacity-90 transition-opacity" />
            )}
          </a>

          <div className="mt-2 text-center">
            <p className="text-sm font-bold text-gray-800">{campaign.ad_name || 'Campaign'}</p>
            <p className="text-xs text-gray-500">{campaign.website_url}</p>
          </div>
          
          {showDismiss && (
            <div className="mt-4 flex justify-end">
              <button onClick={handleDismiss} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-bold transition-colors">
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Simulator;
