'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Coins, AlertCircle } from 'lucide-react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

interface GestureTransferProps {
  recipient: { name: string };
  amount: number;
  onComplete: () => void;
}

export default function GestureTransfer({ recipient, amount, onComplete }: GestureTransferProps) {
  const [isThrown, setIsThrown] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [gestureStatus, setGestureStatus] = useState('Initializing Model...');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>();
  
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
             setGestureStatus('Show Palm to Trigger');
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
        // Trigger on simple confident gestures available out of the box
        if (categoryName === 'Open_Palm' || categoryName === 'Pointing_Up' || categoryName === 'Thumb_Up') {
           triggerTransfer();
           return;
        }
      }
    }
    
    requestRef.current = requestAnimationFrame(detectGesture);
  };

  const triggerTransfer = () => {
     if (isThrown) return; // Prevent double trigger
     if (typeof navigator !== 'undefined' && navigator.vibrate) {
       navigator.vibrate([100, 50, 100]);
     }
     setIsThrown(true);
     setGestureStatus('Transfer Triggered!');
     setTimeout(() => {
        onComplete();
     }, 1200);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '550px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0' }}>
      {/* Target Zone (Recipient) */}
      <motion.div animate={{ scale: isThrown ? [1, 1.3, 1] : [1, 1.05, 1], boxShadow: isThrown ? '0 0 60px var(--primary)' : '0 0 20px rgba(255,255,255,0.05)' }} transition={{ scale: { repeat: isThrown ? 0 : Infinity, duration: 2 } }} style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--primary)', zIndex: 5, position: 'relative' }}>
        <AnimatePresence>
          {isThrown && (
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: [-30, -50], opacity: [0, 1, 0] }}
              style={{ position: 'absolute', top: -30, fontSize: '24px' }}
            >
              💸
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
          <User size={32} />
        </div>
        <span style={{ fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>{recipient.name}</span>
      </motion.div>

      {/* Throw Instruction */}
      {!isThrown && (
        <motion.div animate={{ y: [0, -10, 0], opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', top: '32%', color: 'var(--text-muted)', textAlign: 'center', zIndex: 10 }}>
          <div style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: '500' }}>Show Palm to Throw ₦{amount.toLocaleString()}</div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>↑</motion.div>
        </motion.div>
      )}

      {/* Webcam View */}
      <div style={{ position: 'relative', width: '260px', height: '300px', marginBottom: '40px', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <video ref={videoRef} playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        
        {/* Loading / Status Overlay */}
        {!isModelLoaded && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary)' }}>
            <AlertCircle size={32} className="animate-pulse" style={{ animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '0 16px' }}>{gestureStatus}</span>
          </div>
        )}
        
        {isModelLoaded && !isThrown && (
          <div style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', textAlign: 'center', fontSize: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '8px 16px', margin: '0 16px', borderRadius: '12px', fontWeight: 'bold' }}>
            <span style={{ color: 'var(--primary)', marginRight: '6px' }}>●</span> {gestureStatus}
          </div>
        )}

        {/* Transfer Animation Overlay */}
        <AnimatePresence>
          {isThrown && (
             <motion.div initial={{ y: 0, scale: 1, opacity: 1 }} animate={{ y: -400, scale: [1, 0.4, 0.1], opacity: [1, 1, 0], filter: 'blur(2px)' }} transition={{ duration: 0.8, ease: "circIn" }} style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #00d27b 0%, #00a862 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15 }}>
               <Coins size={64} color="black" />
             </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Your Avatar at bottom */}
      <div style={{
        position: 'absolute',
        bottom: '-90px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        opacity: 0.7
      }}>
        <div style={{ width: '44px', height: '44px', background: 'var(--surface-secondary)', borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
          <User size={20} />
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500' }}>You</span>
      </div>
    </div>
  );
}
