import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, TrendingUp, Zap, Activity, Crown, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '../components/Toast';
import { API_BASE_URL } from '../config';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_users: 0, total_campaigns: 0, total_sessions: 0, total_subscribers: 0 });
  
  const [publicApiUrl, setPublicApiUrl] = useState('');
  const [subPrice, setSubPrice] = useState(500);
  const [freeCampaignLimit, setFreeCampaignLimit] = useState(1);
  const [pendingPayments, setPendingPayments] = useState([]);
  const toast = useToast();

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setPendingPayments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    // Verify admin role and load data
    Promise.all([
      fetch(`${API_BASE_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/settings/public_url`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/subscription/pricing`).then(r => r.json())
    ])
    .then(([userData, settingsData, pricingData]) => {
      if (userData.role !== 'admin') {
        navigate('/dashboard');
        return;
      }
      setIsAdmin(true);
      setPublicApiUrl(settingsData.public_api_url || API_BASE_URL);
      setSubPrice(pricingData.price || 5);
      setFreeCampaignLimit(pricingData.free_campaign_limit || 1);
      
      // Load stats
      return fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
    })
    .then(statsData => {
      if (statsData) setStats(statsData);
      setLoading(false);
      fetchPayments();
    })
    .catch(err => {
      console.error(err);
      navigate('/dashboard');
    });
  }, [navigate]);

  const handleApprovePayment = async (paymentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Payment approved and subscription activated.');
        fetchPayments();
        // optionally refresh stats
      } else {
        toast.error('Failed to approve payment.');
      }
    } catch (e) {
      toast.error('Server unreachable.');
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.info('Payment rejected.');
        fetchPayments();
      } else {
        toast.error('Failed to reject payment.');
      }
    } catch (e) {
      toast.error('Server unreachable.');
    }
  };

  const handleSaveSettings = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/settings/public_url`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ public_api_url: publicApiUrl })
    })
    .then(r => {
      if (!r.ok) throw new Error('Failed to save settings');
      return r.json();
    })
    .then(() => {
      toast.success('Global settings updated securely.');
    })
    .catch(err => {
      toast.error(err.message);
    });
  };

  const handleSavePricing = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/admin/subscription-pricing`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ price: parseFloat(subPrice), free_campaign_limit: parseInt(freeCampaignLimit) })
    })
    .then(r => {
      if (!r.ok) throw new Error('Failed to save pricing');
      return r.json();
    })
    .then(() => {
      toast.success('Subscription pricing updated globally.');
    })
    .catch(err => {
      toast.error(err.message);
    });
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-accentBlue border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,163,255,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-12 py-10 space-y-12 animate-fade-in pb-20">
      
      <div className="text-center pt-6">
        <h1 className="text-5xl font-black mb-4 tracking-tight text-white drop-shadow-xl flex items-center justify-center gap-4">
          <ShieldCheck className="w-12 h-12 text-accentOrange" />
          Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentOrange to-[#ff5533]">Admin</span>
        </h1>
        <p className="text-gray-400 font-medium text-lg">Secure control center for Attention Trace.</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-8 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-accentBlue/30 transition-all">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accentBlue/10 blur-3xl rounded-full group-hover:bg-accentBlue/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-accentBlue/20 rounded-xl"><Users className="w-6 h-6 text-accentBlue" /></div>
            <h3 className="text-gray-400 font-bold tracking-wider text-sm uppercase">Users</h3>
          </div>
          <div className="text-5xl font-black text-white">{stats.total_users}</div>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-accentOrange/30 transition-all">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accentOrange/10 blur-3xl rounded-full group-hover:bg-accentOrange/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-accentOrange/20 rounded-xl"><TrendingUp className="w-6 h-6 text-accentOrange" /></div>
            <h3 className="text-gray-400 font-bold tracking-wider text-sm uppercase">Campaigns</h3>
          </div>
          <div className="text-5xl font-black text-white">{stats.total_campaigns}</div>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-green-500/30 transition-all">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 blur-3xl rounded-full group-hover:bg-green-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl"><Activity className="w-6 h-6 text-green-500" /></div>
            <h3 className="text-gray-400 font-bold tracking-wider text-sm uppercase">Sessions</h3>
          </div>
          <div className="text-5xl font-black text-white">{stats.total_sessions}</div>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full group-hover:bg-yellow-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl"><Crown className="w-6 h-6 text-yellow-500" /></div>
            <h3 className="text-gray-400 font-bold tracking-wider text-sm uppercase">Subscribers</h3>
          </div>
          <div className="text-5xl font-black text-white">{stats.total_subscribers}</div>
        </div>
      </div>

      {/* Global Configuration Section */}
      <div className="glass-card p-10 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accentBlue via-purple-500 to-accentOrange"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Global Environment Link</h3>
              <p className="text-gray-400 text-sm mt-1">This link is automatically provided to all users when they generate a tracking script. Use your active ngrok URL here.</p>
            </div>
          </div>

          <div className="space-y-4 max-w-3xl">
            <label className="block text-gray-500 text-xs font-black uppercase tracking-widest">Public API URL (e.g. ngrok HTTPS)</label>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                value={publicApiUrl} 
                onChange={(e) => setPublicApiUrl(e.target.value)}
                className="flex-grow bg-black/50 border border-white/10 rounded-xl px-6 py-4 text-white font-mono focus:outline-none focus:border-accentBlue/50 transition-all shadow-inner"
                placeholder="https://your-ngrok-url.ngrok-free.dev"
              />
              <button 
                onClick={handleSaveSettings}
                className="bg-gradient-to-r from-accentBlue to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,163,255,0.3)] hover:shadow-[0_0_30px_rgba(0,163,255,0.5)] whitespace-nowrap"
              >
                SAVE GLOBALLY
              </button>
            </div>
            <div className="flex items-center gap-3 mt-4 px-2">
              <span className={`w-3 h-3 rounded-full ${publicApiUrl.includes('ngrok') ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]'} animate-pulse`}></span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Status: {publicApiUrl.includes('ngrok') ? 'Production Tunnel Linked' : 'Local Environment'}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <p className="text-sm text-gray-500 leading-relaxed italic">
              <strong className="text-red-400 not-italic mr-2">ADMIN WARNING:</strong> 
              Changing this value will affect all newly generated tracking scripts across the entire platform. Standard users do not have access to this page.
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Pricing Section */}
      <div className="glass-card p-10 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Subscription Pricing</h3>
              <p className="text-gray-400 text-sm mt-1">Control subscription costs and free tier limits for all users on the platform.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div className="space-y-2">
              <label className="block text-gray-500 text-xs font-black uppercase tracking-widest">Monthly Price (INR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                <input 
                  type="number" 
                  value={subPrice} 
                  onChange={(e) => setSubPrice(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-6 py-4 text-white font-mono text-lg focus:outline-none focus:border-yellow-500/50 transition-all shadow-inner"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-gray-500 text-xs font-black uppercase tracking-widest">Free Campaign Limit</label>
              <input 
                type="number" 
                value={freeCampaignLimit} 
                onChange={(e) => setFreeCampaignLimit(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 text-white font-mono text-lg focus:outline-none focus:border-yellow-500/50 transition-all shadow-inner"
                min="0"
              />
            </div>
          </div>

          <button 
            onClick={handleSavePricing}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]"
          >
            UPDATE PRICING
          </button>

          <div className="pt-6 border-t border-white/5">
            <p className="text-sm text-gray-500 leading-relaxed italic">
              <strong className="text-yellow-400 not-italic mr-2">NOTE:</strong> 
              Users get {freeCampaignLimit} free campaign{freeCampaignLimit !== 1 ? 's' : ''}. After that, they must subscribe at ₹{subPrice}/month to create additional campaigns. Admins are exempt from all limits.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Payments Section */}
      <div className="glass-card p-10 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Clock className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Pending Verification</h3>
              <p className="text-gray-400 text-sm mt-1">Review manual UPI transactions submitted by users.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-4 font-semibold">User</th>
                  <th className="pb-4 font-semibold">Billing Details</th>
                  <th className="pb-4 font-semibold">Transaction ID</th>
                  <th className="pb-4 font-semibold">Amount</th>
                  <th className="pb-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingPayments.length > 0 ? (
                  pendingPayments.map(payment => (
                    <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 text-sm">
                        <div className="text-white font-medium">{payment.user_email}</div>
                      </td>
                      <td className="py-4 text-sm text-gray-400 max-w-xs truncate">
                        {payment.billing_name}<br/>
                        <span className="text-xs">{payment.billing_phone}</span>
                      </td>
                      <td className="py-4 text-sm font-mono text-gray-300">
                        {payment.transaction_id}
                      </td>
                      <td className="py-4 text-sm text-green-400 font-medium">
                        ₹{payment.amount}
                      </td>
                      <td className="py-4 text-sm">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApprovePayment(payment.id)}
                            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors border border-green-500/30"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleRejectPayment(payment.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/30"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500 text-sm italic">
                      No pending payments to review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
