import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Activity } from 'lucide-react';

function Landing() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  return (
    <div className="relative flex flex-col md:flex-row items-center justify-between px-12 py-20 min-h-[85vh] overflow-hidden">
      
      {/* Animated Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-accentOrange rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-accentBlue rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob animation-delay-4000"></div>
      
      {/* Left Content */}
      <div className="w-full md:w-1/2 space-y-8 animate-slide-up relative z-10 pt-10 md:pt-0">
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md">
          <Sparkles className="text-accentOrange w-4 h-4" />
          <span className="text-gray-300 text-xs font-bold tracking-widest uppercase">The Next Evolution in Ad Intelligence</span>
        </div>
        
        <h1 className="text-6xl lg:text-8xl font-black leading-tight tracking-tight text-white drop-shadow-2xl">
          We Are <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentOrange to-orange-400">Powered</span> <br />
          Intelligence.
        </h1>
        
        <p className="text-gray-400 text-lg max-w-lg leading-relaxed font-medium">
          Attention Trace is the first fully integrated AI platform. Build strategy-driven ad campaigns by capturing real-time user emotions, heatmaps, and engagement metrics.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pt-6">
          <button 
            onClick={() => navigate(userId ? '/dashboard/campaigns' : '/auth')}
            className="group relative px-8 py-4 bg-white text-black font-black tracking-widest rounded-xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-accentOrange to-accentBlue opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center">
              LET'S START <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          
          <button 
            onClick={() => navigate('/about')}
            className="px-8 py-4 bg-transparent border border-gray-700 hover:border-gray-500 text-white font-bold tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center"
          >
            LEARN MORE
          </button>
        </div>
      </div>

      {/* Right Content - Abstract Tech Graphic / UI Mockup */}
      <div className="w-full md:w-1/2 mt-20 md:mt-0 relative animate-fade-in flex justify-end">
        <div className="relative w-full max-w-xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-accentOrange to-accentBlue rounded-[2rem] filter blur-3xl opacity-30 animate-pulse"></div>
          
          {/* Glass Mockup Card */}
          <div className="relative z-10 glass-card p-8 rounded-[2rem] shadow-2xl border border-white/10 flex flex-col items-center text-center overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accentOrange/30 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accentBlue/30 blur-3xl rounded-full"></div>
            
            <Activity className="w-16 h-16 text-accentOrange mb-6" />
            <h3 className="text-3xl font-black text-white mb-2">Real-Time Tracking</h3>
            <p className="text-gray-400 mb-8 max-w-sm">
              Our computer vision models run instantly in the browser, tracking micro-expressions and gaze vectors at 60 frames per second.
            </p>
            
            {/* Fake Dashboard Elements */}
            <div className="w-full space-y-4">
              <div className="h-4 bg-white/5 rounded-full w-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accentOrange to-orange-400 w-[85%] rounded-full"></div>
              </div>
              <div className="h-4 bg-white/5 rounded-full w-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accentBlue to-blue-400 w-[60%] rounded-full"></div>
              </div>
              <div className="h-4 bg-white/5 rounded-full w-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 w-[75%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
