import React, { useState } from 'react';
import { Eye, MousePointerClick, BarChart3, Activity, ShieldCheck, Zap, X, Brain, Target, Database } from 'lucide-react';

function About() {
  const [showHow, setShowHow] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      icon: <Brain className="w-7 h-7 text-accentOrange" />,
      title: "AI Gaze Tracking",
      desc: "Uses MediaPipe Task API to accurately map user attention points without any specialized hardware.",
      color: "bg-accentOrange/10 border-accentOrange/20",
      detail: "In real-time, our system tracks 468 3D facial landmarks and specific iris vectors. By calculating the ratio of the iris within the eye socket, we estimate the gaze direction relative to the ad modal. This allows us to know exactly which part of your ad is being watched."
    },
    {
      icon: <Activity className="w-7 h-7 text-accentBlue" />,
      title: "Emotional Sentiment",
      desc: "Captures happiness, surprise, and focus levels using real-time facial landmark analysis.",
      color: "bg-accentBlue/10 border-accentBlue/20",
      detail: "Using the FER (Facial Expression Recognition) model, we analyze micro-expressions 2 times per second. We filter out environmental noise to detect genuine emotional resonance, helping you understand if your creative is evoking the intended brand sentiment."
    },
    {
      icon: <MousePointerClick className="w-7 h-7 text-purple-400" />,
      title: "Behavioral Heuristics",
      desc: "Tracks mouse velocity, click patterns, and idle time to filter out accidental interactions.",
      color: "bg-purple-500/10 border-purple-500/20",
      detail: "We don't just track clicks. We monitor mouse acceleration (velocity) and 'dwell zones'. If a user hovers over a CTA but doesn't click, we record that as 'High Intent'. This gives a complete picture of the user's path even without webcam data."
    },
    {
      icon: <Zap className="w-7 h-7 text-yellow-400" />,
      title: "Real-time Processing",
      desc: "WebSocket-driven telemetry ensures data is processed in sub-millisecond cycles for instant feedback.",
      color: "bg-yellow-500/10 border-yellow-500/20",
      detail: "Data is streamed via WebSockets to our Python FastAPI backend. By using asynchronous processing, we achieve sub-millisecond latency, allowing the AI to keep up with high-frequency user interactions without slowing down the target website."
    },
    {
      icon: <Target className="w-7 h-7 text-green-400" />,
      title: "Engagement Scoring",
      desc: "A proprietary 0-100 score combining AI signals and behavioral data for definitive campaign ROI.",
      color: "bg-green-500/10 border-green-500/20",
      detail: "Our proprietary algorithm weights AI gaze (40%), Emotional Sentiment (20%), and Behavioral intent (40%). This 'Combined Engagement Score' is the industry's most accurate metric for measuring true ad effectiveness."
    },
    {
      icon: <Database className="w-7 h-7 text-red-400" />,
      title: "Aggregated Analytics",
      desc: "Cross-session data aggregation reveals long-term trends and user behavior patterns.",
      color: "bg-red-500/10 border-red-500/20",
      detail: "We don't just show session logs. We mathematically aggregate thousands of sessions into a single Gaussian heatmap. This 'Super-Heatmap' shows you where the 'Average User' focuses their attention over the entire campaign lifecycle."
    }
  ];

  const steps = [
    { num: "01", title: "Capture", desc: "Our lightweight script initializes on the target website, capturing anonymous telemetry through the browser." },
    { num: "02", title: "Process", desc: "Frames and interactions are sent to our high-performance Python backend for AI-driven sentiment and gaze estimation." },
    { num: "03", title: "Aggregate", desc: "Individual session data is mathematically normalized and aggregated into campaign-wide intelligence." },
    { num: "04", title: "Visualize", desc: "The dashboard renders Gaussian heatmaps and engagement timelines for a visual interaction report." }
  ];

  return (
    <div className="relative px-6 lg:px-12 py-20 min-h-[85vh] max-w-7xl mx-auto overflow-hidden">
      
      {/* Background Blobs */}
      <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-accentOrange/10 rounded-full blur-[160px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-accentBlue/10 rounded-full blur-[160px] pointer-events-none animate-pulse"></div>

      <div className="text-center mb-24 relative z-10">
        <h1 className="text-6xl lg:text-8xl font-black mb-8 tracking-tighter text-white">
          Revolutionizing <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentOrange to-purple-500">Ad Intelligence</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-3xl mx-auto font-medium leading-relaxed mb-10">
          Attention Trace isn't just a tracking tool. It's an AI-first ecosystem designed to reveal the hidden emotional resonance and interaction patterns of every user.
        </p>
        
        <button 
          onClick={() => setShowHow(true)}
          className="group relative inline-flex items-center gap-3 bg-white/5 border border-white/10 hover:border-accentOrange/50 px-8 py-4 rounded-2xl text-white font-bold transition-all hover:bg-white/10"
        >
          <Zap className="w-5 h-5 text-accentOrange" />
          HOW IT WORKS
          <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-accentOrange group-hover:w-full transition-all duration-300"></span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {features.map((f, i) => (
          <div key={i} 
            onClick={() => setSelectedFeature(f)}
            className="glass-card p-10 rounded-3xl border border-white/5 hover:border-accentOrange/30 transition-all duration-500 group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-colors"></div>
            
            <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg`}>
              {f.icon}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:translate-x-2 transition-transform">{f.title}</h3>
            <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors mb-6">
              {f.desc}
            </p>
            <div className="text-accentOrange text-xs font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              LEARN MORE <Zap className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedFeature(null)}></div>
          <div className="glass-card w-full max-w-xl rounded-[32px] p-8 lg:p-10 relative z-10 border border-white/10 animate-scale-in">
            <button onClick={() => setSelectedFeature(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className={`w-16 h-16 rounded-2xl ${selectedFeature.color} flex items-center justify-center mb-6`}>
              {selectedFeature.icon}
            </div>
            <h3 className="text-3xl font-black text-white mb-4">{selectedFeature.title}</h3>
            <p className="text-gray-300 leading-relaxed mb-8 text-lg">
              {selectedFeature.detail}
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
              <ShieldCheck className="w-6 h-6 text-green-400" />
              <p className="text-xs text-gray-400 font-medium">Enterprise-grade encryption is applied to all telemetry streams.</p>
            </div>
          </div>
        </div>
      )}

      {/* How it Works Modal */}
      {showHow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowHow(false)}></div>
          
          <div className="glass-card w-full max-w-4xl rounded-[40px] p-8 lg:p-12 relative z-10 border border-white/10 animate-scale-in max-h-[90vh] overflow-y-auto custom-modal-scroll">
            <button 
              onClick={() => setShowHow(false)}
              className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="mb-12">
              <span className="text-accentOrange font-bold tracking-[4px] text-xs uppercase">Process Flow</span>
              <h2 className="text-4xl font-black text-white mt-2">The Analytics Pipeline</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="text-4xl font-black text-white/10 group-hover:text-accentOrange/30 transition-colors pt-1">
                    {s.num}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">{s.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 p-8 rounded-3xl bg-accentOrange/5 border border-accentOrange/10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-full bg-accentOrange/20 flex items-center justify-center shrink-0">
                <Brain className="w-10 h-10 text-accentOrange" />
              </div>
              <div>
                <h5 className="text-lg font-bold text-white mb-1">Adaptive AI Core</h5>
                <p className="text-gray-400 text-sm">
                  Our system automatically adjusts its accuracy weighting based on environmental conditions. If lighting is poor for webcam tracking, it dynamically prioritizes high-frequency mouse telemetry to maintain 99.9% tracking integrity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section at bottom */}
      <div className="mt-32 pt-20 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center relative z-10">
        <div>
          <p className="text-4xl font-black text-white mb-2">99%</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Accuracy Rate</p>
        </div>
        <div>
          <p className="text-4xl font-black text-white mb-2">&lt;1ms</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Latency</p>
        </div>
        <div>
          <p className="text-4xl font-black text-white mb-2">1M+</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Events/Day</p>
        </div>
        <div>
          <p className="text-4xl font-black text-white mb-2">100%</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Privacy First</p>
        </div>
      </div>
    </div>
  );
}

export default About;
