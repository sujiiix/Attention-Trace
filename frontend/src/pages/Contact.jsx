import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Sparkles } from 'lucide-react';
import { useToast } from '../components/Toast';
import { API_BASE_URL } from '../config';

function Contact() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleAuthCheck = (e) => {
    if (!userId) {
      e.preventDefault();
      toast.warning('Please log in first to share feedback or send a message!');
      navigate('/auth');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handleAuthCheck(e)) return;

    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus({ type: 'success', msg: 'Message sent successfully! We will get back to you soon.' });
        setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
      } else {
        setStatus({ type: 'error', msg: data.detail || 'Failed to send message.' });
      }
    } catch (error) {
      setStatus({ type: 'error', msg: 'Server unreachable. Is the backend running?' });
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-[80vh] animate-slide-up flex flex-col items-center pb-20">
      
      {/* Massive Hero Section */}
      <div className="w-full relative overflow-hidden py-24 border-b border-gray-800/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-accentOrange blur-[150px] opacity-20 rounded-full pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accentBlue blur-[150px] opacity-10 rounded-full pointer-events-none animate-pulse animation-delay-2000"></div>
        <div className="max-w-7xl mx-auto px-12 relative z-10 text-center">
          <h1 className="text-6xl lg:text-8xl font-black mb-6 tracking-tight drop-shadow-2xl">
            Let's build the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentOrange to-orange-400">Future of Ads.</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed font-medium">
            Whether you have a technical question, need a custom integration, or want to provide feedback on our analytics engine—we're here to help.
          </p>
        </div>
      </div>

      {/* Contact Content Grid */}
      <div className="w-full max-w-6xl mx-auto px-12 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          
          {/* Left Column: Direct Contact Info (Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h3 className="text-3xl font-bold text-white mb-8">Direct Contact</h3>
              <div className="space-y-8">
                
                <div className="flex items-start group">
                  <div className="w-14 h-14 glass-panel rounded-2xl flex items-center justify-center text-accentOrange mr-6 group-hover:scale-110 transition-transform shadow-lg shadow-black/50">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="pt-1">
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Email Support</p>
                    <p className="text-white text-lg font-medium group-hover:text-accentOrange transition-colors cursor-pointer">
                      sujiii2204@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="w-14 h-14 glass-panel rounded-2xl flex items-center justify-center text-accentOrange mr-6 group-hover:scale-110 transition-transform shadow-lg shadow-black/50">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="pt-1">
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Phone Line</p>
                    <p className="text-white text-lg font-medium group-hover:text-accentOrange transition-colors cursor-pointer">
                      +91 8303047171
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="w-14 h-14 glass-panel rounded-2xl flex items-center justify-center text-accentOrange mr-6 group-hover:scale-110 transition-transform shadow-lg shadow-black/50">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="pt-1">
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Headquarters</p>
                    <p className="text-white text-lg font-medium max-w-[200px] leading-snug">
                      Kamla Nehru Institute Of Technology, Sultanpur, UP
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Feedback Card */}
            <div className="glass-card p-8 rounded-3xl shadow-2xl mt-12 relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-accentBlue/20 blur-3xl rounded-full group-hover:bg-accentBlue/40 transition-colors"></div>
               <Sparkles className="text-accentBlue w-8 h-8 mb-4 relative z-10" />
               <h4 className="text-2xl font-bold text-white mb-2 relative z-10">Have quick feedback?</h4>
               <p className="text-gray-400 text-sm mb-6 relative z-10">Help us improve the Attention Trace algorithms.</p>
               <button 
                onClick={handleAuthCheck}
                className="bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all relative z-10 w-full"
               >
                 Share Feedback →
               </button>
            </div>
          </div>

          {/* Right Column: Contact Form (Span 3) */}
          <div className="lg:col-span-3">
            <div className="glass-card p-10 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-accentOrange/10 blur-3xl rounded-full group-hover:bg-accentOrange/20 transition-colors"></div>
              <h3 className="text-3xl font-black text-white mb-2 relative z-10">Send a Message</h3>
              <p className="text-gray-400 text-sm mb-8 relative z-10 font-medium">Fill out the form below and we'll get back to you within 24 hours.</p>
              
              {status.msg && (
                <div className={`mb-6 p-4 rounded-xl text-sm relative z-10 backdrop-blur-md ${status.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                  {status.msg}
                </div>
              )}

              <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe" 
                      required
                      className="w-full bg-[#1A202C]/80 backdrop-blur border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-accentOrange transition-colors shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@company.com" 
                      required
                      className="w-full bg-[#1A202C]/80 backdrop-blur border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-accentOrange transition-colors shadow-inner"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Subject</label>
                  <select 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-[#1A202C]/80 backdrop-blur border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-accentOrange transition-colors shadow-inner appearance-none"
                  >
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                    <option>Bug Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Message</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you today?" 
                    rows="5"
                    required
                    className="w-full bg-[#1A202C]/80 backdrop-blur border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-accentOrange transition-colors shadow-inner resize-none"
                  ></textarea>
                </div>
                
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-accentOrange to-orange-500 hover:from-orange-500 hover:to-[#ff5533] text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,77,41,0.2)] hover:shadow-[0_0_30px_rgba(255,77,41,0.4)] transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? 'SENDING...' : 'SEND MESSAGE'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Contact;
