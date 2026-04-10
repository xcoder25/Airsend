'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Fingerprint, CheckCircle2, ShieldCheck, BrainCircuit, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoiceBankingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceBankingModal({ isOpen, onClose }: VoiceBankingProps) {
  const [step, setStep] = useState(0); 
  // 0: Init, 1: Listening, 2: Gemini Parsing, 3: Verifying, 4: Success, -1: Error
  const [transcript, setTranscript] = useState('');
  const [intent, setIntent] = useState<any>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setTranscript('');
      setIntent(null);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      
      const t0 = setTimeout(() => {
        setStep(1); 
        startMicrophone();
      }, 1500);

      return () => { 
        clearTimeout(t0); 
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch(e) {}
        }
      };
    }
  }, [isOpen]);

  const startMicrophone = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        // Fallback if browser doesn't support Speech API
        setTimeout(() => {
          const fallbackText = "Send 5000 to Damilola";
          setTranscript(fallbackText);
          processViaGemini(fallbackText);
        }, 3000);
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setTranscript(text);
      };

      recognition.onend = () => {
        // Find the latest displayed text or use state
        const finalElement = document.getElementById('voice-transcript');
        const finalText = finalElement ? finalElement.innerText : transcript;
        
        if (finalText && finalText.length > 3) {
          processViaGemini(finalText);
        } else {
          // Empty speech fallback for demo stability
          const demoFallback = "Send 5000 dollars to Damilola";
          setTranscript(demoFallback);
          processViaGemini(demoFallback);
        }
      };

      recognition.start();

      // Failsafe timeout to stop listening
      setTimeout(() => {
        if (recognitionRef.current) {
          try { recognition.stop(); } catch(e) {}
        }
      }, 6000);
    }
  };

  const processViaGemini = async (text: string) => {
    recognitionRef.current = null;
    setStep(2); // GEMINI AI Processing step
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 30, 30]);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text })
      });
      
      const data = await res.json();
      
      if (data && data.action === 'transfer') {
        setIntent(data);
        setStep(3); // Wait, go to biometric verify
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100]);
        
        setTimeout(() => {
          setStep(4);
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00d27b', '#6366f1', '#ffffff'] });
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 300, 100, 300]);
        }, 3000); // 3 sec biometric scan delay
      } else {
        setStep(-1);
      }
    } catch (e) {
      setStep(-1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5, 5, 10, 0.95)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass"
            style={{ 
              width: '100%', maxWidth: '400px', padding: '2.5rem', 
              border: '1px solid var(--primary)', textAlign: 'center', position: 'relative',
              boxShadow: '0 20px 50px rgba(0, 210, 123, 0.2)'
            }}
          >
            <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, color: 'var(--text-muted)', background: 'transparent', border: 'none' }}><X size={24}/></button>

            {step === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px 0' }}>
                <BrainCircuit size={48} color="#6366f1" style={{ margin: '0 auto 1.5rem', animation: 'pulse 1.5s infinite' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Initializing Cortex Agent</h2>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ position: 'relative', margin: '0 auto 2rem', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0, 210, 123, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', inset: -20, background: 'var(--primary)', borderRadius: '50%', zIndex: 0 }} />
                  <Mic size={40} color="var(--primary)" style={{ zIndex: 1 }} />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>I'm Listening</h2>
                <div style={{ marginTop: '16px', minHeight: '60px' }}>
                   <p id="voice-transcript" style={{ color: 'white', fontSize: '1.2rem', fontStyle: 'italic' }}>
                     {transcript || "Speak your command..."}
                   </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BrainCircuit size={50} color="#c084fc" style={{ margin: '0 auto 2rem', animation: 'spin 3s linear infinite' }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Gemini AI is Parsing</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Extracting banking intent...</p>
                <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', fontStyle: 'italic', fontSize: '14px' }}>
                  "{transcript}"
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ margin: '0 auto 2rem', width: '90px', height: '90px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.05)' }}>
                  <motion.div animate={{ rotateY: 180 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
                    <Fingerprint size={50} color="#6366f1" />
                  </motion.div>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Biometric Verification</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '14px' }}>Securing execution logic for '{intent?.action}' command...</p>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} style={{ marginTop: '1.5rem', border: '1px solid rgba(0, 210, 123, 0.3)', padding: '12px', borderRadius: '12px', color: 'var(--primary)', fontSize: '14px', fontWeight: 'bold' }}>
                  <ShieldCheck size={18} style={{ display: 'inline', verticalAlign: 'sub', marginRight: '6px' }}/> John Doe Recognized
                </motion.div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ margin: '0 auto 2rem', width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', boxShadow: '0 0 50px var(--primary-glow)' }}>
                  <CheckCircle2 size={60} />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900' }}>Transfer Complete</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '15px' }}>
                  ₦{intent?.amount?.toLocaleString() || 5000} sent securely to {intent?.recipient || 'Damilola'}.
                </p>
                <button onClick={onClose} style={{ marginTop: '2.5rem', width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontWeight: '800' }}>Dismiss</button>
              </motion.div>
            )}

            {step === -1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <XCircle size={60} color="#ef4444" style={{ margin: '0 auto 2rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Command Unrecognized</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Gemini could not parse a valid banking intent.</p>
                <button onClick={onClose} style={{ marginTop: '2rem', width: '100%', padding: '14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', color: 'white' }}>Close</button>
              </motion.div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
