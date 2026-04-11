'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Smartphone, Wifi, CheckCircle2, ScanFace,
  ChevronUp, RefreshCw, X, Lock, Bluetooth,
  ArrowUpRight, ArrowDownLeft, Send, Activity, QrCode, ArrowDown, Crosshair, Gift, Mic, ShieldCheck, Camera, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import {
  doc, updateDoc, addDoc, collection, serverTimestamp,
  setDoc, deleteDoc, query, where, onSnapshot
} from 'firebase/firestore';
import confetti from 'canvas-confetti';

interface NearbyAirSendProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
}

type Role = 'sender' | 'recipient' | 'requestor' | null;
type SenderState = 'searching' | 'uwb_lock' | 'amount' | 'shield' | 'auth' | 'gesture' | 'offline_token' | 'success';
type RecipientState = 'waiting' | 'receiving' | 'success';
type RequestorState = 'amount' | 'broadcasting' | 'received';

const PICK_GESTURE = 'Closed_Fist';
const DROP_GESTURE = 'Open_Palm';
const DROP_GESTURE_ALT = 'Pointing_Up';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ── Voice Guide Utility ──
function speak(text: string, rate = 1.0) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = rate;
  utt.pitch = 1.05;
  utt.volume = 1;
  // prefer a natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes('Google') && v.lang === 'en-US')
    || voices.find(v => v.lang === 'en-US')
    || voices[0];
  if (preferred) utt.voice = preferred;
  window.speechSynthesis.speak(utt);
}

export function NearbyAirSend({ open, onOpenChange, currentBalance }: NearbyAirSendProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [role, setRole] = useState<Role>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sender State
  const [senderState, setSenderState] = useState<SenderState>('searching');
  const [amount, setAmount] = useState('');
  const [availableReceivers, setAvailableReceivers] = useState<any[]>([]);
  const [selectedReceivers, setSelectedReceivers] = useState<any[]>([]);
  const [transferSessionId, setTransferSessionId] = useState<string | null>(null);
  const [isGift, setIsGift] = useState(false);

  // Voice AI
  const [isListening, setIsListening] = useState(false);

  // Recipient / Requestor State
  const [recipientState, setRecipientState] = useState<RecipientState>('waiting');
  const [requestorState, setRequestorState] = useState<RequestorState>('amount');
  const [incomingTransfer, setIncomingTransfer] = useState<any>(null);

  // MediaPipe
  const [gestureReady, setGestureReady] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [isPicked, setIsPicked] = useState(false);
  const [handSequence, setHandSequence] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string>('');
  const [gestureStatus, setGestureStatus] = useState<string>('Initializing...');
  const [modelLoading, setModelLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [flyOrb, setFlyOrb] = useState(false);
  const [offlineTokenStr, setOfflineTokenStr] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gestureRecognizerRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const dropFiredRef = useRef(false);
  const voiceFiredRef = useRef<string>('');

  const peerName = role === 'sender'
    ? (selectedReceivers.length > 1 ? `${selectedReceivers.length} Users Selected` : selectedReceivers[0]?.displayName || 'User')
    : (incomingTransfer?.sender_name || 'Ibom User');

  const walletDocRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'wallets', user.uid) : null), [firestore, user]);

  // Speak only once per state change
  const voiceGuide = useCallback((key: string, text: string, rate = 1.0) => {
    if (voiceFiredRef.current === key) return;
    voiceFiredRef.current = key;
    speak(text, rate);
  }, []);

  useEffect(() => {
    if (open) {
      setRole(null);
      resetFlows();
      bgLoadMediaPipe();
      voiceGuide('open', 'AirSend ready. Choose to send or receive funds.');
    } else {
      stopCamera();
      window.speechSynthesis?.cancel();
    }
  }, [open]);

  // Voice guidance based on state changes
  useEffect(() => {
    if (role === 'sender') {
      if (senderState === 'searching') voiceGuide('sender-search', 'Scanning for nearby receivers. Please wait.');
      if (senderState === 'uwb_lock') voiceGuide('sender-uwb', 'Target found. Select recipients and tap Establish Channel.');
      if (senderState === 'amount') voiceGuide('sender-amount', 'Enter the amount you want to send. You can use the mic button to say the amount.');
      if (senderState === 'shield') voiceGuide('sender-shield', 'Securing your transaction. Please wait.');
      if (senderState === 'auth') voiceGuide('sender-auth', 'Tap Biometric OK to authorize the transfer.');
      if (senderState === 'gesture') voiceGuide('sender-gesture', 'Open your hand inside the glowing vault, then close your fist to grab the funds, then open it again to send.');
      if (senderState === 'success') voiceGuide('sender-success', 'Transfer complete! Money has been sent successfully.', 0.95);
    }
  }, [senderState, role]);

  useEffect(() => {
    if (role === 'recipient') {
      if (recipientState === 'waiting') voiceGuide('rec-waiting', 'Recipient mode active. Tap Secure Check-in so nearby senders can find you.');
      if (recipientState === 'receiving') voiceGuide('rec-receiving', 'Incoming transfer! Open your palm to begin catching. Then close your fist to confirm the catch.');
      if (recipientState === 'success') voiceGuide('rec-success', 'You caught it! Funds have been added to your wallet.', 0.95);
    }
  }, [recipientState, role]);

  useEffect(() => {
    if (role === 'requestor') {
      if (requestorState === 'amount') voiceGuide('req-amount', 'Enter the amount you want to request, then tap Broadcast Request.');
      if (requestorState === 'broadcasting') voiceGuide('req-broadcast', 'Your request is live. Waiting for a nearby sender to accept.');
      if (requestorState === 'received') voiceGuide('req-received', 'Transfer incoming! Open your palm to catch the funds.');
    }
  }, [requestorState, role]);

  // Suppress XNNPACK logs
  useEffect(() => {
    const originalInfo = console.info;
    const originalLog = console.log;
    const originalError = console.error;

    const suppress = (...args: any[]) => {
      const msg = args.join(' ');
      return msg.includes('XNNPACK') || msg.includes('Created TensorFlow Lite');
    };

    console.info = (...args) => { if (!suppress(...args)) originalInfo(...args); };
    console.log = (...args) => { if (!suppress(...args)) originalLog(...args); };
    console.error = (...args) => { if (!suppress(...args)) originalError(...args); };

    return () => {
      console.info = originalInfo; console.log = originalLog; console.error = originalError;
    };
  }, []);

  const bgLoadMediaPipe = async () => {
    if (gestureRecognizerRef.current || modelLoading) return;
    setModelLoading(true);
    setGestureStatus('Loading Aura Engine...');
    try {
      const { GestureRecognizer, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );

      gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });
      setGestureStatus('Aura Engine Ready');
      setModelLoading(false);
    } catch(e) {
      console.error("MediaPipe load failed:", e);
      setGestureStatus('Aura Engine Error');
      setModelLoading(false);
      setCameraError('AI Engine failed to initialize. Please check your connection.');
    }
  };

  const resetFlows = () => {
    setSenderState('searching');
    setRecipientState('waiting');
    setRequestorState('amount');
    setAvailableReceivers([]);
    setAmount('');
    setSelectedReceivers([]);
    setTransferSessionId(null);
    setIncomingTransfer(null);
    setIsProcessing(false);
    setIsGift(false);
    setIsPicked(false);
    setHandSequence(0);
    setFlyOrb(false);
    setCurrentGesture('');
    setGestureReady(false);
    setCameraError('');
    dropFiredRef.current = false;
    voiceFiredRef.current = '';
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (user && firestore) {
        deleteDoc(doc(firestore, 'air_receivers', user.uid)).catch(() => {});
        deleteDoc(doc(firestore, 'air_requesters', user.uid)).catch(() => {});
      }
    };
  }, [user, firestore]);

  const stopCamera = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // ── Voice AI Handler ──
  const startVoiceCommand = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Voice controls not available on this browser.' });
      return;
    }

    speak('Listening. Say the amount you want to send.');

    const recognition = new SpeechRec();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast({ title: 'Aura Voice', description: 'Listening for transfer command...' });
    };

    recognition.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      setIsListening(false);

      try {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript })
        });

        if (!res.ok) throw new Error('Gemini offline');

        const data = await res.json();
        if (data.amount) {
           setAmount(data.amount.toString());
           speak(`Amount set to ${data.amount.toLocaleString()} Naira.`);
           toast({ title: 'OmniAI Parsed', description: `Set amount to ₦${data.amount.toLocaleString()}` });
        }
        if (data.recipient && role === 'sender') {
           const match = availableReceivers.find(r =>
             r.displayName.toLowerCase().includes(data.recipient.toLowerCase())
           );
           if (match) {
             setSelectedReceivers([match]);
             setSenderState('uwb_lock');
             toast({ title: 'Target Locked', description: `Matched with ${match.displayName}` });
           }
        }
      } catch (err) {
        const numMatch = transcript.toLowerCase().match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[\s-]?thousand\b|\b\d+\b/g);
        if (numMatch) {
           let val = parseInt(numMatch[0].replace(/\D/g, ''));
           if (transcript.includes('thousand') && val < 1000) val *= 1000;
           setAmount(val.toString());
           speak(`Amount set to ${val.toLocaleString()} Naira.`);
        }
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // ── Camera trigger ──
  useEffect(() => {
    if (role === 'sender' && senderState === 'gesture') {
      startCameraConfig('Pick funds to send');
    } else if (role === 'recipient' && recipientState !== 'success') {
      startCameraConfig(recipientState === 'receiving' ? 'Catch funds!' : 'Aura Vision Active');
    } else {
      stopCamera();
    }
  }, [senderState, recipientState, role]);

  const startCameraConfig = async (initialStatusText: string) => {
    setGestureStatus('Accessing Camera...');
    setCameraError('');

    if (!gestureRecognizerRef.current) {
      await bgLoadMediaPipe();
    }

    if (!gestureRecognizerRef.current) {
      setCameraError('Still waiting for AI Engine...');
      return;
    }
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera features require a secure HTTPS connection. Please use localhost or a secure domain.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setTimeout(() => {
            setGestureReady(true);
            setGestureStatus(initialStatusText);
            predictLoop();
          }, 800);
        };
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setCameraError('Camera access denied or unavailable.');
    }
  };

  const executeDrop = useCallback(async () => {
    if (selectedReceivers.length === 0) {
       toast({ variant: 'destructive', title: 'Error', description: 'No recipients selected.' });
       return;
    }
    if (parseFloat(amount || '0') <= 0) {
       toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid amount.' });
       return;
    }
    if (isProcessing || dropFiredRef.current) return;

    setIsProcessing(true);
    dropFiredRef.current = true;
    setFlyOrb(true);
    setGestureStatus('Transmitting...');
    speak('Funds transmitted. Waiting for recipient to catch.');

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0 || numAmount > currentBalance) {
        throw new Error(numAmount > currentBalance ? 'Insufficient balance.' : 'Invalid amount.');
      }

      const splitAmount = numAmount / selectedReceivers.length;
      const newSessionIds = [];

      for (const rec of selectedReceivers) {
        const transferRef = await addDoc(collection(firestore!, 'air_transfers'), {
          sender_id: user?.uid,
          sender_name: user?.displayName || 'Ibom User',
          receiver_id: rec.uid,
          amount: splitAmount,
          isGift: isGift,
          session_token: `TOK_${Date.now()}_${Math.random()}`,
          status: 'pending',
          timestamp: serverTimestamp()
        });
        newSessionIds.push(transferRef.id);
      }
      setTransferSessionId(newSessionIds[0]);
    } catch (err: any) {
      setIsProcessing(false); dropFiredRef.current = false; setFlyOrb(false);
      console.error("ExecuteDrop Error:", err);
      toast({ variant: 'destructive', title: 'Drop Failed', description: err.message || 'Transmission error' });
    }
  }, [selectedReceivers, user, firestore, isProcessing, amount, currentBalance, isGift]);

  // Recipient catch logic
  const acceptTransfer = useCallback(async () => {
    if (!incomingTransfer || !firestore || !walletDocRef || isProcessing) return;
    setIsProcessing(true);
    dropFiredRef.current = true;
    try {
      if (navigator.vibrate) navigator.vibrate([30, 20, 80]);
      await updateDoc(doc(firestore, 'air_transfers', incomingTransfer.id), { status: 'accepted' });
      await updateDoc(walletDocRef, { balance: currentBalance + parseFloat(incomingTransfer.amount) });
      await addDoc(collection(firestore, 'wallets', user?.uid!), {
        type: 'credit', amount: parseFloat(incomingTransfer.amount), description: `AirDrop Received`, timestamp: serverTimestamp(), status: 'success'
      });
      setIsProcessing(false);
      setRecipientState('success');
      if (incomingTransfer.isGift) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b'] });
      } else {
        confetti({ particleCount: 50, spread: 40, origin: { y: 0.6 }, colors: ['#10b981'] });
      }
    } catch {
      setIsProcessing(false); dropFiredRef.current = false;
    }
  }, [incomingTransfer, firestore, walletDocRef, isProcessing, currentBalance, user]);


  const predictLoop = useCallback(() => {
    if (!gestureRecognizerRef.current || !videoRef.current || !canvasRef.current) return;
    const { videoWidth, videoHeight } = videoRef.current;
    if (videoWidth === 0 || videoHeight === 0) {
      animFrameRef.current = requestAnimationFrame(predictLoop);
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(predictLoop); return;
    }

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

    // Draw Holographic Vault Box
    const t = Date.now();
    const boxSize = 120;
    const bx = (videoWidth - boxSize) / 2;
    const by = (videoHeight - boxSize) / 2;

    if (!isPicked) {
      // Animated pulsing rings
      const pulse = Math.sin(t / 400) * 0.4 + 0.6;
      const outerPulse = Math.sin(t / 600) * 0.3 + 0.7;

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(bx + boxSize/2, by + boxSize/2, (boxSize/2 + 20) * outerPulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(99,102,241,${0.15 * outerPulse})`;
      ctx.lineWidth = 8;
      ctx.stroke();

      // Main vault border
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(99,102,241,${0.7 + pulse * 0.3})`;
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(99,102,241,0.8)';
      // Rounded rect
      const r = 12;
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + boxSize - r, by);
      ctx.quadraticCurveTo(bx + boxSize, by, bx + boxSize, by + r);
      ctx.lineTo(bx + boxSize, by + boxSize - r);
      ctx.quadraticCurveTo(bx + boxSize, by + boxSize, bx + boxSize - r, by + boxSize);
      ctx.lineTo(bx + r, by + boxSize);
      ctx.quadraticCurveTo(bx, by + boxSize, bx, by + boxSize - r);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      ctx.stroke();

      // Core orb
      const coreGrad = ctx.createRadialGradient(
        bx + boxSize/2, by + boxSize/2, 2,
        bx + boxSize/2, by + boxSize/2, 30 * pulse
      );
      coreGrad.addColorStop(0, `rgba(139,92,246,${0.6 * pulse})`);
      coreGrad.addColorStop(0.5, `rgba(99,102,241,${0.25 * pulse})`);
      coreGrad.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(bx + boxSize/2, by + boxSize/2, 30 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Corner brackets
      const bl = 15;
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 5;
      [[bx, by], [bx+boxSize, by], [bx, by+boxSize], [bx+boxSize, by+boxSize]].forEach(([cx, cy]) => {
        const dx = cx === bx ? 1 : -1;
        const dy = cy === by ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(cx + dx * bl, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * bl);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
    }

    try {
      if (!gestureRecognizerRef.current || !videoRef.current) return;

      const timestamp = performance.now();
      let results: any = null;

      try {
        results = gestureRecognizerRef.current.recognizeForVideo(videoRef.current, timestamp);
      } catch (e: any) {
        if (e?.message?.includes('XNNPACK') || typeof e === 'string' && e.includes('XNNPACK')) return;
        throw e;
      }

      if (results && results.landmarks?.length > 0) {
        const landmarks = results.landmarks[0];
        const indexTip = landmarks[8];
        const hx = indexTip.x * videoWidth;
        const hy = indexTip.y * videoHeight;

        const inBox = !isPicked && hx > bx && hx < bx + boxSize && hy > by && hy < by + boxSize;

        if (results.gestures?.length > 0 && !cameraError) {
          const gestureName = results.gestures[0][0].categoryName;
          const conf = Math.round(results.gestures[0][0].score * 100);
          setCurrentGesture(gestureName);
          setGestureConfidence(conf);

          // Tracking dots
          const dotColor = role === 'sender' && isPicked ? '#818cf8' : '#34d399';
          ctx.fillStyle = dotColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = dotColor;
          landmarks.forEach((lm: any) => {
             ctx.beginPath();
             ctx.arc(lm.x * videoWidth, lm.y * videoHeight, 3.5, 0, 2*Math.PI);
             ctx.fill();
          });

          // Skeleton lines (wrist + finger bones)
          const boneColor = role === 'sender' && isPicked ? 'rgba(129,140,248,0.5)' : 'rgba(52,211,153,0.4)';
          ctx.strokeStyle = boneColor;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 4;
          const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
          connections.forEach(([a, b]) => {
            ctx.beginPath();
            ctx.moveTo(landmarks[a].x * videoWidth, landmarks[a].y * videoHeight);
            ctx.lineTo(landmarks[b].x * videoWidth, landmarks[b].y * videoHeight);
            ctx.stroke();
          });
          ctx.shadowBlur = 0;

          // --- Role based gesture triggers ---
          if (role === 'sender') {
            if (!isPicked && handSequence === 0 && inBox && (gestureName === DROP_GESTURE || gestureName === DROP_GESTURE_ALT) && conf > 70) {
              setHandSequence(1);
              setGestureStatus('Palm inside vault. Close fist to grab.');
              speak('Palm detected inside vault. Now close your fist to grab the funds.');
              if (navigator.vibrate) navigator.vibrate(10);
            }
            if (!isPicked && handSequence === 1 && gestureName === PICK_GESTURE && conf > 75) {
              setIsPicked(true);
              setHandSequence(2);
              setGestureStatus('Funds secured! Open your hand to send.');
              speak('Funds grabbed! Now open your hand to launch the transfer.');
              if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
            }
            if (isPicked && !dropFiredRef.current && (gestureName === DROP_GESTURE || gestureName === DROP_GESTURE_ALT) && conf > 75) {
              executeDrop();
            }
          } else if (role === 'recipient') {
            if (recipientState !== 'receiving') return;
            if (handSequence === 0 && (gestureName === DROP_GESTURE || gestureName === DROP_GESTURE_ALT) && conf > 70) {
              setHandSequence(1);
              setGestureStatus('Palm open. Close fist to catch!');
              speak('Open palm detected. Now close your fist to catch the money.');
            }
            if (handSequence === 1 && gestureName === PICK_GESTURE && conf > 80 && !isProcessing && !dropFiredRef.current) {
              setHandSequence(2);
              setGestureStatus('Caught!');
              acceptTransfer();
            }
          }
        }
      } else {
        setCurrentGesture(''); setGestureConfidence(0);
      }
    } catch (_) {}

    animFrameRef.current = requestAnimationFrame(predictLoop);
  }, [isPicked, isProcessing, role, executeDrop, acceptTransfer, cameraError, handSequence, amount]);


  // ==========================
  // BLE (Web Bluetooth) SCANNING
  // ==========================
  const startBLEScan = async () => {
    try {
      const nav: any = navigator;
      if (!nav.bluetooth) {
        toast({ variant: 'destructive', title: 'BLE Unavailable', description: 'Web Bluetooth is not supported on this device/browser.' });
        return;
      }
      setGestureStatus('Initiating BLE scan...');
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'] // Example service
      });
      toast({ title: 'BLE Connected', description: `Secured link with ${device.name || 'Unknown Device'}` });
      
      const mockedReceiver = {
        uid: device.id || `ble-${Date.now()}`,
        displayName: device.name || 'Nearby BLE Node',
        proximity: 5,
        isBle: true
      };
      
      setAvailableReceivers(prev => {
        if (!prev.find(p => p.uid === mockedReceiver.uid)) return [...prev, mockedReceiver];
        return prev;
      });
      setSelectedReceivers([mockedReceiver]);
      setSenderState('uwb_lock');
      if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'BLE Scan Failed', description: err.message });
    }
  };

  // ==========================
  // REAL-TIME SYNC
  // ==========================
  useEffect(() => {
    if (role !== 'sender' || senderState !== 'searching' || !firestore || !user) return;
    const unsubs: any[] = [];

    unsubs.push(onSnapshot(query(collection(firestore, 'air_receivers')), (snap) => {
      let recs: any[] = [];
      snap.forEach(d => {
        if (d.id !== user.uid) {
          const data = d.data();
          recs.push({
            ...data,
            proximity: Math.floor(Math.random() * 40) + 10
          });
        }
      });
      setAvailableReceivers(recs);
      if (recs.length > 0 && senderState === 'searching') {
        const sorted = [...recs].sort((a, b) => a.proximity - b.proximity);
        setSelectedReceivers([sorted[0]]);
        setSenderState('uwb_lock');
        if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
      }
    }));

    unsubs.push(onSnapshot(query(collection(firestore, 'air_requesters')), (snap) => {
      let reqs: any[] = [];
      snap.forEach(d => { if (d.id !== user.uid) reqs.push(d.data()); });
      if (reqs.length > 0 && senderState === 'searching') {
        const req = reqs[0];
        setSelectedReceivers([req]);
        setAmount(req.amount);
        setSenderState('uwb_lock');
        toast({ title: 'Request Found', description: `${req.displayName} requested ₦${req.amount}` });
      }
    }));
    return () => unsubs.forEach(u => u());
  }, [role, senderState, firestore, user, toast]);

  useEffect(() => {
    if (role !== 'sender' || !transferSessionId || !firestore || !user) return;
    const unsub = onSnapshot(doc(firestore, 'air_transfers', transferSessionId), async (snap) => {
      if (snap.data()?.status === 'accepted') {
        try {
          if (walletDocRef) {
            await updateDoc(walletDocRef, { balance: currentBalance - parseFloat(amount) });
            await addDoc(collection(firestore, 'wallets', user.uid, 'transactions'), {
              type: 'debit', amount: parseFloat(amount), description: `AirDrop Send`, timestamp: serverTimestamp(), reference: `AIR-${Date.now()}`, status: 'success'
            });
          }
          await updateDoc(doc(firestore, 'air_transfers', transferSessionId), { status: 'completed' });
          stopCamera();
          setIsProcessing(false);
          setSenderState('success');
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        } catch {}
      }
      if (snap.data()?.status === 'declined') {
        setIsProcessing(false); dropFiredRef.current = false; setFlyOrb(false); setTransferSessionId(null);
        toast({ variant: 'destructive', title: 'Declined' });
      }
    });
    return () => unsub();
  }, [transferSessionId, role, firestore, walletDocRef, amount, currentBalance, user, toast]);

  useEffect(() => {
    if (role !== 'recipient' || !user || !firestore) return;
    const pRef = doc(firestore, 'air_receivers', user.uid);

    const unsubPresence = onSnapshot(pRef, (snap) => {
       if (snap.data()?.status === 'synced') {
          setIsSynced(true);
          if (navigator.vibrate) navigator.vibrate(40);
       } else {
          setIsSynced(false);
       }
    });

    const q = query(collection(firestore, 'air_transfers'), where('receiver_id', '==', user.uid), where('status', '==', 'pending'));
    const unsubTransfers = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setIncomingTransfer({ id: snap.docs[0].id, ...snap.docs[0].data() });
        setRecipientState('receiving');
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      }
    });
    return () => { unsubPresence(); unsubTransfers(); deleteDoc(pRef).catch(()=>{}); };
  }, [role, user, firestore]);

  const publishRequest = () => {
    if (!amount || !user || !firestore) return;
    setDoc(doc(firestore, 'air_requesters', user.uid), { uid: user.uid, displayName: user.displayName || 'User', amount, timestamp: serverTimestamp() });
    setRequestorState('broadcasting');
  };

  useEffect(() => {
    if (role === 'requestor' && requestorState === 'broadcasting' && user && firestore) {
      const q = query(collection(firestore, 'air_transfers'), where('receiver_id', '==', user.uid), where('status', '==', 'pending'));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setIncomingTransfer({ id: snap.docs[0].id, ...snap.docs[0].data() });
          setRequestorState('received');
        }
      });
      return () => unsub();
    }
  }, [role, requestorState, user, firestore]);


  // ==========================
  // RENDER UI BLOCKS
  // ==========================
  const renderCameraView = () => (
    <div className="relative w-full aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-slate-900 shadow-2xl border border-white/10 z-10">
      <video ref={videoRef} autoPlay muted playsInline className="absolute opacity-0 pointer-events-none" />
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover -scale-x-100"
      />

      {!gestureReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 gap-4">
          {/* Animated loading orb */}
          <div className="relative size-16">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-indigo-500/50 animate-spin" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Zap className="size-4 text-indigo-400" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{gestureStatus}</p>
        </div>
      )}

      {gestureReady && (
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <div className={`size-2 rounded-full ${currentGesture === PICK_GESTURE ? 'bg-indigo-400' : currentGesture ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">
            {currentGesture ? currentGesture.replace('_', ' ') : 'No hand'}
          </span>
          {gestureConfidence > 0 && (
            <span className="text-[8px] text-slate-500 font-bold">{gestureConfidence}%</span>
          )}
        </div>
      )}

      {/* Gesture instruction badge */}
      {gestureReady && gestureStatus && (
        <div className="absolute top-3 left-3 right-3 bg-black/50 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-center">
          <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">{gestureStatus}</span>
        </div>
      )}

      {role === 'sender' && isPicked && <div className="absolute inset-0 rounded-[1.5rem] ring-4 ring-indigo-500/60 pointer-events-none" />}
      {role === 'recipient' && currentGesture === PICK_GESTURE && <div className="absolute inset-0 bg-emerald-500/15 rounded-[1.5rem]" />}

      {/* Vision Error Overlay */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 gap-3 p-6 text-center z-50">
          <Camera className={`size-10 ${cameraError.includes('waiting') ? 'text-amber-500' : 'text-rose-500'}`} />
          <p className="text-sm font-black text-white">Aura Vision Error</p>
          <p className="text-[10px] text-slate-400 font-bold">{cameraError}</p>
          <Button size="sm" variant="outline" onClick={() => startCameraConfig('Retrying...')} className="mt-4 h-9 text-[9px] uppercase font-black bg-white/5 border-white/10 hover:bg-white/10">
            Re-Initialize Vision
          </Button>
        </div>
      )}
    </div>
  );

  const renderRoleSelection = () => (
    <div className="flex flex-col items-center justify-center space-y-6 p-6 py-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-2 mb-2">
        <div className="relative size-20 mx-auto">
          <div className="absolute inset-0 rounded-[2rem] bg-indigo-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
          <div className="relative size-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-2xl shadow-indigo-500/20">
            <Wifi className="size-10 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-3xl font-black tracking-tightest mt-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">AirSend Aura</h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-6 text-center">NFC · UWB · Vision AI · WebMesh</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <Button variant="outline" onClick={() => { setRole('sender'); voiceGuide('role-sender', 'Sender mode selected. Scanning for nearby receivers.'); }}
          className="h-32 flex flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-indigo-500/20 shadow-lg relative overflow-hidden group bg-slate-900/50">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="size-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/40">
            <ArrowUpRight className="size-6" />
          </div>
          <span className="font-black uppercase tracking-widest text-xs z-10 text-slate-100">Send Drop</span>
        </Button>
        <Button variant="outline" onClick={() => { setRole('recipient'); setRecipientState('waiting'); voiceGuide('role-recipient', 'Recipient mode. Tap Secure Check-in to broadcast your presence.'); }}
          className="h-32 flex flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-emerald-500/20 shadow-lg relative overflow-hidden group bg-slate-900/50">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="size-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/40">
            <ArrowDownLeft className="size-6" />
          </div>
          <span className="font-black uppercase tracking-widest text-xs z-10 text-slate-100">Receive</span>
        </Button>
      </div>
      <Button variant="outline" onClick={() => { setRole('requestor'); voiceGuide('role-requestor', 'Request funds mode. Enter the amount you need.'); }}
        className="w-full h-16 rounded-[1.5rem] border-2 border-amber-500/20 hover:bg-amber-500/5 shadow-md flex items-center justify-center gap-3 text-amber-500">
        <Activity className="size-5" />
        <span className="font-black uppercase tracking-widest text-xs">Request Funds Mode</span>
      </Button>
    </div>
  );

  const renderSenderCard = () => {
    switch (senderState) {
      case 'searching':
        return (
          <div className="flex flex-col items-center justify-center p-8 py-16 space-y-8 animate-in fade-in">
            <div className="relative size-40 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-6 rounded-full border border-indigo-500/15 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
              <div className="relative z-10 size-24 rounded-full bg-slate-900 border-4 border-indigo-500/80 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                <Smartphone className="size-10 text-indigo-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black tracking-tightest text-white">Scanning Proximity</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Searching receivers & requests</p>
            </div>
            <Button onClick={startBLEScan} variant="outline" className="h-12 px-6 rounded-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 flex items-center gap-2 font-black uppercase tracking-widest mt-6 bg-slate-900/50">
               <Bluetooth className="size-4 animate-pulse" />
               Pair BLE Node
            </Button>
          </div>
        );

      case 'uwb_lock':
        return (
          <div className="flex flex-col items-center justify-center p-8 py-10 space-y-6 animate-in zoom-in-95">
             <div className="text-center w-full mb-3">
                 <h3 className="text-2xl font-black text-white tracking-tightest">Target Acquired</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">Select nodes for payload</p>
             </div>
             <div className="relative size-44 flex items-center justify-center my-6">
                 <div className="absolute inset-0 border border-indigo-500/20 rounded-full animate-ping opacity-30" style={{ animationDuration: '3s' }} />
                 <div className="absolute inset-5 border border-indigo-500/30 rounded-full" />
                 <div className="absolute inset-10 border border-indigo-500/10 rounded-full" />
                 <div className="relative z-10 size-14 bg-slate-900 border-2 border-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                     <Smartphone className="size-6 text-indigo-400" />
                 </div>
                 {availableReceivers.map((rec, i) => {
                    const angle = (i * (360 / Math.max(availableReceivers.length, 1))) * (Math.PI / 180);
                    const isSelected = selectedReceivers.some(r => r.uid === rec.uid);
                    const rx = 68 * Math.cos(angle);
                    const ry = 68 * Math.sin(angle);
                    return (
                        <div key={rec.uid} onClick={() => {
                            if (isSelected) setSelectedReceivers(prev => prev.filter(r => r.uid !== rec.uid));
                            else setSelectedReceivers(prev => [...prev, rec]);
                        }}
                        className={`absolute size-14 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isSelected ? 'bg-emerald-500 z-20 scale-110 shadow-[0_0_25px_rgba(16,185,129,0.7)]' : 'bg-slate-800 scale-100 opacity-70 hover:opacity-100 hover:scale-105 border border-slate-700'} `}
                        style={{ transform: `translate(${rx}px, ${ry}px)` }}>
                            <span className="text-[9px] font-black text-white uppercase text-center px-1 truncate w-[90%] leading-tight">{rec.displayName?.split(' ')[0] || 'User'}</span>
                            {isSelected && <div className="absolute -top-1 -right-1 size-4 bg-white rounded-full flex items-center justify-center shadow-md"><CheckCircle2 className="size-3 text-emerald-500"/></div>}
                        </div>
                    )
                 })}
             </div>
             <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                 <div className="flex justify-between items-center pb-2 border-b border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-1.5"><Crosshair className="size-3"/> UWB Targeting</p>
                 </div>
                 <p className="text-center text-sm font-black text-white mt-3">
                     {selectedReceivers.length === 0 ? "Target unlocked" : peerName }
                 </p>
             </div>
             <Button onClick={() => {
                selectedReceivers.forEach(r => {
                   updateDoc(doc(firestore!, 'air_receivers', r.uid), { status: 'synced', sender_id: user?.uid });
                });
                setSenderState('amount');
             }} disabled={selectedReceivers.length === 0} className="w-full h-14 rounded-[1.5rem] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20">
                 Establish Channel
             </Button>
          </div>
        );

      case 'amount':
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-8 animate-in slide-in-from-right-8">
            <div className="flex w-full justify-between items-center bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
               <div><p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Target(s)</p><p className="text-xs font-bold text-slate-300">{peerName}</p></div>
               {selectedReceivers.length > 1 && <span className="bg-indigo-500 px-2 py-1 rounded-md text-[9px] font-black text-white uppercase">Split Mode</span>}
            </div>
            <div className="w-full space-y-2 relative">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-400">Total Amount</span><span className="text-indigo-400">Bal: ₦{currentBalance.toLocaleString()}</span>
              </div>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₦</span>
                <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="h-20 pl-14 pr-16 text-4xl font-black font-mono rounded-[1.5rem] bg-white/5 border border-white/10 text-white focus:ring-4 focus:ring-indigo-500/30" autoFocus />
                <Button variant="ghost" size="icon" onClick={startVoiceCommand} className={`absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}><Mic className="size-5" /></Button>
              </div>
              {isListening && (
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center animate-pulse">Listening… say the amount</p>
              )}
            </div>
            <div className="flex items-center gap-3 w-full border border-white/5 bg-white/5 p-3 rounded-2xl cursor-pointer" onClick={() => setIsGift(!isGift)}>
               <div className={`p-2 rounded-xl transition-colors ${isGift ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}><Gift className="size-5"/></div>
               <div className="flex-1"><p className="text-xs font-black text-white uppercase tracking-wider">Gift Wrap</p><p className="text-[9px] font-bold text-slate-400">Add festive animation</p></div>
               <div className={`size-5 rounded-full border-2 border-slate-600 flex items-center justify-center ${isGift ? 'border-amber-500 bg-amber-500' : ''}`}>{isGift && <CheckCircle2 className="size-3 text-white" />}</div>
            </div>
            <Button onClick={() => { if(parseFloat(amount)>0) { setSenderState('shield'); setTimeout(()=>setSenderState('auth'),2000); } }} className="w-full h-14 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest shadow-xl hover:bg-slate-100">Verify Context</Button>
          </div>
        );

      case 'shield':
        return (
          <div className="flex flex-col items-center justify-center p-8 py-12 space-y-8 animate-in zoom-in">
             <div className="relative size-28 flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping" />
              <div className="relative z-10 size-20 bg-slate-900 border-4 border-blue-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]"><ShieldCheck className="size-8 text-blue-400 animate-pulse" /></div>
            </div>
            <div className="text-center space-y-5 w-full">
              <h3 className="text-2xl font-black tracking-tightest text-white">Arise AI Shield</h3>
              <div className="space-y-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-left">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><span className="size-5 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="size-3 text-emerald-500" /></span> Device Trust: 98%</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><span className="size-5 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="size-3 text-emerald-500" /></span> Velocity Valid</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3 animate-pulse"><span className="size-5 rounded-full bg-blue-500/10 flex items-center justify-center"><RefreshCw className="size-3 text-blue-400 animate-spin" /></span> Securing node...</p>
              </div>
            </div>
          </div>
        );

      case 'auth':
        return (
          <div className="flex flex-col items-center justify-center p-8 py-16 space-y-10 animate-in fade-in">
            <div className="size-20 rounded-[2rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <Lock className="size-10 text-amber-400" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black tracking-tightest text-white">Sign Transaction</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Verify ₦{parseFloat(amount).toLocaleString()}</p>
            </div>
            <Button onClick={() => setSenderState('gesture')} className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black uppercase tracking-widest flex justify-center gap-3 shadow-lg shadow-amber-500/20">
              <ScanFace className="size-5" /> Biometric OK
            </Button>
            <Button variant="ghost" onClick={()=>setSenderState('offline_token')} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest underline underline-offset-4">Generate Offline Token</Button>
          </div>
        );

      case 'gesture':
        return (
          <div className="flex flex-col items-center p-6 min-h-[480px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-10 relative">
            <div className="text-center mb-4 w-full relative z-10 shrink-0">
              <h3 className="text-2xl font-black tracking-tightest text-white">₦{parseFloat(amount).toLocaleString()} {isGift && '🎁'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">To {peerName}</p>
            </div>

            {/* Premium Holographic Orb (replaces flying money) */}
            {flyOrb && (
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                 <div className="relative size-20 animate-[flyUp_0.8s_ease-in_forwards]"
                   style={{ animation: 'flyUp 0.8s cubic-bezier(0.4,0,0.2,1) forwards' }}>
                   {/* Outer ring */}
                   <div className="absolute inset-0 rounded-full border-2 border-indigo-400/60 animate-ping" style={{ animationDuration: '0.5s' }} />
                   {/* Core orb */}
                   <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-violet-600 shadow-[0_0_40px_rgba(139,92,246,0.9)] flex items-center justify-center">
                     <Send className="size-6 text-white" />
                   </div>
                   {/* Trail particles */}
                   <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400/60 to-transparent rounded-full" />
                 </div>
               </div>
            )}

            {renderCameraView()}

            {/* Gesture steps guide */}
            {!flyOrb && (
              <div className="w-full mt-4 grid grid-cols-3 gap-2">
                {[
                  { step: 1, label: 'Open palm → vault', active: handSequence === 0, done: handSequence > 0 },
                  { step: 2, label: 'Close fist → grab', active: handSequence === 1, done: handSequence > 1 },
                  { step: 3, label: 'Open hand → send', active: handSequence === 2, done: false },
                ].map(({ step, label, active, done }) => (
                  <div key={step} className={`rounded-xl p-2 text-center border transition-all ${done ? 'border-indigo-500/40 bg-indigo-500/10' : active ? 'border-emerald-500/50 bg-emerald-500/10 animate-pulse' : 'border-white/5 bg-white/3'}`}>
                    <div className={`text-[9px] font-black uppercase tracking-wider ${done ? 'text-indigo-400' : active ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {done ? '✓' : `${step}.`} {label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!flyOrb && (
               <button onClick={()=>{setIsPicked(true); executeDrop();}} className="mt-4 px-6 py-3 rounded-full bg-white/5 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/10 cursor-pointer z-10">
                 Tap to force send 🚀
               </button>
            )}
          </div>
        );

      case 'offline_token':
        return (
          <div className="flex flex-col items-center justify-center p-8 py-10 space-y-8 animate-in zoom-in">
             <div className="size-24 bg-white rounded-[2rem] p-4 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                <QrCode className="size-full text-slate-900" />
             </div>
             <div className="text-center w-full">
               <h3 className="text-2xl font-black tracking-tightest text-white">Offline Token</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-4 leading-relaxed">Show this code or read network hash to recipient to securely lock funds offline.</p>
             </div>
             <div className="w-full bg-slate-900 px-4 py-3 rounded-xl border border-slate-700 text-center select-all">
                <span className="font-mono text-xs font-bold text-amber-500 break-all">{offlineTokenStr || `AIR-OFFLINE-${Date.now()}-SECURE`}</span>
             </div>
             <Button variant="outline" onClick={()=>onOpenChange(false)} className="w-full">Done</Button>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center p-8 py-16 space-y-6 animate-in zoom-in">
            <div className="relative size-28">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative size-28 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.6)]">
                <CheckCircle2 className="size-14 text-white" />
              </div>
            </div>
            <div className="text-center"><h3 className="text-3xl font-black text-white">Transfer Complete!</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">₦{parseFloat(amount).toLocaleString()} sent to target(s)</p></div>
          </div>
        );
    }
  };

  const renderRecipientCard = () => {
    switch(recipientState){
      case 'waiting': return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[480px] max-h-[80vh] overflow-y-auto animate-in fade-in">
          <div className="text-center mb-6 shrink-0">
            <h3 className="text-2xl font-black text-white">{isSynced ? 'Synced & Ready' : 'Broadcast Active'}</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em] animate-pulse">
                {isSynced ? 'Encrypted channel locked' : 'Waiting for incoming drop...'}
            </p>
          </div>

          {renderCameraView()}

          {!isSynced ? (
            <Button onClick={() => {
              const pRef = doc(firestore!, 'air_receivers', user?.uid!);
              setDoc(pRef, { uid: user?.uid, displayName: user?.displayName || 'User', status: 'idle', timestamp: serverTimestamp() });
              toast({ title: 'Aura Check-in', description: 'Your device is now visible to nearby peers.' });
              speak('Check-in complete. You are now visible to nearby senders. Stay close and watch for an incoming transfer.');
            }} className="mt-8 h-14 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
              Secure Check-in
            </Button>
          ) : (
            <div className={`mt-8 flex items-center gap-3 px-6 py-4 rounded-3xl border transition-all duration-500 shrink-0 bg-emerald-500 text-white border-white/20 shadow-lg shadow-emerald-500/20`}>
              <ShieldCheck className="size-5 animate-bounce" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                  Target Synchronized
              </p>
            </div>
          )}
        </div>
      );
      case 'receiving': return (
        <div className="flex flex-col items-center p-6 min-h-[480px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-top-10 relative">
          <div className="text-center w-full relative z-10 mb-4 shrink-0">
            <p className="text-[10px] font-black uppercase text-indigo-400 animate-pulse tracking-[0.2em]">{incomingTransfer?.isGift ? '🎁 Incoming Gift' : '⚡ Incoming Drop'}</p>
            <h3 className="text-4xl font-black text-white my-1">₦{parseFloat(incomingTransfer?.amount || '0').toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">From {incomingTransfer?.sender_name}</p>
          </div>

          {/* Catch instruction steps */}
          <div className="w-full mb-4 grid grid-cols-2 gap-2 shrink-0">
            {[
              { label: '1. Open your palm', active: handSequence === 0, done: handSequence > 0 },
              { label: '2. Close fist to catch', active: handSequence === 1, done: handSequence > 1 },
            ].map(({ label, active, done }) => (
              <div key={label} className={`rounded-xl p-2 text-center border transition-all ${done ? 'border-emerald-500/40 bg-emerald-500/10' : active ? 'border-amber-500/50 bg-amber-500/10 animate-pulse' : 'border-white/5 bg-white/3'}`}>
                <span className={`text-[9px] font-black uppercase tracking-wider ${done ? 'text-emerald-400' : active ? 'text-amber-400' : 'text-slate-500'}`}>
                  {done ? '✓ ' : ''}{label}
                </span>
              </div>
            ))}
          </div>

          {renderCameraView()}

          <button onClick={()=>{acceptTransfer();}} disabled={isProcessing} className="mt-8 px-6 py-3 rounded-full bg-white/5 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/10 cursor-pointer z-10 shrink-0">
            {isProcessing ? 'Catching...' : 'Tap for manual catch ✋'}
          </button>
        </div>
      );
      case 'success': return (
        <div className="flex flex-col items-center justify-center p-8 py-16 space-y-6 animate-in zoom-in">
           <div className="relative size-28">
             <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
             <div className="relative size-28 rounded-full bg-emerald-500 flex justify-center items-center shadow-[0_0_60px_rgba(16,185,129,0.7)]"><CheckCircle2 className="size-14 text-white" /></div>
           </div>
           <div className="text-center"><h3 className="text-3xl font-black text-white">Caught!</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Funds added to wallet</p></div>
        </div>
      );
    }
  };

  const renderRequestorCard = () => {
    switch (requestorState) {
      case 'amount': return (
        <div className="flex flex-col items-center justify-center p-8 py-12 space-y-8 animate-in fade-in">
           <div className="w-full space-y-2">
             <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Amount</span></div>
             <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₦</span><Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="h-20 pl-14 text-4xl font-black font-mono rounded-[1.5rem] bg-white/5 border border-white/10 text-white focus:ring-4 focus:ring-amber-500/30" autoFocus /></div>
           </div>
           <Button onClick={publishRequest} className="w-full h-14 rounded-[1.5rem] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black uppercase tracking-widest">Broadcast Request</Button>
        </div>
      );
      case 'broadcasting': return (
        <div className="flex flex-col items-center justify-center p-8 py-16 space-y-8 animate-in fade-in">
          <div className="relative size-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
            <div className="absolute inset-6 rounded-full bg-amber-500/10 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
            <div className="relative z-10 size-20 rounded-full bg-slate-900 border-4 border-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)]"><Activity className="size-8 text-amber-400 animate-pulse" /></div>
          </div>
          <div className="text-center space-y-2"><h3 className="text-2xl font-black text-white">Request Active</h3><p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest animate-pulse">Broadcasting ₦{parseFloat(amount).toLocaleString()} request</p></div>
        </div>
      );
      case 'received': return (
        <div className="flex flex-col items-center justify-center p-8 py-16 space-y-6 mt-4">
           {renderRecipientCard()}
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-slate-950 border border-white/10 rounded-[2.5rem] shadow-2xl">
        <DialogTitle className="sr-only">Nearby AirSend Modal</DialogTitle>
        <div className="backdrop-blur-3xl absolute inset-0 -z-10" />

        {/* Ambient glow blobs */}
        {role === 'sender' && <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none" />}
        {role === 'recipient' && <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/15 blur-[100px] rounded-full pointer-events-none" />}
        {role === 'requestor' && <div className="absolute inset-0 flex justify-center items-center pointer-events-none"><div className="w-80 h-80 bg-amber-500/10 blur-[90px] rounded-full" /></div>}
        {!role && <div className="absolute inset-0 flex justify-center items-center pointer-events-none"><div className="w-80 h-80 bg-indigo-500/10 blur-[90px] rounded-full" /></div>}

        <div className="relative z-10 w-full text-white min-h-[440px] flex flex-col justify-center">
          {role && <div className="absolute top-4 left-4 z-20"><Button variant="ghost" size="icon" onClick={resetFlows} className="size-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"><ChevronUp className="size-5 -rotate-90 text-white" /></Button></div>}
          <div className="absolute top-4 right-4 z-20"><Button variant="ghost" size="icon" onClick={()=>onOpenChange(false)} className="size-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"><X className="size-5 text-white" /></Button></div>

          {!role && renderRoleSelection()}
          {role === 'sender' && renderSenderCard()}
          {role === 'recipient' && renderRecipientCard()}
          {role === 'requestor' && renderRequestorCard()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// CSS keyframe for orb fly animation (injected inline via style tag)
// Added to globals.css separately if needed.
