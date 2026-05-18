(function() {
    console.log("%c🚀 Attention Trace: Intelligence script detected!", "color: #FF4D29; font-weight: bold; font-size: 14px;");
    
    // Debug helper for mobile - Initialize immediately
    const isDebug = new URLSearchParams(window.location.search).has('at_debug');
    if (isDebug) {
        const log = document.createElement('div');
        log.id = 'at-debug-log';
        log.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(255,77,41,0.95);color:white;font-family:monospace;font-size:12px;padding:10px;z-index:1000000;max-height:150px;overflow-y:auto;border-top:2px solid white;box-shadow:0 -10px 30px rgba(0,0,0,0.5);';
        log.innerText = "ATTENTION TRACE DEBUGGER V2 ONLINE\n";
        document.documentElement.appendChild(log); // Use documentElement to show immediately
    }

    function atDebug(msg, color = "white") {
        console.log(`Attention Trace: ${msg}`);
        if (isDebug) {
            const log = document.getElementById('at-debug-log');
            if (log) {
                const line = document.createElement('div');
                line.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                line.style.padding = '2px 0';
                line.style.color = color;
                line.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
                log.appendChild(line);
                log.scrollTop = log.scrollHeight;
            }
        }
    }

    window.onerror = function(msg, url, lineNo, columnNo, error) {
        atDebug(`FATAL ERROR: ${msg} at line ${lineNo}`, "#ff0000");
        return false;
    };

    atDebug("Script started execution...");
    
    // Detect API URL from the script source
    let scriptSrc = 'http://localhost:8000/static/trace.js';
    if (document.currentScript && document.currentScript.src) {
        scriptSrc = document.currentScript.src;
    } else {
        const scripts = document.getElementsByTagName('script');
        for (let s of scripts) {
            if (s.src && s.src.includes('trace.js')) {
                scriptSrc = s.src;
                break;
            }
        }
    }
    const AT_API = new URL(scriptSrc).origin;
    atDebug(`Connecting to API at ${AT_API}`);
    
    let atWebcamStream = null, atWebSocket = null, atFrameInterval = null, atCurrentCampaign = null;

    // Session tracking data
    let atSessionStart = 0;
    let atClicks = 0;
    let atHeatmap = [];
    let atEmotionTimeline = [];
    let atGazeTimeline = [];
    let atLastEmotion = 'neutral';
    let atFrameCount = 0;
    let atFaceDetectedCount = 0;
    let atGazeOnAdCount = 0;
    let atLastMousePos = null;
    let atMouseVelocities = [];
    let atIdleTimer = null;
    let atIdleTime = 0;
    let atIdleStart = 0;
    let atIsIdle = false;
    let atTabHiddenTime = 0;
    let atTabHiddenStart = 0;
    let atHoverZones = {};
    let atLastSecond = -1;

    // Tab visibility tracking
    // Session cleanup on tab close
    window.addEventListener('beforeunload', () => {
        if (atCurrentCampaign && atSessionStart > 0) {
            saveSession(atCurrentCampaign.id, true);
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (atSessionStart === 0) return;
        if (document.hidden) {
            atTabHiddenStart = Date.now();
        } else if (atTabHiddenStart > 0) {
            atTabHiddenTime += (Date.now() - atTabHiddenStart) / 1000;
            atTabHiddenStart = 0;
        }
    });

    async function loadAttentionTraceAd() {
        // Skip if in simulator mode
        if (new URLSearchParams(window.location.search).has('simulator')) return;
        
        try {
            // Check if a specific campaign ID is provided in the script tag
            const scriptTag = document.currentScript;
            const targetCampaignId = scriptTag ? scriptTag.getAttribute('data-campaign') : null;

            const res = await fetch(`${AT_API}/api/campaigns/active`, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            if (!res.ok) return;
            const campaigns = await res.json();
            if (!campaigns || campaigns.length === 0) return;

            if (targetCampaignId) {
                // If ID is specified, only run that one
                atCurrentCampaign = campaigns.find(c => c.id === targetCampaignId);
            } else {
                // If no ID, try to match by URL (No fallback)
                const currentUrl = window.location.href;
                atCurrentCampaign = campaigns.find(c => {
                    const cleanUrl = c.website_url.replace(/https?:\/\//, '').replace(/\/$/, '');
                    return currentUrl.includes(cleanUrl);
                });
            }

            if (!atCurrentCampaign) {
                atDebug("No matching campaign found for this site.", "#ef4444");
                atDebug(`Current URL: ${window.location.href}`);
                atDebug(`Looking for: ${campaigns.map(c => c.website_url).join(', ')}`);
                return;
            }
            
            atDebug("Match found! Preparing ad in 3s...", "#22c55e");
            
            // Show ad after 3 seconds
            setTimeout(() => showAdOverlay(atCurrentCampaign), 3000);
        } catch (e) {
            console.warn('Attention Trace: Intelligence backend unavailable.');
        }
    }

    function scheduleNextAd() {
        // Show every 3 minutes (180,000ms) as per user requirement
        setTimeout(() => { if (atCurrentCampaign) showAdOverlay(atCurrentCampaign); }, 180000);
    }

    function resetIdleTimer() {
        if (atIsIdle) { atIdleTime += (Date.now() - atIdleStart) / 1000; atIsIdle = false; }
        clearTimeout(atIdleTimer);
        atIdleTimer = setTimeout(() => { atIsIdle = true; atIdleStart = Date.now(); }, 3000);
    }

    function startTracking() {
        const video = document.createElement('video');
        video.width = 320; video.height = 240;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;';
        document.body.appendChild(video);
        
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 240; 
        canvas.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;';
        document.body.appendChild(canvas);

        const wsUrl = AT_API.replace('http', 'ws') + '/ws/emotion';
        try {
            atWebSocket = new WebSocket(wsUrl);
            atWebSocket.onmessage = (evt) => {
                try {
                    const data = JSON.parse(evt.data);
                    atFrameCount++;
                    if (data.face_detected) atFaceDetectedCount++;
                    if (data.on_ad) atGazeOnAdCount++;
                    atLastEmotion = data.emotion || 'neutral';

                    const sec = Math.floor((Date.now() - atSessionStart) / 1000);
                    if (sec !== atLastSecond) {
                        atLastSecond = sec;
                        atEmotionTimeline.push({ second: sec, emotion: data.emotion, scores: data.emotion_scores || {} });
                        atGazeTimeline.push({ second: sec, gaze_x: data.gaze_x, gaze_y: data.gaze_y, on_ad: data.on_ad, face_detected: data.face_detected });
                    }
                } catch (e) { atLastEmotion = evt.data; }
            };
        } catch(e) {}

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } })
            .then(stream => {
                atWebcamStream = stream; video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play().catch(() => {});
                    atFrameInterval = setInterval(() => {
                        if (atWebSocket && atWebSocket.readyState === WebSocket.OPEN && video.readyState >= 2) {
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(video, 0, 0, 320, 240);
                            atWebSocket.send(canvas.toDataURL('image/jpeg', 0.5));
                        }
                    }, 500);
                };
            }).catch((err) => {
                atDebug(`Webcam denied: ${err.message}`, '#ef4444');
                console.warn('Attention Trace: Webcam access denied. Falling back to behavioral-only tracking.');
            });
    }

    function stopTracking() {
        if (atIsIdle) { atIdleTime += (Date.now() - atIdleStart) / 1000; atIsIdle = false; }
        clearTimeout(atIdleTimer);
        if (atFrameInterval) { clearInterval(atFrameInterval); atFrameInterval = null; }
        if (atWebSocket) { atWebSocket.close(); atWebSocket = null; }
        if (atWebcamStream) { atWebcamStream.getTracks().forEach(t => t.stop()); atWebcamStream = null; }
    }

    async function saveSession(campaignId, isClosing = false) {
        const timeSpent = (Date.now() - atSessionStart) / 1000;
        const counts = {};
        atEmotionTimeline.forEach(e => { const em = e.emotion || 'neutral'; counts[em] = (counts[em] || 0) + 1; });
        const avgEmotion = Object.keys(counts).length > 0 ? Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) : 'neutral';
        
        const faceDetectedPct = atFrameCount > 0 ? (atFaceDetectedCount / atFrameCount) * 100 : 0;
        const gazeOnAdPct = atFrameCount > 0 ? (atGazeOnAdCount / atFrameCount) * 100 : 0;
        const avgVelocity = atMouseVelocities.length > 0 ? atMouseVelocities.reduce((a, b) => a + b) / atMouseVelocities.length : 0;
        const activeTime = Math.max(0, timeSpent - atIdleTime - atTabHiddenTime);

        const data = {
            campaign_id: campaignId,
            time_spent: parseFloat(timeSpent.toFixed(2)),
            clicks: atClicks,
            avg_emotion: avgEmotion,
            heatmap_data: JSON.stringify(atHeatmap),
            emotion_timeline: atEmotionTimeline,
            gaze_timeline: atGazeTimeline,
            hover_zones: atHoverZones,
            mouse_velocity_avg: parseFloat(avgVelocity.toFixed(2)),
            idle_time: parseFloat(atIdleTime.toFixed(2)),
            active_time: parseFloat(activeTime.toFixed(2)),
            tab_hidden_time: parseFloat(atTabHiddenTime.toFixed(2)),
            face_detected_pct: parseFloat(faceDetectedPct.toFixed(1)),
            gaze_on_ad_pct: parseFloat(gazeOnAdPct.toFixed(1))
        };

        try {
            // Using keepalive allows the request to finish even if the page is closed
            await fetch(`${AT_API}/api/sessions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(data),
                keepalive: true
            });
        } catch (e) {}
    }

    function closeAd(backdrop, modal) {
        if (atCurrentCampaign && atSessionStart > 0) {
            saveSession(atCurrentCampaign.id);
            atSessionStart = 0; // Prevent duplicate save on tab close
        }
        stopTracking();
        backdrop.remove();
        modal.remove();
        scheduleNextAd();
    }

    async function showAdOverlay(campaign) {
        atSessionStart = Date.now();
        atClicks = 0; atHeatmap = []; atEmotionTimeline = []; atGazeTimeline = [];
        atFaceDetectedCount = 0; atFrameCount = 0; atGazeOnAdCount = 0;
        atMouseVelocities = []; atIdleTime = 0; atTabHiddenTime = 0;
        atHoverZones = {}; atLastSecond = -1; atLastMousePos = null;

        const backdrop = document.createElement('div');
        backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;opacity:0;transition:opacity 0.4s ease-out;';
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.8);opacity:0;z-index:9999;background:white;border-radius:24px;padding:24px;box-shadow:0 30px 100px rgba(0,0,0,0.5);max-width:650px;width:95%;max-height:90vh;display:flex;flex-direction:column;transition:all 0.4s cubic-bezier(0.16, 1, 0.3, 1);';

        modal.addEventListener('click', () => { atClicks++; resetIdleTimer(); });
        modal.addEventListener('mousemove', (e) => {
            resetIdleTimer();
            const now = Date.now();
            const rect = modal.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;
            atHeatmap.push({ x: relX, y: relY, t: now - atSessionStart });
            if (atLastMousePos) {
                const dt = (now - atLastMousePos.t) / 1000;
                if (dt > 0) {
                    const dx = e.clientX - atLastMousePos.x;
                    const dy = e.clientY - atLastMousePos.y;
                    atMouseVelocities.push(Math.sqrt(dx * dx + dy * dy) / dt);
                }
            }
            atLastMousePos = { x: e.clientX, y: e.clientY, t: now };
            const zoneX = Math.min(3, Math.floor((relX / rect.width) * 4));
            const zoneY = Math.min(3, Math.floor((relY / rect.height) * 4));
            atHoverZones[`${zoneX}_${zoneY}`] = (atHoverZones[`${zoneX}_${zoneY}`] || 0) + 1;
        });

        // Fetch media: images use Blob to bypass ngrok, videos use direct URL for streaming speed
        let mediaHtml = '<p style="color:#999;font-size:12px;">Loading media...</p>';
        try {
            let cleanMediaUrl = campaign.media_url.replace(/https?:\/\/localhost:8000/g, '').replace(/https?:\/\/127\.0\.0\.1:8000/g, '');
            const mediaUrl = (AT_API + cleanMediaUrl).replace(/([^:])\/\//g, '$1/');
            
            if (campaign.media_type === 'video') {
                atDebug(`Video loading via streaming URL`);
                mediaHtml = `
                    <video id="at-ad-video" src="${mediaUrl}" autoplay loop playsinline style="width:100%;max-height:60vh;border-radius:16px;display:block;box-shadow:0 10px 30px rgba(0,0,0,0.2);object-fit:contain;background:black;"></video>
                    <div id="at-audio-notice" style="display:none;margin-top:8px;font-size:10px;color:#ef4444;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Click anywhere to enable sound</div>
                `;
            } else {
                const mediaRes = await fetch(mediaUrl, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                if (mediaRes.ok) {
                    const blob = await mediaRes.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    atDebug(`Image loaded via Blob`);
                    mediaHtml = `<img src="${objectUrl}" style="width:100%;max-height:60vh;border-radius:16px;display:block;object-fit:contain;background:#f8f8f8;">`;
                } else {
                    mediaHtml = `<img src="${mediaUrl}" style="width:100%;max-height:60vh;border-radius:16px;display:block;object-fit:contain;background:#f8f8f8;">`;
                }
            }
        } catch(mediaErr) {
            atDebug(`Media load failed: ${mediaErr.message}`, '#ef4444');
        }

        const content = `
            <div style="margin-bottom:10px;"><span style="font-size:11px;font-weight:700;color:#999;letter-spacing:2px;text-transform:uppercase;">Sponsored Ad</span></div>
            <a href="${campaign.click_url || '#'}" target="_blank" rel="noopener noreferrer" style="display:block;cursor:pointer;">
                ${mediaHtml}
            </a>
            <div style="margin-top:10px; text-align:center;">
                <p style="margin:0; font-size:14px; font-weight:700; color:#333;">${campaign.ad_name || 'Campaign'}</p>
            </div>
            <button id="at-dismiss-btn" style="display:none;margin-top:12px;width:100%;padding:10px;border:none;background:#ef4444;color:white;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;">Dismiss</button>
        `;
        modal.innerHTML = content;
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);

        // Animate in
        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%,-50%) scale(1)';

            // Handle browser autoplay policy (videos with sound usually require user interaction)
            const video = document.getElementById('at-ad-video');
            const audioNotice = document.getElementById('at-audio-notice');
            if (video) {
                video.play().catch(() => {
                    atDebug("Autoplay with sound blocked. Waiting for interaction.");
                    if (audioNotice) audioNotice.style.display = 'block';
                    const enableAudio = () => {
                        video.play();
                        video.muted = false;
                        if (audioNotice) audioNotice.style.display = 'none';
                        window.removeEventListener('click', enableAudio);
                    };
                    window.addEventListener('click', enableAudio);
                });
            }
        });

        const closeBtn = modal.querySelector('#at-dismiss-btn');
        closeBtn.onclick = (e) => { e.stopPropagation(); closeAd(backdrop, modal); };
        setTimeout(() => { closeBtn.style.display = 'block'; }, 10000);

        startTracking();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAttentionTraceAd);
    } else {
        loadAttentionTraceAd();
    }
})();
