'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Fingerprint, CheckCircle2, ShieldCheck, BrainCircuit, XCircle, ArrowRightLeft, Wallet, Command } from 'lucide-react';
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
        setTranscript("Speech Recognition not supported in this browser.");
        setStep(-1);
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
        const finalElement = document.getElementById('voice-transcript');
        const finalText = finalElement ? finalElement.innerText : transcript;
        
        if (finalText && finalText.length > 3) {
          processViaGemini(finalText);
        } else {
          setTranscript("No clear intent detected.");
          setStep(-1);
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
        setStep(3); // Biometric verify
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100]);
        
        setTimeout(() => {
          setStep(4);
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00d27b', '#6366f1', '#ffffff'] });
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 300, 100, 300]);
        }, 3000); // 3 sec biometric scan delay
      } else if (text.toLowerCase().includes('balance')) {
        setIntent({ action: 'balance' });
        setStep(5); // Show Balance
      } else if (text.toLowerCase().includes('history') || text.toLowerCase().includes('transactions')) {
         setIntent({ action: 'history' });
         setStep(6);
      } else {
        setStep(-1);
      }
    } catch (e) {
      // Fallback local intent matching
      if (text.toLowerCase().includes('balance')) {
         setIntent({ action: 'balance' });
         setStep(5);
         return;
      }
      setStep(-1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', zIndex: 999 }}
          />

          <div style={{
            position: 'fixed', bottom: '40px', left: '0', right: '0',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, padding: '20px', pointerEvents: 'none'
          }}>
            <motion.div
              layoutId="voice-assistant"
              initial={{ y: 150, opacity: 0, scale: 0.9, borderRadius: '40px' }}
              animate={{ y: 0, opacity: 1, scale: 1, borderRadius: '30px' }}
              exit={{ y: 150, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', bounce: 0.35 }}
              style={{
                width: '100%', maxWidth: '380px', padding: '2rem',
                background: 'rgba(20, 20, 25, 0.85)', backdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.05)',
                pointerEvents: 'auto', position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Dynamic Aura Gradient */}
              <motion.div
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, ease: 'linear', repeat: Infinity }}
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                  background: 'linear-gradient(90deg, #6366f1, #00d27b, #c084fc, #6366f1)',
                  backgroundSize: '300% 300%'
                }}
              />

              <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20}/></button>

              <div style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                {step === 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <BrainCircuit size={32} color="#6366f1" style={{ animation: 'bounce 2s infinite' }} />
                    </div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>Waking Assistant...</h2>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                    {/* Siri-like Orb Wave */}
                    <div style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      {[1, 2, 3].map((i) => (
                         <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            style={{ position: 'absolute', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #00d27b)', filter: 'blur(10px)', zIndex: 0 }} />
                      ))}
                      <div style={{ zIndex: 1, width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.1)' }}>
                        <Mic size={24} color="white" />
                      </div>
                    </div>
                    <div style={{ minHeight: '40px', padding: '0 10px' }}>
                       <p id="voice-transcript" style={{ color: 'white', fontSize: '1.2rem', fontWeight: '600', letterSpacing: '-0.5px' }}>
                         {transcript || "Listening..."}
                       </p>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                    <div style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <BrainCircuit size={40} color="#c084fc" style={{ animation: 'spin 4s linear infinite' }} />
                    </div>
                    <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>Analyzing Intent...</h2>
                    <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                      "{transcript}"
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                    <div style={{ width: '70px', height: '70px', margin: '0 auto 1rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0) 100%)', border: '1px solid rgba(99,102,241,0.5)' }}>
                      <motion.div animate={{ rotateY: 180 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                        <Fingerprint size={36} color="#6366f1" />
                      </motion.div>
                    </div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white' }}>Authorizing Transfer</h2>
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ marginTop: '1rem', background: 'rgba(0, 210, 123, 0.1)', padding: '8px 16px', borderRadius: '20px', color: '#00d27b', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={16} /> Identity Confirmed
                    </motion.div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%' }}>
                    <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', borderRadius: '50%', background: '#00d27b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', boxShadow: '0 0 30px rgba(0,210,123,0.4)' }}>
                      <CheckCircle2 size={40} />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Sent Successfully</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '500' }}>
                      ₦{intent?.amount?.toLocaleString() || 5000} to {intent?.recipient || 'Damilola'}.
                    </p>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%' }}>
                    <div style={{ width: '64px', height: '64px', margin: '0 auto 1rem', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Wallet size={32} color="#6366f1" />
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>Current Balance</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginTop: '4px', letterSpacing: '-1px' }}>₦125,430</h2>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                       <Command size={20} color="var(--primary)" />
                       <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>Recent Transactions</h2>
                     </div>
                     <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                           <span style={{ fontSize: '13px', color: 'white' }}>AirSend Damilola</span>
                           <span style={{ fontSize: '13px', color: 'white', fontWeight: '700' }}>-₦5,000</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                           <span style={{ fontSize: '13px', color: 'white' }}>GTBank Funding</span>
                           <span style={{ fontSize: '13px', color: '#00d27b', fontWeight: '700' }}>+₦50,000</span>
                        </div>
                     </div>
                  </motion.div>
                )}

                {step === -1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
                    <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white' }}>Not Understood</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '13px' }}>Try saying "Send 5000 to David" or "Check my balance".</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
