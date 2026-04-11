'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

interface GestureCatchProps {
  amount: number;
  senderName: string;
  onCaught: () => void;
}

// Premium energy particle — geometric, not childish
function EnergyParticle({ delay, index }: { delay: number; index: number }) {
  const angle = (index / 12) * 360;
  const radius = 60 + Math.random() * 80;
  const size = 3 + Math.random() * 5;
  const colors = ['#818cf8', '#a78bfa', '#34d399', '#6366f1', '#10b981', '#c4b5fd'];
  const color = colors[index % colors.length];

  return (
    <motion.div
      initial={{
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
      }}
      animate={{
        x: Math.cos((angle * Math.PI) / 180) * radius,
        y: Math.sin((angle * Math.PI) / 180) * radius,
        opacity: [1, 0.8, 0],
        scale: [1, 0.6, 0],
      }}
      transition={{ delay, duration: 0.9 + Math.random() * 0.4, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: size,
        height: size,
        borderRadius: index % 3 === 0 ? '2px' : '50%',
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        pointerEvents: 'none',
        zIndex: 25,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
    />
  );
}

// Shockwave ring
function ShockwaveRing({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0.2, opacity: 0.9 }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{ delay, duration: 0.7, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 100,
        height: 100,
        borderRadius: '50%',
        border: '2px solid #34d399',
        marginLeft: -50,
        marginTop: -50,
        pointerEvents: 'none',
        zIndex: 22,
      }}
    />
  );
}

export default function GestureCatch({ amount, senderName, onCaught }: GestureCatchProps) {
  const [isCaught, setIsCaught] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [gestureStatus, setGestureStatus] = useState('Initializing Camera...');
  const [palmHoldProgress, setPalmHoldProgress] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [currentGesture, setCurrentGesture] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const HOLD_DURATION = 1800;

  // Voice guidance
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

    async function init() {
      try {
        setGestureStatus('Loading AI Model...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
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
            setGestureStatus('Open your palm — hold steady to catch');
            speak('Ready to catch. Open your palm and hold it steady for 2 seconds to receive the funds.');
            detectGesture();
          };
        }
      } catch (err) {
        console.error('GestureCatch Init Error:', err);
        setGestureStatus('Camera failed. Please allow access.');
      }
    }

    init();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (recognizerRef.current) recognizerRef.current.close();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  let lastVideoTime = -1;

  const detectGesture = () => {
    if (!videoRef.current || !recognizerRef.current || isCaught) return;

    const nowInMs = Date.now();
    if (videoRef.current.currentTime !== lastVideoTime) {
      lastVideoTime = videoRef.current.currentTime;
      const results = recognizerRef.current.recognizeForVideo(videoRef.current, nowInMs);

      if (results.gestures.length > 0) {
        const categoryName = results.gestures[0][0].categoryName;
        setCurrentGesture(categoryName);

        const isPalmOpen = categoryName === 'Open_Palm';

        if (isPalmOpen) {
          if (!holdStartRef.current) {
            holdStartRef.current = Date.now();
            speak('Palm detected. Hold still to catch the transfer.');
          }
          const elapsed = Date.now() - holdStartRef.current;
          const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
          setPalmHoldProgress(progress);
          setGestureStatus('Hold still — catching...');

          if (elapsed >= HOLD_DURATION) {
            triggerCatch();
            return;
          }
        } else {
          holdStartRef.current = null;
          setPalmHoldProgress(0);
          setGestureStatus('Open your palm — hold steady to catch');
        }
      } else {
        holdStartRef.current = null;
        setPalmHoldProgress(0);
        setCurrentGesture('');
        setGestureStatus('Show your open palm');
      }
    }

    requestRef.current = requestAnimationFrame(detectGesture);
  };

  const triggerCatch = () => {
    if (isCaught) return;
    setIsCaught(true);
    setShowParticles(true);
    setGestureStatus('Transfer caught!');
    speak('Transfer caught! Funds are being added to your wallet.');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 80, 200, 80, 300]);
    }
    setTimeout(() => {
      onCaught();
    }, 2000);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      padding: '20px 0',
      position: 'relative',
      width: '100%'
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '6px'
        }}>
          Incoming from {senderName}
        </div>
        <div style={{
          fontSize: '2.8rem',
          fontWeight: '900',
          letterSpacing: '-2px',
          color: 'var(--primary)',
          lineHeight: 1,
          filter: 'drop-shadow(0 0 20px var(--primary-glow))'
        }}>
          ₦{amount.toLocaleString()}
        </div>
      </motion.div>

      {/* Instruction Banner */}
      <AnimatePresence>
        {!isCaught && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: '16px',
              padding: '10px 20px',
              textAlign: 'center',
              maxWidth: '320px'
            }}
          >
            {/* Animated hand icon — no emoji */}
            <motion.div
              animate={{ y: [0, -4, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              style={{ marginBottom: '6px', fontSize: '1.6rem' }}
            >
              ✋
            </motion.div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a5b4fc' }}>
              Open your palm &amp; hold steady
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              The transfer locks in automatically
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webcam + Particle Zone */}
      <div style={{
        position: 'relative',
        width: '280px',
        height: '320px',
        borderRadius: '20px',
        overflow: 'hidden',
        border: isCaught
          ? '2px solid var(--primary)'
          : palmHoldProgress > 0
          ? '2px solid rgba(52,211,153,0.7)'
          : '2px solid rgba(255,255,255,0.08)',
        boxShadow: isCaught
          ? '0 0 50px var(--primary-glow)'
          : palmHoldProgress > 0
          ? `0 0 ${20 + palmHoldProgress * 0.3}px rgba(52,211,153,0.4)`
          : '0 20px 40px rgba(0,0,0,0.5)',
        transition: 'box-shadow 0.3s, border-color 0.3s'
      }}>
        <video
          ref={videoRef}
          playsInline
          autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />

        {/* Progress overlay ring */}
        {palmHoldProgress > 0 && !isCaught && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(52,211,153,${palmHoldProgress / 400})`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}

        {/* Energy burst particles (replaces 💸 rain) */}
        <AnimatePresence>
          {showParticles && (
            <>
              {Array.from({ length: 12 }).map((_, i) => (
                <EnergyParticle key={i} index={i} delay={i * 0.04} />
              ))}
              <ShockwaveRing delay={0} />
              <ShockwaveRing delay={0.15} />
              <ShockwaveRing delay={0.3} />
            </>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        {!isModelLoaded && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(2,6,23,0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px'
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }}
            />
            <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '700', textAlign: 'center', padding: '0 20px' }}>
              {gestureStatus}
            </span>
          </div>
        )}

        {/* Status badge */}
        {isModelLoaded && !isCaught && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '7px 12px',
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: '800',
            color: palmHoldProgress > 0 ? '#34d399' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: palmHoldProgress > 0 ? '#34d399' : '#475569',
              boxShadow: palmHoldProgress > 0 ? '0 0 8px #34d399' : 'none',
              flexShrink: 0
            }} />
            {gestureStatus}
          </div>
        )}

        {/* Caught overlay */}
        <AnimatePresence>
          {isCaught && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 30,
                gap: '10px',
                backdropFilter: 'blur(4px)'
              }}
            >
              {/* Geometric success icon */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.6, repeat: 2 }}
                style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 0 30px rgba(255,255,255,0.3)'
                }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <polyline points="6,18 13,25 26,10" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'white' }}>Transfer Caught!</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>Processing…</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      {isModelLoaded && !isCaught && (
        <div style={{ width: '280px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            marginBottom: '6px',
            color: 'var(--text-muted)',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            <span>Palm Lock Progress</span>
            <span style={{ color: palmHoldProgress > 0 ? '#34d399' : 'inherit' }}>
              {Math.round(palmHoldProgress)}%
            </span>
          </div>
          <div style={{
            height: '6px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #34d399)',
                borderRadius: '6px',
                boxShadow: palmHoldProgress > 0 ? '0 0 10px rgba(52,211,153,0.6)' : 'none'
              }}
              animate={{ width: `${palmHoldProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '5px', textAlign: 'center', fontWeight: '600', letterSpacing: '0.5px' }}>
            Hold for {(HOLD_DURATION / 1000).toFixed(1)}s · {currentGesture ? `${currentGesture.replace('_', ' ')} detected` : 'No hand detected'}
          </div>
        </div>
      )}
    </div>
  );
}
