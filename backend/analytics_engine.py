"""
Analytics Engine for Attention Trace
Computes aggregated, averaged analytics across all sessions for a campaign.
"""
import numpy as np
from scipy.ndimage import gaussian_filter
import json
import io
import base64

def compute_emotion_distribution(sessions):
    """Aggregate emotion data across all sessions into percentage distribution."""
    emotion_counts = {}
    total = 0
    for s in sessions:
        # Use emotion_timeline if available, else fall back to avg_emotion
        timeline = s.get('emotion_timeline', [])
        if timeline and isinstance(timeline, list):
            for entry in timeline:
                em = entry.get('emotion', 'neutral') if isinstance(entry, dict) else str(entry)
                emotion_counts[em] = emotion_counts.get(em, 0) + 1
                total += 1
        else:
            em = s.get('avg_emotion', 'neutral')
            emotion_counts[em] = emotion_counts.get(em, 0) + 1
            total += 1

    if total == 0:
        return {}
    return {k: round((v / total) * 100, 2) for k, v in emotion_counts.items()}


def compute_engagement_score(sessions):
    """
    Adaptive engagement score (0–100).
    Webcam signals get 60% weight when available, behavioral gets 40%.
    When webcam is unavailable, behavioral scales to 100%.
    """
    if not sessions:
        return 0

    scores = []
    for s in sessions:
        webcam_available = s.get('face_detected_pct', 0) > 20  # at least 20% face detection
        
        # --- Behavioral score (always available) ---
        time_spent = s.get('time_spent', 0)
        clicks = s.get('clicks', 0)
        idle_time = s.get('idle_time', 0)
        active_time = s.get('active_time', time_spent)
        mouse_velocity = s.get('mouse_velocity_avg', 0)

        # Dwell factor: 10s = 30, 30s = 70, 60s+ = 100
        dwell_score = min(100, (time_spent / 60) * 100) if time_spent > 0 else 0

        # Click factor: each click adds 15 points (capped at 60)
        click_score = min(60, clicks * 15)

        # Activity factor: high active_time vs idle = good
        activity_ratio = (active_time / time_spent * 100) if time_spent > 0 else 50
        
        # Mouse engagement: moderate velocity is best (not too fast, not zero)
        mouse_score = min(100, mouse_velocity / 3) if mouse_velocity > 0 else 20

        behavioral_score = (dwell_score * 0.3 + click_score * 0.25 + activity_ratio * 0.25 + mouse_score * 0.2)

        if webcam_available:
            # --- Webcam score ---
            emotion_timeline = s.get('emotion_timeline', [])
            gaze_on_ad_pct = s.get('gaze_on_ad_pct', 50)

            # Emotion positivity (happy, surprise = positive)
            positive_emotions = {'happy', 'surprise'}
            negative_emotions = {'angry', 'disgust', 'sad', 'fear'}
            pos_count = 0
            neg_count = 0
            for entry in emotion_timeline:
                em = entry.get('emotion', 'neutral') if isinstance(entry, dict) else str(entry)
                if em in positive_emotions:
                    pos_count += 1
                elif em in negative_emotions:
                    neg_count += 1
            total_em = len(emotion_timeline) if emotion_timeline else 1
            emotion_score = ((pos_count / total_em) * 100) - ((neg_count / total_em) * 30)
            emotion_score = max(0, min(100, emotion_score + 50))  # center at 50

            # Gaze score
            gaze_score = min(100, gaze_on_ad_pct)

            webcam_score = emotion_score * 0.5 + gaze_score * 0.5
            final_score = webcam_score * 0.6 + behavioral_score * 0.4
        else:
            # No webcam — behavioral is 100%
            final_score = behavioral_score

        scores.append(min(100, max(0, final_score)))

    return round(sum(scores) / len(scores), 1) if scores else 0


def generate_heatmap_data(sessions, width=600, height=400):
    """
    Generate a 2D heatmap from aggregated gaze + mouse coordinate data.
    Returns a 2D array suitable for rendering as a heatmap.
    """
    all_points = []

    for s in sessions:
        # Gaze data (from webcam) - Higher weight for accuracy
        gaze_timeline = s.get('gaze_timeline', [])
        for entry in gaze_timeline:
            if isinstance(entry, dict) and entry.get('gaze_x') is not None:
                x = entry.get('gaze_x', 0.5) * width
                y = entry.get('gaze_y', 0.5) * height
                # Add gaze points with higher weight
                for _ in range(5):
                    all_points.append((x, y))

        # Mouse heatmap data
        heatmap_raw = s.get('heatmap_data', '[]')
        if isinstance(heatmap_raw, str):
            try: mouse_data = json.loads(heatmap_raw)
            except: mouse_data = []
        else:
            mouse_data = heatmap_raw

        for pt in mouse_data:
            if isinstance(pt, dict):
                x = min(width - 1, max(0, pt.get('x', 0) % width))
                y = min(height - 1, max(0, pt.get('y', 0) % height))
                all_points.append((x, y))

    if not all_points:
        return [[0] * width for _ in range(height)]

    # Create density grid
    grid = np.zeros((height, width), dtype=np.float64)
    for x, y in all_points:
        ix, iy = int(min(width - 1, max(0, x))), int(min(height - 1, max(0, y)))
        grid[iy][ix] += 1

    # Apply Gaussian smoothing (Sharper sigma for more accurate blobs)
    grid = gaussian_filter(grid, sigma=15)

    # Normalize to 0–1
    max_val = grid.max()
    if max_val > 0:
        grid = grid / max_val

    return grid.tolist()


def generate_engagement_timeline(sessions):
    """
    Generate per-second engagement data, averaged across all sessions.
    Now includes mouse interaction density for more dynamic scoring.
    """
    if not sessions:
        return []

    max_duration = int(max(s.get('time_spent', 0) for s in sessions))
    if max_duration == 0: return []
    max_duration = min(max_duration, 120)

    second_scores = {i: [] for i in range(max_duration + 1)}

    for s in sessions:
        emotion_timeline = s.get('emotion_timeline', [])
        gaze_timeline = s.get('gaze_timeline', [])
        mouse_timeline = s.get('heatmap_data', [])
        if isinstance(mouse_timeline, str):
            try: mouse_timeline = json.loads(mouse_timeline)
            except: mouse_timeline = []
        
        session_duration = int(min(s.get('time_spent', 0), max_duration))
        
        for sec in range(session_duration + 1):
            score = 40  # baseline
            
            # Emotion impact
            if emotion_timeline and sec < len(emotion_timeline):
                entry = emotion_timeline[sec]
                em = entry.get('emotion', 'neutral') if isinstance(entry, dict) else str(entry)
                if em in ('happy', 'surprise'): score += 20
                elif em in ('angry', 'disgust', 'sad', 'fear'): score -= 15

            # Gaze impact
            if gaze_timeline and sec < len(gaze_timeline):
                entry = gaze_timeline[sec]
                if isinstance(entry, dict) and entry.get('on_ad', False):
                    score += 25
            
            # Mouse activity impact (movement/clicks at this second)
            # mouse_timeline entries are {x, y, t} where t is ms
            activity_at_sec = [m for m in mouse_timeline if isinstance(m, dict) and (m.get('t', 0)//1000) == sec]
            if activity_at_sec:
                score += min(20, len(activity_at_sec) * 5)

            second_scores[sec].append(min(100, max(0, score)))

    result = []
    for sec in sorted(second_scores.keys()):
        vals = second_scores[sec]
        if vals:
            result.append({'second': sec, 'score': round(sum(vals) / len(vals), 1)})
    return result


def generate_heatmap_png(sessions, width=600, height=400):
    """Generate a matplotlib heatmap PNG as base64 for download/export."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    grid = generate_heatmap_data(sessions, width, height)
    grid_np = np.array(grid)

    fig, ax = plt.subplots(figsize=(10, 7))
    fig.patch.set_facecolor('#0A0D14')
    ax.set_facecolor('#0A0D14')

    im = ax.imshow(grid_np, cmap='jet', interpolation='bilinear', aspect='auto')
    ax.set_title('Ad Attention Heatmap', color='white', fontsize=16, fontweight='bold', pad=15)
    ax.set_xlabel('X Position', color='gray')
    ax.set_ylabel('Y Position', color='gray')
    ax.tick_params(colors='gray')

    cbar = plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.ax.yaxis.set_tick_params(color='gray')
    cbar.ax.tick_params(labelcolor='gray')

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


def compute_full_analytics(sessions):
    """
    Master function: computes all analytics for a campaign, aggregated and averaged.
    Called by the API endpoint.
    """
    if not sessions:
        return {
            'total_sessions': 0,
            'avg_time_spent': 0,
            'avg_engagement_score': 0,
            'emotion_distribution': {},
            'engagement_timeline': [],
            'heatmap_data': [],
            'peak_attention_second': 0,
            'lowest_attention_second': 0,
            'avg_clicks': 0,
            'avg_idle_pct': 0,
            'avg_active_pct': 100,
            'total_face_detected_pct': 0,
        }

    total = len(sessions)
    avg_time = sum(s.get('time_spent', 0) for s in sessions) / total
    avg_clicks = sum(s.get('clicks', 0) for s in sessions) / total

    # Idle / active
    total_idle = sum(s.get('idle_time', 0) for s in sessions)
    total_active = sum(s.get('active_time', s.get('time_spent', 0)) for s in sessions)
    total_time = total_idle + total_active
    avg_idle_pct = round((total_idle / total_time * 100), 1) if total_time > 0 else 0
    avg_active_pct = round(100 - avg_idle_pct, 1)

    # Face detection rate
    face_pcts = [s.get('face_detected_pct', 0) for s in sessions]
    total_face_pct = round(sum(face_pcts) / total, 1) if face_pcts else 0

    # Engagement
    engagement_score = compute_engagement_score(sessions)
    emotion_dist = compute_emotion_distribution(sessions)
    timeline = generate_engagement_timeline(sessions)

    # Peak / lowest attention
    peak_sec = "N/A"
    lowest_sec = "N/A"
    if timeline and len(timeline) > 1:
        # Exclude first/last if they are outliers or default values
        meaningful = timeline[1:-1] if len(timeline) > 3 else timeline
        peak_entry = max(meaningful, key=lambda x: x['score'])
        lowest_entry = min(meaningful, key=lambda x: x['score'])
        
        # Only show if there is a significant difference, else "Consistent"
        if peak_entry['score'] - lowest_entry['score'] > 5:
            peak_sec = f"{peak_entry['second']}s"
            lowest_sec = f"{lowest_entry['second']}s"
        else:
            peak_sec = "Consistent"
            lowest_sec = "Consistent"
    elif timeline:
        peak_sec = f"{timeline[0]['second']}s"
        lowest_sec = peak_sec

    # Heatmap (lightweight version for JSON response)
    heatmap = generate_heatmap_data(sessions, 60, 40)  # small grid for API response

    return {
        'total_sessions': total,
        'avg_time_spent': round(avg_time, 1),
        'avg_engagement_score': engagement_score,
        'emotion_distribution': emotion_dist,
        'engagement_timeline': timeline,
        'heatmap_data': heatmap,
        'peak_attention_second': peak_sec,
        'lowest_attention_second': lowest_sec,
        'avg_clicks': round(avg_clicks, 1),
        'avg_idle_pct': avg_idle_pct,
        'avg_active_pct': avg_active_pct,
        'total_face_detected_pct': total_face_pct,
    }
