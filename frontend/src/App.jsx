import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Simulator from './pages/Simulator';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminPanel from './pages/AdminPanel';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Subscription from './pages/Subscription';
import { User, Shield, LogOut, FileText, ChevronDown, Crown } from 'lucide-react';

function ProfileDropdown({ user, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accentOrange to-accentBlue flex items-center justify-center text-white text-xs font-black shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow ring-2 ring-white/10 group-hover:ring-white/20">
          {initials}
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-14 w-72 rounded-2xl bg-[#111620] border border-white/10 shadow-2xl shadow-black/60 overflow-hidden animate-slide-up z-[100]">
          {/* Profile Header */}
          <div className="p-5 border-b border-white/5 bg-gradient-to-r from-accentOrange/5 to-accentBlue/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accentOrange to-accentBlue flex items-center justify-center text-white text-sm font-black shadow-lg ring-2 ring-white/10">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{user?.name || user?.username || 'User'}</p>
                <p className="text-gray-400 text-xs truncate">{user?.email || ''}</p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-accentOrange/10 border border-accentOrange/30 text-accentOrange text-[10px] font-bold uppercase tracking-wider">
                    <Shield size={8} /> Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {isAdmin && (
              <button
                onClick={() => { navigate('/admin'); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all group"
              >
                <Shield size={16} className="text-accentOrange group-hover:text-orange-400" />
                Admin Panel
              </button>
            )}
            <button
              onClick={() => { navigate('/subscription'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all group"
            >
              <Crown size={16} className="text-yellow-500 group-hover:text-yellow-400" />
              Subscription
            </button>
            <button
              onClick={() => { navigate('/privacy'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all group"
            >
              <FileText size={16} className="text-gray-500 group-hover:text-gray-300" />
              Privacy Policy
            </button>
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-white/5">
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group"
            >
              <LogOut size={16} className="group-hover:text-red-300" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem('user_id');

  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (userId) {
      fetch('http://localhost:8000/api/users/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => {
        if (!res.ok) {
          // Token invalid / user deleted — force logout
          localStorage.removeItem('token');
          localStorage.removeItem('user_id');
          navigate('/');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setUserData(data);
          if (data.role === 'admin') setIsAdmin(true);
        }
      })
      .catch(console.error);
    }
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    setIsAdmin(false);
    setUserData(null);
    navigate('/');
  };

  const getLinkClass = (path) => {
    let active = false;
    if (path === '/') active = location.pathname === '/';
    else if (path === '/about') active = location.pathname === '/about';
    else if (path === '/contact') active = location.pathname === '/contact';
    else if (path === '/dashboard') active = location.pathname === '/dashboard';
    else if (path === '/dashboard/campaigns') active = location.pathname === '/dashboard/campaigns';
    else if (path === '/dashboard/analytics') active = location.pathname === '/dashboard/analytics';
    else if (path === '/dashboard/history') active = location.pathname === '/dashboard/history';

    return `relative text-sm font-medium tracking-wide transition-colors py-1 group ${
      active 
        ? 'text-accentOrange' 
        : 'text-gray-300 hover:text-white'
    }`;
  };

  const ActiveIndicator = ({ active }) => (
    <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-accentOrange transform origin-left transition-transform duration-300 ease-out ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
  );

  return (
    <nav className="flex items-center justify-between py-5 px-12 glass-panel sticky top-0 z-50">
      <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
        <div className="w-8 h-8 rounded bg-gradient-to-br from-accentOrange to-accentBlue flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
          <span className="text-white font-black text-xs">AT</span>
        </div>
        <span className="text-xl font-black tracking-widest text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all duration-300">ATTENTION TRACE</span>
      </div>
      
      {userId ? (
        <div className="flex items-center space-x-8">
          <Link to="/" className={getLinkClass('/')}>HOME<ActiveIndicator active={location.pathname === '/'} /></Link>
          <Link to="/about" className={getLinkClass('/about')}>ABOUT<ActiveIndicator active={location.pathname === '/about'} /></Link>
          <Link to="/dashboard/campaigns" className={getLinkClass('/dashboard/campaigns')}>CAMPAIGNS<ActiveIndicator active={location.pathname === '/dashboard/campaigns'} /></Link>
          <Link to="/dashboard/analytics" className={getLinkClass('/dashboard/analytics')}>ANALYTICS<ActiveIndicator active={location.pathname === '/dashboard/analytics'} /></Link>
          <Link to="/dashboard/history" className={getLinkClass('/dashboard/history')}>HISTORY<ActiveIndicator active={location.pathname === '/dashboard/history'} /></Link>
          <Link to="/contact" className={getLinkClass('/contact')}>CONTACT US<ActiveIndicator active={location.pathname === '/contact'} /></Link>
          <ProfileDropdown user={userData} isAdmin={isAdmin} onLogout={handleLogout} />
        </div>
      ) : (
        <div className="flex items-center space-x-8">
          <Link to="/" className={getLinkClass('/')}>HOME<ActiveIndicator active={location.pathname === '/'} /></Link>
          <Link to="/about" className={getLinkClass('/about')}>ABOUT<ActiveIndicator active={location.pathname === '/about'} /></Link>
          <Link to="/contact" className={getLinkClass('/contact')}>CONTACT US<ActiveIndicator active={location.pathname === '/contact'} /></Link>
          <button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-accentOrange to-[#e63e1c] hover:from-orange-500 hover:to-[#ff5533] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(255,77,41,0.3)] hover:shadow-[0_0_30px_rgba(255,77,41,0.5)] transform hover:-translate-y-0.5 ml-4">
            LOGIN / SIGNUP
          </button>
        </div>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-darkBg flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/simulator/:campaignId" element={<Simulator />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/subscription" element={<Subscription />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
