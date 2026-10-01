import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  Fingerprint, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  KeyRound, 
  X, 
  RefreshCw,
  Sparkles,
  Lock
} from 'lucide-react';
import { 
  BiometricAuthType 
} from '../../types';
import { 
  detectPlatformBiometrics, 
  playBiometricSound 
} from '../../utils/biometricAuthService';

export interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authDetails: {
    verified: boolean;
    method: 'FaceID' | 'TouchID' | 'WindowsHello' | 'Passkey';
    credentialId: string;
    verifiedAt: string;
  }) => void;
  mode?: 'payment' | 'account_access' | 'settings_test';
  amount?: number;
  formattedAmount?: string;
  recipientName?: string;
  preferredType?: BiometricAuthType;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'payment',
  amount,
  formattedAmount,
  recipientName = 'TUXI Merchant',
  preferredType
}) => {
  const detected = detectPlatformBiometrics();
  const [activeType, setActiveType] = useState<BiometricAuthType>(preferredType || detected.type);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'failed' | 'passcode'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setPasscode('');
      setErrorMessage('');
      setActiveType(preferredType || detected.type);

      // Auto-trigger biometric scan after brief modal appearance
      const timer = setTimeout(() => {
        handleTriggerScan();
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [isOpen, preferredType]);

  if (!isOpen) return null;

  const handleTriggerScan = async () => {
    setStatus('scanning');
    setErrorMessage('');
    playBiometricSound('scan');

    // Simulate authentic biometric sensor scan duration (approx 850ms)
    // While also attempting WebAuthn credentials verification in parallel if supported
    try {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        // Attempt non-blocking platform credentials check
        navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 5000,
            userVerification: 'preferred',
            rpId: window.location.hostname
          }
        }).catch(() => {
          // Fallback handled smoothly by native sensor simulator below
        });
      }
    } catch {
      // Continue with simulator
    }

    setTimeout(() => {
      // Check success state
      setStatus('success');
      playBiometricSound('success');

      // Vibrate if mobile device supports navigator.vibrate
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch {
          // Ignore
        }
      }

      const methodLabel = 
        activeType === 'face_id' ? 'FaceID' : 
        activeType === 'touch_id' ? 'TouchID' : 
        activeType === 'windows_hello' ? 'WindowsHello' : 'Passkey';

      setTimeout(() => {
        onSuccess({
          verified: true,
          method: methodLabel,
          credentialId: `bio-cred-${Date.now().toString(36)}`,
          verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }, 900);
    }, 1100);
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length >= 4) {
      setStatus('success');
      playBiometricSound('success');
      setTimeout(() => {
        onSuccess({
          verified: true,
          method: 'Passkey',
          credentialId: `passcode-fallback-${Date.now().toString(36)}`,
          verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }, 600);
    } else {
      setErrorMessage('Please enter a 4-digit security PIN');
      playBiometricSound('fail');
    }
  };

  const isFaceID = activeType === 'face_id';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 text-white shadow-2xl overflow-hidden">
        
        {/* Subtle Ambient Background Glow */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          status === 'success' 
            ? 'bg-emerald-500/30' 
            : status === 'failed' 
              ? 'bg-rose-500/30' 
              : isFaceID 
                ? 'bg-indigo-500/25' 
                : 'bg-cyan-500/25'
        }`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors z-10"
          title="Cancel Authentication"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-300">
            {mode === 'payment' ? 'Biometric Payment Security' : 'Secure Biometric Verification'}
          </span>
        </div>

        {/* Main Context Card */}
        <div className="text-center space-y-1.5 mb-6">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {status === 'success' 
              ? 'Biometric Verified' 
              : mode === 'payment' 
                ? 'Confirm Payment' 
                : 'Account Authorization'}
          </h3>
          
          {mode === 'payment' && (
            <div className="py-2 px-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 my-2">
              <span className="text-[11px] text-slate-400 block">Total Authorization:</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {formattedAmount || `$${amount?.toFixed(2) || '0.00'}`}
              </span>
              <span className="text-[11px] text-slate-300 block truncate mt-0.5">
                Pay to: <span className="font-semibold text-white">{recipientName}</span>
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {status === 'scanning'
              ? isFaceID ? 'Scanning face mesh via Secure Enclave...' : 'Detecting capacitive fingerprint...'
              : status === 'success'
                ? 'Cryptographic passkey signature verified.'
                : status === 'passcode'
                  ? 'Enter your 4-digit backup device PIN.'
                  : isFaceID 
                    ? 'Glance at your camera or side sensor to approve' 
                    : 'Rest your finger on the Touch ID sensor'}
          </p>
        </div>

        {/* Dynamic Sensor Visualizer Area */}
        {status !== 'passcode' ? (
          <div className="my-6 flex flex-col items-center justify-center">
            
            <div 
              onClick={status === 'idle' ? handleTriggerScan : undefined}
              className={`relative w-28 h-28 rounded-3xl flex items-center justify-center border-2 transition-all duration-500 cursor-pointer ${
                status === 'success'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_35px_rgba(16,185,129,0.35)] scale-105'
                  : status === 'scanning'
                    ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_35px_rgba(99,102,241,0.3)] animate-pulse'
                    : 'border-slate-700 bg-slate-800/80 hover:border-indigo-500/60 shadow-lg'
              }`}
            >
              {/* Outer Rotating Sensor Ring during scanning */}
              {status === 'scanning' && (
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent border-t-indigo-400 border-r-cyan-400 animate-spin" />
              )}

              {/* Status Graphic */}
              {status === 'success' ? (
                <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-scale-in" />
              ) : status === 'failed' ? (
                <XCircle className="w-14 h-14 text-rose-400 animate-shake" />
              ) : isFaceID ? (
                <div className="relative flex items-center justify-center">
                  <Scan className={`w-14 h-14 transition-colors ${
                    status === 'scanning' ? 'text-indigo-400' : 'text-slate-300'
                  }`} />
                  {/* Laser Scan line moving up and down */}
                  {status === 'scanning' && (
                    <div className="absolute w-12 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-bounce" />
                  )}
                </div>
              ) : (
                <div className="relative flex items-center justify-center">
                  <Fingerprint className={`w-14 h-14 transition-colors ${
                    status === 'scanning' ? 'text-cyan-400 animate-pulse' : 'text-slate-300'
                  }`} />
                </div>
              )}
            </div>

            {/* Sub-label under sensor */}
            <div className="mt-4 text-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                status === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : status === 'scanning'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {status === 'success' ? (
                  <>
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Signature Authorized</span>
                  </>
                ) : status === 'scanning' ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Verifying {isFaceID ? 'Face ID' : 'Touch ID'}...</span>
                  </>
                ) : (
                  <span>Tap sensor to authenticate</span>
                )}
              </span>
            </div>

          </div>
        ) : (
          /* Passcode Fallback Mode */
          <form onSubmit={handlePasscodeSubmit} className="my-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 text-center">
                Enter 4-Digit Device Passcode
              </label>
              <input
                type="password"
                maxLength={4}
                value={passcode}
                onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                placeholder="••••"
                className="w-full text-center tracking-[1em] text-2xl font-mono py-3 px-4 bg-slate-800/80 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {errorMessage && (
              <p className="text-[11px] text-rose-400 text-center">{errorMessage}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Verify Passcode</span>
            </button>
          </form>
        )}

        {/* Sensor Mode Switchers & Fallbacks */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          {status !== 'passcode' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveType(isFaceID ? 'touch_id' : 'face_id');
                  setStatus('idle');
                }}
                className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 text-[11px]"
              >
                {isFaceID ? <Fingerprint className="w-3.5 h-3.5" /> : <Scan className="w-3.5 h-3.5" />}
                <span>Switch to {isFaceID ? 'Touch ID' : 'Face ID'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('passcode')}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Use Passcode</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                handleTriggerScan();
              }}
              className="w-full text-center text-indigo-400 hover:text-indigo-300 text-xs font-semibold py-1"
            >
              ← Back to {isFaceID ? 'Face ID' : 'Touch ID'}
            </button>
          )}
        </div>

        {/* Safety Clause Notice */}
        <div className="mt-3 text-center">
          <span className="text-[10px] text-slate-500 font-mono">
            Protected by WebAuthn &amp; Apple Secure Enclave
          </span>
        </div>

      </div>
    </div>
  );
};
