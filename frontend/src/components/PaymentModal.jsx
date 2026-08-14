import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';

export default function PaymentModal({ isOpen, onClose, price, onSuccess, endpoint }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    billing_name: '',
    billing_address: '',
    billing_phone: '',
    transaction_id: ''
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (!formData.billing_name || !formData.billing_address || !formData.billing_phone) {
      toast.error('Please fill in all billing details.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.transaction_id || formData.transaction_id.length < 8) {
      toast.error('Please enter a valid Transaction/Reference ID.');
      return;
    }
    
    setLoading(true);
    try {
      const apiUrl = endpoint || `${API_BASE_URL}/api/subscription/activate`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          plan: 'monthly',
          transaction_id: formData.transaction_id,
          billing_name: formData.billing_name,
          billing_address: formData.billing_address,
          billing_phone: formData.billing_phone
        })
      });
      
      if (res.ok) {
        toast.success('Payment submitted! Waiting for admin verification.');
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to submit payment.');
      }
    } catch (e) {
      toast.error('Server unreachable.');
    }
    setLoading(false);
  };

  const upiString = `upi://pay?pa=sujanchaurasia22-1@okaxis&pn=Attention Trace&am=${price}.00&cu=INR`;
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md max-h-[80vh] overflow-y-auto bg-[#111620] border border-white/10 rounded-3xl shadow-2xl custom-scrollbar mt-16 mb-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-accentOrange/10 to-transparent">
          <div>
            <h2 className="text-xl font-bold text-white">Pro Subscription</h2>
            <p className="text-sm text-gray-400">Secure UPI Payment</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order Summary */}
          <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-black/40 border border-white/5">
            <span className="text-gray-300">Amount to Pay</span>
            <span className="text-2xl font-black text-white">₹{price} <span className="text-sm font-normal text-gray-500">/mo</span></span>
          </div>

          {step === 1 ? (
            <div className="space-y-4 animate-slide-up">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Billing Details</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.billing_name}
                  onChange={e => setFormData({...formData, billing_name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accentOrange/50 transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Billing Address</label>
                <input 
                  type="text" 
                  value={formData.billing_address}
                  onChange={e => setFormData({...formData, billing_address: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accentOrange/50 transition-colors"
                  placeholder="123 Main St, City, Country"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={formData.billing_phone}
                  onChange={e => setFormData({...formData, billing_phone: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accentOrange/50 transition-colors"
                  placeholder="+1 234 567 8900"
                />
              </div>
              
              <button 
                onClick={handleNext}
                className="w-full mt-6 bg-gradient-to-r from-accentOrange to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20"
              >
                Continue to Payment
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-slide-up">
              <div className="flex flex-col items-center p-6 bg-white rounded-2xl">
                <img src={dynamicQrUrl} alt="Payment QR Code" className="w-48 h-48 object-contain mb-4 border-4 border-gray-100 rounded-lg" />
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Scan to Pay via UPI</p>
                  <p className="text-lg font-black text-gray-900">sujanchaurasia22-1@okaxis</p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200 leading-relaxed">
                  After completing the payment on your app, please enter the 12-digit UPI Transaction ID or Reference Number below for verification.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Transaction / Reference ID</label>
                <input 
                  type="text" 
                  value={formData.transaction_id}
                  onChange={e => setFormData({...formData, transaction_id: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:border-green-500/50 transition-colors"
                  placeholder="123456789012"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-semibold transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Submit Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
