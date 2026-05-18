import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Wand2 } from 'lucide-react';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState(''); // For login (email or username)
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  
  // OTP State for Signup
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  
  // Forgot Password State
  const [forgotMode, setForgotMode] = useState(''); // '' | 'request' | 'verify'
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(''); setMessage('');
    try {
      const response = await fetch('http://localhost:8000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user_id', data.user_id);
        navigate('/');
      } else {
        setError(data.detail || 'Google authentication failed');
      }
    } catch (err) {
      setError('Server unreachable. Is the backend running?');
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pwd = "";
    pwd += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    pwd += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    pwd += "0123456789"[Math.floor(Math.random() * 10)];
    pwd += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    for (let i = 4; i < 12; i++) {
        pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    setPassword(pwd);
    setShowPassword(true);
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!email.endsWith('@gmail.com')) return setError("Please enter a valid @gmail.com address.");
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        setForgotMode('verify');
        setMessage('A reset code has been sent to your email!');
      } else {
        setError(data.detail || 'Failed to request reset');
      }
    } catch (err) {
      setError('Server unreachable.');
    }
    setLoading(false);
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return setError("Please make a strong password (at least 8 chars, 1 letter, 1 number, and 1 symbol).");
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: password })
      });
      const data = await response.json();
      if (response.ok) {
        setForgotMode('');
        setIsLogin(true);
        setPassword('');
        setOtp('');
        setMessage('Password updated successfully! You can now log in.');
      } else {
        setError(data.detail || 'Failed to reset password');
      }
    } catch (err) {
      setError('Server unreachable.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    
    if (forgotMode === 'request') return handleForgotRequest(e);
    if (forgotMode === 'verify') return handleForgotVerify(e);
    
    if (isLogin) {
      // LOGIN FLOW
      try {
        const response = await fetch(`http://localhost:8000/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('user_id', data.user_id);
          navigate('/');
        } else {
          setError(data.detail || 'Invalid credentials');
        }
      } catch (err) {
        setError('Server unreachable. Is the backend running?');
      }
    } else {
      // SIGNUP FLOW
      if (showOtpInput) {
        // VERIFY OTP
        try {
          const response = await fetch(`http://localhost:8000/api/signup/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, email, password, otp })
          });
          const data = await response.json();
          if (response.ok) {
            setIsLogin(true);
            setShowOtpInput(false);
            setPassword(''); // Clear password field automatically
            setOtp('');
            setMessage('Account created successfully! Please log in.');
          } else {
            setError(data.detail || 'Invalid OTP');
          }
        } catch (err) {
          setError('Server unreachable.');
        }
      } else {
        // REQUEST OTP
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
        if (!passwordRegex.test(password)) {
          return setError("Please make a strong password (at least 8 chars, 1 letter, 1 number, and 1 symbol).");
        }
        if (!email.endsWith('@gmail.com')) return setError("Please use a valid @gmail.com address.");
        if (!acceptedPrivacy) return setError("You must accept the Privacy Policy to create an account.");
        
        setLoading(true);
        try {
          const response = await fetch(`http://localhost:8000/api/signup/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, email, password })
          });
          const data = await response.json();
          if (response.ok) {
            setShowOtpInput(true);
            setMessage('Verification code sent to your email!');
          } else {
            setError(data.detail || 'Error requesting OTP');
          }
        } catch (err) {
          setError('Server unreachable. Is the backend running?');
        }
        setLoading(false);
      }
    }
  };

  const getTitle = () => {
    if (forgotMode === 'request') return 'Reset Password';
    if (forgotMode === 'verify') return 'Enter New Password';
    if (isLogin) return 'Welcome Back';
    if (showOtpInput) return 'Verify Email';
    return 'Create Account';
  };

  const getSubtitle = () => {
    if (forgotMode === 'request') return 'Enter your email to receive a reset code.';
    if (forgotMode === 'verify') return `Enter the code sent to ${email} and your new password.`;
    if (isLogin) return 'Enter your details to access analytics.';
    if (showOtpInput) return `Enter the 6-digit code sent to ${email}`;
    return 'Join to start tracing attention.';
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] animate-slide-up py-12">
      <div className="bg-[#111620] p-10 rounded-2xl shadow-2xl border border-gray-800 w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-accentOrange blur-md opacity-50"></div>
        
        <h2 className="text-3xl font-bold text-white mb-2 text-center">{getTitle()}</h2>
        <p className="text-gray-400 text-center mb-6 text-sm">{getSubtitle()}</p>
        
        {/* Google OAuth Button (Hide during OTP verification and forgot password) */}
        {!showOtpInput && !forgotMode && (
          <>
            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                theme="filled_black"
                shape="rectangular"
                text={isLogin ? "signin_with" : "signup_with"}
              />
            </div>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase font-bold tracking-wider">OR</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>
          </>
        )}
        
        {error && <div className="border p-3 rounded mb-6 text-sm text-center bg-red-500/10 border-red-500/50 text-red-400">{error}</div>}
        {message && <div className="border p-3 rounded mb-6 text-sm text-center bg-green-500/10 border-green-500/50 text-green-400">{message}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* FORGOT PASSWORD REQUEST FIELD */}
          {forgotMode === 'request' && (
            <div>
              <label className="block text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">Google Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A202C] border border-gray-700 text-white rounded px-4 py-3 focus:outline-none focus:border-accentOrange transition-colors"
                placeholder="jane@gmail.com"
                autoComplete="off"
                required
              />
            </div>
          )}

          {/* OTP VERIFICATION FIELDS (Signup or Forgot Verify) */}
          {(showOtpInput || forgotMode === 'verify') && (
            <div>
              <label className="block text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">6-Digit OTP</label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-[#1A202C] border border-gray-700 text-white rounded px-4 py-3 text-center tracking-widest text-xl focus:outline-none focus:border-accentOrange transition-colors"
                placeholder="------"
                maxLength={6}
                required
              />
            </div>
          )}

          {/* SIGNUP FIELDS */}
          {!isLogin && !showOtpInput && !forgotMode && (
            <>
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A202C] border border-gray-700 text-white rounded px-4 py-3 focus:outline-none focus:border-accentOrange transition-colors"
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1A202C] border border-gray-700 text-white rounded px-4 py-3 focus:outline-none focus:border-accentOrange transition-colors"
                  placeholder="janedoe99"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">Google Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A202C] border border-gray-700 text-white rounded px-4 py-3 focus:outline-none focus:border-accentOrange transition-colors"
                  placeholder="jane@gmail.com"
                  autoComplete="off"
                  required
                />
              </div>
            </>
          )}

          {/* LOGIN FIELD */}
          {isLogin && !forgotMode && (
            <div>
              <label className="block text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">Email or Username</label>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-[#1A202C] border border-gray-700 text-white rounded px-4 py-3 focus:outline-none focus:border-accentOrange transition-colors"
                placeholder="jane@gmail.com"
                autoComplete="off"
                required
              />
            </div>
          )}

          {/* PASSWORD FIELD (SHARED for Login, Signup Request, Forgot Verify) */}
          {(!showOtpInput && !forgotMode) || forgotMode === 'verify' ? (
            <div>
              <label className="block text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">{forgotMode === 'verify' ? 'New Password' : 'Password'}</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1A202C] border border-gray-700 text-white rounded px-4 py-3 pr-10 focus:outline-none focus:border-accentOrange transition-colors"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {(!isLogin || forgotMode === 'verify') && (
                <div className="flex justify-between items-center mt-2">
                  <p className="text-gray-500 text-xs">Letters, numbers & symbols (8+ chars).</p>
                  <button 
                    type="button" 
                    onClick={generatePassword} 
                    className="text-accentOrange text-xs flex items-center hover:text-orange-400 transition-colors font-semibold"
                  >
                    <Wand2 size={12} className="mr-1" /> Generate
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* PRIVACY POLICY CHECKBOX (Signup only, before OTP) */}
          {!isLogin && !showOtpInput && !forgotMode && (
            <div className="flex items-start gap-3 mt-2">
              <input
                type="checkbox"
                id="privacy-accept"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-600 bg-[#1A202C] text-accentOrange focus:ring-accentOrange focus:ring-offset-0 cursor-pointer accent-orange-500"
              />
              <label htmlFor="privacy-accept" className="text-gray-400 text-xs leading-relaxed cursor-pointer">
                I agree to the{' '}
                <Link to="/privacy" target="_blank" className="text-accentOrange hover:text-orange-400 font-semibold underline underline-offset-2 transition-colors">
                  Privacy Policy
                </Link>
                {' '}and consent to the collection and processing of data as described.
              </label>
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-accentOrange hover:bg-orange-600 text-white font-bold py-3 px-4 rounded transition-colors shadow-lg shadow-orange-500/20 mt-4 disabled:opacity-50"
          >
            {forgotMode === 'request' ? (loading ? 'SENDING...' : 'SEND RESET CODE') : 
             forgotMode === 'verify' ? (loading ? 'RESETTING...' : 'RESET PASSWORD') : 
             isLogin ? 'LOGIN' : (showOtpInput ? 'VERIFY OTP' : (loading ? 'SENDING CODE...' : 'SIGN UP'))}
          </button>
        </form>
        
        {isLogin && !forgotMode && (
          <div className="mt-4 text-right">
            <button 
              type="button"
              onClick={() => { setForgotMode('request'); setError(''); setMessage(''); setEmail(''); }}
              className="text-accentOrange hover:text-orange-400 text-xs font-semibold transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        )}
        
        {!showOtpInput && (
          <div className="mt-8 text-center">
            {forgotMode ? (
              <button 
                onClick={() => {
                  setForgotMode('');
                  setIsLogin(true);
                  setError('');
                  setMessage('');
                  setPassword('');
                }}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Back to Login
              </button>
            ) : (
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setMessage('');
                  setPassword(''); // Clear password when switching views
                }}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Auth;
