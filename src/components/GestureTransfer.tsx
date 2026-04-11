'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, AlertCircle, Zap } from 'lucide-react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

interface GestureTransferProps {
  recipient: { name: string };
  amount: number;
  onComplete: () => void;
}

// Orbiting particle trail for the transfer orb
function OrbParticle({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * 360;
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2 + index * 0.3, repeat: Infinity, ease: 'linear' }}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: index % 2 === 0 ? '#818cf8' : '#34d399',
          boxShadow: `0 0 8px ${index % 2 === 0 ? '#818cf8' : '#34d399'}`,
          top: '0%',
          left: '50%',
          marginLeft: -2.5,
          transform: `rotate(${angle}deg) translateY(-32px)`,
        }}
      />
    </motion.div>
  );
}

export default function GestureTransfer({ recipient, amount, onComplete }: GestureTransferProps) {
  const [isThrown, setIsThrown] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [gestureStatus, setGestureStatus] = useState('Initializing Model...');

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number | null>(null);

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0;
    utt.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') && v.lang === 'en-US') || voices.find(v => v.lang === 'en-US');
    if (preferred) utt.voice = preferred;
    window.speechSynthesis.speak(utt);
  };

  useEffect(() => {
    let active = true;

    async function initCameraAndModel() {
      try {
        setGestureStatus('Loading Assets...');
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (!active) return;
        recognizerRef.current = recognizer;
        setIsModelLoaded(true);
        setGestureStatus('Requesting Camera...');

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play();
             setGestureStatus('Show palm to send funds');
             speak(`Ready to send ${amount.toLocaleString()} Naira to ${recipient.name}. Open or point your palm upward to trigger the transfer.`);
             detectGesture();
          }
        }
      } catch (err) {
        console.error("Gesture Init Error:", err);
        setGestureStatus('Camera or Model failed to load.');
      }
    }

    initCameraAndModel();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (recognizerRef.current) recognizerRef.current.close();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t: any) => t.stop());
      }
    };
  }, []);

  let lastVideoTime = -1;
  const detectGesture = () => {
    if (!videoRef.current || !recognizerRef.current || isThrown) return;

    const nowInMs = Date.now();
    if (videoRef.current.currentTime !== lastVideoTime) {
      lastVideoTime = videoRef.current.currentTime;
      const results = recognizerRef.current.recognizeForVideo(videoRef.current, nowInMs);

      if (results.gestures.length > 0) {
        const categoryName = results.gestures[0][0].categoryName;
        if (categoryName === 'Open_Palm' || categoryName === 'Pointing_Up' || categoryName === 'Thumb_Up') {
           triggerTransfer();
           return;
        }
      }
    }

    requestRef.current = requestAnimationFrame(detectGesture);
  };

  const triggerTransfer = () => {
     if (isThrown) return;
     if (typeof navigator !== 'undefined' && navigator.vibrate) {
       navigator.vibrate([100, 50, 100]);
     }
     setIsThrown(true);
     setGestureStatus('Transfer Launched!');
     speak(`Sending ${amount.toLocaleString()} Naira to ${recipient.name}. Please wait.`);
     setTimeout(() => {
        onComplete();
     }, 1200);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '550px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0' }}>
      {/* Recipient Zone */}
      <motion.div
        animate={{
          scale: isThrown ? [1, 1.2, 1] : [1, 1.04, 1],
          boxShadow: isThrown ? '0 0 60px rgba(99,102,241,0.6)' : '0 0 20px rgba(255,255,255,0.04)'
        }}
        transition={{ scale: { repeat: isThrown ? 0 : Infinity, duration: 2.2 } }}
        style={{
          width: '100px',
          height: '100px',
          background: 'rgba(99,102,241,0.06)',
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(99,102,241,0.35)',
          zIndex: 5,
          position: 'relative'
        }}
      >
        <AnimatePresence>
          {isThrown && (
            // Sleek launch orb that flies up (no emoji)
            <motion.div
              initial={{ y: 0, scale: 1, opacity: 1 }}
              animate={{ y: -320, scale: [1, 0.5, 0.1], opacity: [1, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'circIn' }}
              style={{
                position: 'absolute',
                top: -30,
                left: '50%',
                marginLeft: -14,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                boxShadow: '0 0 20px rgba(99,102,241,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20
              }}
            >
              <Zap size={12} color="white" />
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <User size={28} />
        </div>
        <span style={{ fontSize: '11px', marginTop: '8px', fontWeight: '700', color: '#c7d2fe' }}>{recipient.name}</span>
      </motion.div>

      {/* Instruction */}
      {!isThrown && (
        <motion.div
          animate={{ y: [0, -8, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          style={{ position: 'absolute', top: '30%', textAlign: 'center', zIndex: 10 }}
        >
          <div style={{ fontSize: '0.85rem', marginBottom: '6px', fontWeight: '700', color: '#a5b4fc' }}>
            Open palm to send ₦{amount.toLocaleString()}
          </div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} style={{ color: '#6366f1', fontSize: '1.1rem' }}>↑</motion.div>
        </motion.div>
      )}

      {/* Webcam View */}
      <div style={{ position: 'relative', width: '260px', height: '290px', marginBottom: '30px', borderRadius: '20px', overflow: 'hidden', border: '2px solid rgba(99,102,241,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <video ref={videoRef} playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />

        {!isModelLoaded && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              style={{ width: '36px', height: '36px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }}
            />
            <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '700', textAlign: 'center', padding: '0 16px' }}>{gestureStatus}</span>
          </div>
        )}

        {isModelLoaded && !isThrown && (
          <div style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', textAlign: 'center', fontSize: '11px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '7px 16px', margin: '0 14px', borderRadius: '12px', fontWeight: '700', color: '#a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1', animation: 'pulse 1s infinite' }} />
            {gestureStatus}
          </div>
        )}

        {/* Transfer Animation Overlay — premium gradient, no emoji */}
        <AnimatePresence>
          {isThrown && (
             <motion.div
               initial={{ y: 0, scale: 1, opacity: 1 }}
               animate={{ y: -400, scale: [1, 0.4, 0.1], opacity: [1, 1, 0], filter: 'blur(3px)' }}
               transition={{ duration: 0.85, ease: "circIn" }}
               style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 40%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15 }}
             >
               {/* Orbiting particles — no coins emoji */}
               <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {Array.from({ length: 6 }).map((_, i) => (
                   <OrbParticle key={i} index={i} total={6} />
                 ))}
                 <Zap size={32} color="white" style={{ filter: 'drop-shadow(0 0 12px white)' }} />
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sender avatar */}
      <div style={{
        position: 'absolute',
        bottom: '-80px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        opacity: 0.65
      }}>
        <div style={{ width: '40px', height: '40px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px' }}>
          <User size={18} color="#818cf8" />
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>You</span>
      </div>
    </div>
  );
}
