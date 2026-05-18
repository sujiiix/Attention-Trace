import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Check, Crown, Rocket, Shield, BarChart3, Globe, Clock, Star, ArrowRight, Clock3 } from 'lucide-react';
import { useToast } from '../components/Toast';
import PaymentModal from '../components/PaymentModal';

export default function Subscription() {
  const navigate = useNavigate();
  const toast = useToast();
  const [pricing, setPricing] = useState({ price: 500, free_campaign_limit: 1, currency: 'INR', period: 'month' });
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/auth'); return; }

    Promise.all([
      fetch('http://localhost:8000/api/subscription/pricing').then(r => r.json()),
      fetch('http://localhost:8000/api/subscription/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ]).then(([pricingData, statusData]) => {
      setPricing(pricingData);
      setSubStatus(statusData);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, [navigate]);

  const handleActivate = () => {
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    fetchStatus();
  };
  const handleCancel = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.info('Subscription cancelled.');
        const statusRes = await fetch('http://localhost:8000/api/subscription/status', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setSubStatus(await statusRes.json());
      }
    } catch (e) {
      toast.error('Server unreachable.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accentOrange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = subStatus?.is_subscribed;
  const features = [
    { icon: <Rocket size={18} />, text: 'Unlimited Campaigns', free: false },
    { icon: <BarChart3 size={18} />, text: 'Full Analytics Dashboard', free: true },
    { icon: <Globe size={18} />, text: 'Real-time Emotion Detection', free: true },
    { icon: <Shield size={18} />, text: 'Priority Support', free: false },
    { icon: <Clock size={18} />, text: 'Session History & Export', free: false },
    { icon: <Star size={18} />, text: 'Advanced Heatmap Insights', free: false },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accentOrange/10 border border-accentOrange/20 text-accentOrange text-xs font-bold uppercase tracking-widest mb-6">
          <Zap size={14} /> Upgrade Your Experience
        </div>
        <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">
          Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentOrange to-yellow-400">Plan</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          Start free with {pricing.free_campaign_limit} campaign. Upgrade to unlock unlimited campaigns and premium features.
        </p>
      </div>

      {/* Active Subscription Banner */}
      {isActive && (
        <div className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Crown size={24} className="text-green-400" />
            </div>
            <div>
              <p className="text-green-300 font-bold text-lg">Pro Plan Active</p>
              <p className="text-green-400/60 text-sm">
                Expires: {subStatus?.expiry ? new Date(subStatus.expiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleCancel}
            className="px-5 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all"
          >
            Cancel Subscription
          </button>
        </div>
      )}

      {/* Pending Banner */}
      {subStatus?.status === 'pending_verification' && (
        <div className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Clock3 size={24} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-yellow-300 font-bold text-lg">Payment Pending Verification</p>
            <p className="text-yellow-400/60 text-sm">
              We have received your payment submission. An admin will verify the transaction shortly and activate your Pro Plan.
            </p>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Free Plan */}
        <div className={`relative rounded-2xl p-8 border transition-all duration-300 ${!isActive ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-70'}`}>
          <div className="mb-8">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Starter</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white">₹0</span>
              <span className="text-gray-500 text-sm">/forever</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">Perfect for trying out Attention Trace.</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Check size={12} className="text-green-400" />
              </div>
              <span className="text-gray-300 text-sm">{pricing.free_campaign_limit} Campaign</span>
            </div>
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${f.free ? 'bg-green-500/20' : 'bg-gray-700/50'}`}>
                  {f.free ? <Check size={12} className="text-green-400" /> : <span className="text-gray-600 text-xs">—</span>}
                </div>
                <span className={`text-sm ${f.free ? 'text-gray-300' : 'text-gray-600'}`}>{f.text}</span>
              </div>
            ))}
          </div>

          {!isActive && (
            <div className="px-6 py-3 rounded-xl bg-white/5 text-center text-gray-400 text-sm font-semibold border border-white/5">
              Current Plan
            </div>
          )}
        </div>

        {/* Pro Plan */}
        <div className={`relative rounded-2xl p-8 border transition-all duration-300 ${isActive ? 'bg-gradient-to-b from-accentOrange/5 to-transparent border-accentOrange/30 ring-1 ring-accentOrange/10' : 'bg-gradient-to-b from-accentOrange/10 to-transparent border-accentOrange/30 ring-1 ring-accentOrange/20 hover:ring-accentOrange/40'}`}>
          {/* Popular Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 rounded-full bg-gradient-to-r from-accentOrange to-yellow-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-orange-500/30">
              Most Popular
            </span>
          </div>

          <div className="mb-8 mt-2">
            <p className="text-accentOrange text-sm font-bold uppercase tracking-widest mb-2">Pro</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white">₹{pricing.price}</span>
              <span className="text-gray-500 text-sm">/{pricing.period}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">Unlock the full power of Attention Trace.</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-accentOrange/20 flex items-center justify-center flex-shrink-0">
                <Check size={12} className="text-accentOrange" />
              </div>
              <span className="text-white text-sm font-semibold">Unlimited Campaigns</span>
            </div>
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accentOrange/20 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-accentOrange" />
                </div>
                <span className="text-gray-200 text-sm">{f.text}</span>
              </div>
            ))}
          </div>

          {isActive ? (
            <div className="px-6 py-3 rounded-xl bg-green-500/10 text-center text-green-400 text-sm font-bold border border-green-500/20 flex items-center justify-center gap-2">
              <Crown size={16} /> Active Plan
            </div>
          ) : subStatus?.status === 'pending_verification' ? (
            <div className="px-6 py-3 rounded-xl bg-yellow-500/10 text-center text-yellow-400 text-sm font-bold border border-yellow-500/20 flex items-center justify-center gap-2">
              <Clock3 size={16} /> Verification Pending
            </div>
          ) : (
            <button
              onClick={handleActivate}
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-accentOrange to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-white font-bold text-sm transition-all duration-300 shadow-[0_0_30px_rgba(255,77,41,0.3)] hover:shadow-[0_0_40px_rgba(255,77,41,0.5)] transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Zap size={16} /> Upgrade to Pro
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      {subStatus && (
        <div className="glass-card rounded-2xl p-8 border border-white/5 text-center">
          <h3 className="text-lg font-bold text-white mb-4">Your Usage</h3>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div>
              <p className="text-3xl font-black text-accentOrange">{subStatus.campaign_count}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Campaigns</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">{isActive ? '∞' : subStatus.free_campaign_limit}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Limit</p>
            </div>
            <div>
              <p className={`text-3xl font-black ${isActive ? 'text-green-400' : 'text-gray-400'}`}>{isActive ? 'Pro' : 'Free'}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Plan</p>
            </div>
          </div>
        </div>
      )}

      {/* FAQ / Note */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          Payments are securely processed via UPI. Your subscription will be activated upon admin verification of your transaction ID.
        </p>
      </div>

      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        price={pricing.price} 
        onSuccess={handlePaymentSuccess} 
      />
    </div>
  );
}
