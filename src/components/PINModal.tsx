import React, { useState } from 'react';
import { Lock, Fingerprint, Delete } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PINModal: React.FC = () => {
  const { unlockWithPIN, user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const verify = (code: string) => {
    const success = unlockWithPIN(code);
    if (!success) {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 700);
    }
  };

  const handleBiometricSim = () => {
    // Quick biometric unlock simulation for student devices
    const savedPin = localStorage.getItem('thuto_security_pin_v1');
    if (savedPin) {
      unlockWithPIN(savedPin);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-xs flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 mb-4 shadow-lg">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-display font-bold text-white">
          Thuto App Lock
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Enter 4-digit PIN to access {user?.fullName || 'student session'}
        </p>

        {/* PIN Indicators */}
        <div className={`flex items-center justify-center gap-4 mb-8 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all ${
                error
                  ? 'bg-rose-500 scale-110'
                  : pin.length > idx
                  ? 'bg-amber-400 scale-125'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-medium mb-4 -mt-4">
            Incorrect PIN. Please try again.
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-xl font-display font-semibold text-slate-100 hover:bg-slate-800 active:scale-95 transition"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBiometricSim}
            title="Biometric Fingerprint Unlock"
            className="h-14 rounded-2xl bg-slate-900/50 border border-slate-800/40 text-amber-400 flex items-center justify-center hover:bg-slate-800/80 active:scale-95 transition"
          >
            <Fingerprint className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-xl font-display font-semibold text-slate-100 hover:bg-slate-800 active:scale-95 transition"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            title="Delete Digit"
            className="h-14 rounded-2xl bg-slate-900/50 border border-slate-800/40 text-slate-400 flex items-center justify-center hover:bg-slate-800/80 active:scale-95 transition"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleBiometricSim}
          className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition py-2"
        >
          <Fingerprint className="w-4 h-4 text-amber-400" /> Unlock with Biometrics
        </button>
      </div>
    </div>
  );
};
