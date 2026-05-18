import React from 'react';
import { Shield, Eye, Database, Lock, UserCheck, Globe, Mail, AlertTriangle } from 'lucide-react';

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: <Eye size={20} />,
      title: "1. Information We Collect",
      content: [
        "**Personal Information:** When you create an account, we collect your full name, email address, and username. If you sign in via Google OAuth, we receive your name and email from Google's authentication service.",
        "**Campaign Data:** When you create advertising campaigns, we store the website URLs you target, uploaded ad media (images/videos), campaign names, and click-through URLs.",
        "**Behavioral & Biometric Analytics:** Our tracking script (trace.js), when embedded on third-party websites by our users, collects the following data from website visitors who view ads: facial emotion detection data via webcam (processed in real-time, frames are NOT stored), eye gaze tracking coordinates, mouse movement patterns (heatmaps, velocity, hover zones), time spent viewing advertisements, click interactions with ad elements, tab visibility and idle time metrics, and face detection presence percentage.",
        "**Session & Device Data:** We collect browser type, approximate device information, and session timestamps for analytics purposes."
      ]
    },
    {
      icon: <Database size={20} />,
      title: "2. How We Use Your Information",
      content: [
        "**Providing Core Services:** To operate, maintain, and deliver Attention Trace's advertising analytics platform, including campaign management, audience engagement measurement, and real-time emotion-based analytics.",
        "**Analytics & Insights:** To generate aggregated, anonymized analytics reports for our users, including emotion distribution charts, engagement scores, gaze tracking overlays, and behavioral heatmaps.",
        "**Platform Improvement:** To understand usage patterns and improve our platform's features, performance, and user experience.",
        "**Communication:** To send you account-related emails such as OTP verification codes, password reset links, and critical service announcements.",
        "**Security & Fraud Prevention:** To protect against unauthorized access, abuse, and to enforce our terms of service."
      ]
    },
    {
      icon: <Lock size={20} />,
      title: "3. Data Processing & Storage",
      content: [
        "**Webcam Data Processing:** Video frames captured by our tracking script are processed in real-time on the server for emotion detection and gaze analysis. Raw video frames are NEVER stored, saved, or recorded. Only the computed analytics results (emotion labels, gaze coordinates, engagement scores) are retained.",
        "**Data Storage:** Your account information and campaign analytics are stored in encrypted MongoDB Atlas databases hosted on secure cloud infrastructure. Uploaded ad media files are stored on the server hosting our backend services.",
        "**Data Retention:** We retain your account data and campaign analytics for the duration of your active account. You may request deletion of your account and all associated data at any time by contacting us.",
        "**Data Encryption:** All data transmitted between your browser and our servers is encrypted using TLS/SSL (HTTPS). Passwords are hashed using bcrypt with individual salts."
      ]
    },
    {
      icon: <UserCheck size={20} />,
      title: "4. Website Visitor Consent & Disclosure",
      content: [
        "**User Responsibility:** As a user of Attention Trace, you are responsible for ensuring that visitors to websites where you embed our tracking script are informed about and consent to the data collection described in this policy.",
        "**Required Disclosures:** You must display a clear and conspicuous notice on any website using our tracking script, informing visitors that: webcam access may be requested for engagement analytics, behavioral data (mouse movements, clicks, time spent) is collected, and facial emotion analysis is performed in real-time.",
        "**Webcam Permission:** Our tracking script requests webcam access through the browser's standard permission dialog. Visitors can deny this request, and the script will fall back to behavioral-only tracking without any facial or gaze data.",
        "**Opt-Out Mechanism:** Website visitors can dismiss tracked advertisements at any time using the on-screen dismiss button. Closing the browser tab or navigating away also immediately terminates all tracking."
      ]
    },
    {
      icon: <Globe size={20} />,
      title: "5. Third-Party Services",
      content: [
        "**Google OAuth:** We use Google's authentication service for optional social login. Google's privacy policy governs the data they process during authentication.",
        "**ngrok Tunneling (Development):** During development and testing, we may use ngrok for secure tunneling. In production, this is replaced with direct hosting.",
        "**MongoDB Atlas:** Our database is hosted on MongoDB Atlas, which maintains its own security and privacy certifications.",
        "We do NOT sell, rent, or share your personal information or analytics data with any third parties for marketing purposes."
      ]
    },
    {
      icon: <Shield size={20} />,
      title: "6. Your Rights & Choices",
      content: [
        "**Access:** You may access your personal information and campaign data through your Attention Trace dashboard at any time.",
        "**Correction:** You may update your account details through the platform or by contacting our support team.",
        "**Deletion:** You may request complete deletion of your account and all associated data (campaigns, sessions, analytics) by contacting us at the email below.",
        "**Data Portability:** You may request an export of your campaign analytics data in a machine-readable format.",
        "**Withdraw Consent:** You may stop using our services and request account deletion at any time. Website visitors can deny webcam permissions or dismiss ads to limit data collection."
      ]
    },
    {
      icon: <AlertTriangle size={20} />,
      title: "7. Children's Privacy",
      content: [
        "Attention Trace is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child under 18 has provided us with personal information, we will take steps to delete such information promptly.",
        "Users embedding our tracking script must not knowingly target websites or content primarily directed at children under 18."
      ]
    },
    {
      icon: <Mail size={20} />,
      title: "8. Changes to This Policy",
      content: [
        "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. We will notify you of any material changes by posting the updated policy on our platform and updating the 'Last Updated' date.",
        "Your continued use of Attention Trace after any modifications to this Privacy Policy constitutes your acceptance of the updated terms."
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 animate-fade-in">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accentOrange/20 to-accentBlue/20 border border-white/10 mb-6">
          <Shield size={28} className="text-accentOrange" />
        </div>
        <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">
          Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentOrange to-accentBlue">Policy</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Your privacy matters to us. This policy explains how Attention Trace collects, uses, and protects your data.
        </p>
        <p className="text-gray-500 text-sm mt-3">Last Updated: May 15, 2026</p>
      </div>

      <div className="space-y-8">
        {sections.map((section, i) => (
          <div key={i} className="glass-card rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-accentOrange/10 flex items-center justify-center text-accentOrange">
                {section.icon}
              </div>
              <h2 className="text-xl font-bold text-white">{section.title}</h2>
            </div>
            <div className="space-y-4">
              {section.content.map((paragraph, j) => (
                <p key={j} className="text-gray-400 text-sm leading-relaxed"
                   dangerouslySetInnerHTML={{
                     __html: paragraph
                       .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-200 font-semibold">$1</strong>')
                   }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-8 border border-accentOrange/20 mt-12 text-center">
        <h3 className="text-lg font-bold text-white mb-2">Contact Us</h3>
        <p className="text-gray-400 text-sm mb-4">
          If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us:
        </p>
        <a href="mailto:sujanchaurasia22@gmail.com" className="text-accentOrange hover:text-orange-400 font-semibold transition-colors">
          sujanchaurasia22@gmail.com
        </a>
      </div>
    </div>
  );
}
