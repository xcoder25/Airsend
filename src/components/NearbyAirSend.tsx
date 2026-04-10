'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Smartphone, Wifi, CheckCircle2, ScanFace,
  ChevronUp, RefreshCw, X, Lock,
  ArrowUpRight, ArrowDownLeft, Send, Activity, QrCode, ArrowDown, Crosshair, Gift, Mic, ShieldCheck, Camera
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
  const [handSequence, setHandSequence] = useState<number>(0); // 0: Idle, 1: Opened, 2: Closed (Action)
  const [cameraError, setCameraError] = useState<string>('');
  const [gestureStatus, setGestureStatus] = useState<string>('Initializing...');
  const [modelLoading, setModelLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false); // Handshake status
  const [flyOrb, setFlyOrb] = useState(false); 
  const [offlineTokenStr, setOfflineTokenStr] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gestureRecognizerRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const dropFiredRef = useRef(false);

  const peerName = role === 'sender'
    ? (selectedReceivers.length > 1 ? `${selectedReceivers.length} Users Selected` : selectedReceivers[0]?.displayName || 'User')
    : (incomingTransfer?.sender_name || 'Ibom User');

  const walletDocRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'wallets', user.uid) : null), [firestore, user]);

  useEffect(() => {
    if (open) {
      setRole(null);
      resetFlows();
      bgLoadMediaPipe(); // Preload model silently to reduce lag later
    } else {
      stopCamera();
    }
  }, [open]);

  // Silence "XNNPACK" info logs that crash Next.js dev server
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
           toast({ title: 'OmniAI Parsed', description: `Set amount to ₦${data.amount.toLocaleString()}` });
        }
        if (data.recipient && role === 'sender') {
           // Attempt to auto-match recipient by name
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
        // Fallback to local regex if API fails or No Key
        const numMatch = transcript.toLowerCase().match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[\s-]?thousand\b|\b\d+\b/g);
        if (numMatch) {
           let val = parseInt(numMatch[0].replace(/\D/g, ''));
           if (transcript.includes('thousand') && val < 1000) val *= 1000;
           setAmount(val.toString());
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
      // Start camera as soon as they enter Recipient mode to ensure zero-lag catch
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
          // Small delay to allow mobile hardware to stabilize stream
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
    setGestureStatus('🚀 Transferring...');
    
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
    dropFiredRef.current = true; // prevent duplicate gesture catching
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
    
    // Draw raw video frame
    ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
    
    // Draw Holographic Money Box in AR
    ctx.lineWidth = 2;
    const boxSize = 120;
    const bx = (videoWidth - boxSize) / 2;
    const by = (videoHeight - boxSize) / 2;
    
    if (!isPicked) {
       ctx.strokeStyle = '#6366f1';
       ctx.shadowBlur = 15;
       ctx.shadowColor = 'rgba(99,102,241,0.5)';
       ctx.strokeRect(bx, by, boxSize, boxSize);
       
       // Draw Pulsing Core
       const pulse = Math.sin(Date.now() / 200) * 5 + 10;
       ctx.fillStyle = 'rgba(99,102,241,0.2)';
       ctx.beginPath();
       ctx.arc(bx + boxSize/2, by + boxSize/2, pulse, 0, Math.PI * 2);
       ctx.fill();
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
        const indexTip = landmarks[8]; // Index finger tip
        const hx = indexTip.x * videoWidth;
        const hy = indexTip.y * videoHeight;
        
        // Collision Detection for AR Box
        const inBox = !isPicked && hx > bx && hx < bx + boxSize && hy > by && hy < by + boxSize;

        if (results.gestures?.length > 0 && !cameraError) {
          const gestureName = results.gestures[0][0].categoryName;
          const conf = Math.round(results.gestures[0][0].score * 100);
          setCurrentGesture(gestureName);
          setGestureConfidence(conf);

          // Draw Tracking Dots (follows hand)
          ctx.fillStyle = role === 'sender' && isPicked ? '#6366f1' : '#10b981';
          ctx.shadowBlur = 10;
          ctx.shadowColor = role === 'sender' && isPicked ? 'rgba(99,102,241,0.8)' : 'rgba(16,185,129,0.8)';
          
          landmarks.forEach((lm: any) => {
             ctx.beginPath();
             ctx.arc(lm.x * videoWidth, lm.y * videoHeight, 3.5, 0, 2*Math.PI);
             ctx.fill();
          });
          ctx.shadowBlur = 0;

          // --- Role based gesture triggers (With Box Collision) ---
          if (role === 'sender') {
            // Stage: Open hand INSIDE box to start picking
            if (!isPicked && handSequence === 0 && inBox && (gestureName === DROP_GESTURE || gestureName === DROP_GESTURE_ALT) && conf > 70) {
              setHandSequence(1);
              setGestureStatus('🖐️ Inside Vault. Close to pick up ₦' + amount);
              if (navigator.vibrate) navigator.vibrate(10);
            }
            // Stage: Close hand to GRAB
            if (!isPicked && handSequence === 1 && gestureName === PICK_GESTURE && conf > 75) {
              setIsPicked(true);
              setHandSequence(2);
              setGestureStatus('✊ Funds Secured! Throw to send.');
              if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
            }
            // Action: Throw (Open)
            if (isPicked && !dropFiredRef.current && (gestureName === DROP_GESTURE || gestureName === DROP_GESTURE_ALT) && conf > 75) {
              executeDrop();
            }
          } else if (role === 'recipient') {
            if (recipientState !== 'receiving') return;
            // Stage 0 -> 1: Open hand to prepare catch
          if (handSequence === 0 && (gestureName === DROP_GESTURE || gestureName === DROP_GESTURE_ALT) && conf > 70) {
            setHandSequence(1);
            setGestureStatus('🖐️ Target detected. Close to catch.');
          }
          // Stage 1 -> 2: Close fist to "Catch"
          if (handSequence === 1 && gestureName === PICK_GESTURE && conf > 80 && !isProcessing && !dropFiredRef.current) {
            setHandSequence(2);
            setGestureStatus('🎉 Successfully Caught!');
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
          // Simulate UWB proximity score logic (virtual distance in cm)
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
      
      {!gestureReady && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 gap-3"><RefreshCw className="size-8 text-indigo-400 animate-spin" /><p className="text-[10px] font-black uppercase text-slate-400">{gestureStatus}</p></div>}
      {gestureReady && <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2"><span className="text-lg">{currentGesture===PICK_GESTURE?'✊':currentGesture.includes('DROP')?'🖐️':'✋'}</span><span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{currentGesture.replace('_',' ')}</span></div>}
      {role === 'sender' && isPicked && <div className="absolute inset-0 rounded-[1.5rem] ring-4 ring-indigo-500/60 pointer-events-none" />}
      {role === 'recipient' && currentGesture === PICK_GESTURE && <div className="absolute inset-0 bg-emerald-500/20 rounded-[1.5rem]" />}
      
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
        <div className="size-20 rounded-[2rem] bg-indigo-500/10 mx-auto flex items-center justify-center border border-indigo-500/20 shadow-2xl">
          <Wifi className="size-10 text-indigo-500" />
        </div>
        <h2 className="text-3xl font-black tracking-tightest mt-4">AirSend Aura</h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-6 text-center">NFC · UWB · Vision AI · WebMesh</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <Button variant="outline" onClick={() => setRole('sender')} className="h-32 flex flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-indigo-500/20 shadow-lg relative overflow-hidden group">
          <div className="size-12 rounded-full bg-indigo-500 text-white flex items-center justify-center z-10 group-hover:scale-110 transition-transform"><ArrowUpRight className="size-6" /></div>
          <span className="font-black uppercase tracking-widest text-xs z-10 text-slate-100">Send Drop</span>
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
        <Button variant="outline" onClick={() => { setRole('recipient'); setRecipientState('waiting'); }} className="h-32 flex flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-emerald-500/20 shadow-lg relative overflow-hidden group">
          <div className="size-12 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10 group-hover:scale-110 transition-transform"><ArrowDownLeft className="size-6" /></div>
          <span className="font-black uppercase tracking-widest text-xs z-10 text-slate-100">Receive</span>
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </div>
      <Button variant="outline" onClick={() => setRole('requestor')} className="w-full h-16 rounded-[1.5rem] border-2 border-amber-500/20 hover:bg-amber-500/5 shadow-md flex items-center justify-center gap-3 text-amber-600">
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
              <div className="absolute inset-0 bg-indigo-500/15 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative z-10 size-24 rounded-full bg-slate-900 border-4 border-indigo-500 flex items-center justify-center shadow-2xl">
                <Smartphone className="size-10 text-white" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black tracking-tightest text-white">Scanning Proximity</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Searching receivers & requests</p>
            </div>
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
                     <Smartphone className="size-6 text-white" />
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
             <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4">
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
             }} disabled={selectedReceivers.length === 0} className="w-full h-14 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl">
                 Establish Channel
             </Button>
          </div>
        );

      case 'amount':
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-8 animate-in slide-in-from-right-8">
            <div className="flex w-full justify-between items-center bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
               <div><p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Target(s)</p><p className="text-xs font-bold text-slate-300">{peerName}</p></div>
               {selectedReceivers.length > 1 && <span className="bg-indigo-500 px-2 py-1 rounded-md text-[9px] font-black text-white uppercase">Split Mode</span>}
            </div>
            <div className="w-full space-y-2 relative">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-400">Total Amount</span><span className="text-indigo-500">Bal: ₦{currentBalance.toLocaleString()}</span>
              </div>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₦</span>
                <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="h-20 pl-14 pr-16 text-4xl font-black font-mono rounded-[1.5rem] bg-white/5 border border-white/10 text-white focus:ring-4 focus:ring-indigo-500/30" autoFocus />
                <Button variant="ghost" size="icon" onClick={startVoiceCommand} className={`absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}><Mic className="size-5" /></Button>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full border border-white/5 bg-white/5 p-3 rounded-2xl cursor-pointer" onClick={() => setIsGift(!isGift)}>
               <div className={`p-2 rounded-xl transition-colors ${isGift ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}><Gift className="size-5"/></div>
               <div className="flex-1"><p className="text-xs font-black text-white uppercase tracking-wider">Gift Wrap</p><p className="text-[9px] font-bold text-slate-400">Add festive animation</p></div>
               <div className={`size-5 rounded-full border-2 border-slate-600 flex items-center justify-center ${isGift ? 'border-amber-500 bg-amber-500' : ''}`}>{isGift && <CheckCircle2 className="size-3 text-white" />}</div>
            </div>
            <Button onClick={() => { if(parseFloat(amount)>0) { setSenderState('shield'); setTimeout(()=>setSenderState('auth'),2000); } }} className="w-full h-14 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest shadow-xl">Verify Context</Button>
          </div>
        );

      case 'shield':
        return (
          <div className="flex flex-col items-center justify-center p-8 py-12 space-y-8 animate-in zoom-in">
             <div className="relative size-28 flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping" />
              <div className="relative z-10 size-20 bg-slate-900 border-4 border-blue-500 rounded-full flex items-center justify-center"><ShieldCheck className="size-8 text-blue-500 animate-pulse" /></div>
            </div>
            <div className="text-center space-y-5 w-full">
              <h3 className="text-2xl font-black tracking-tightest text-white">Arise AI Shield</h3>
              <div className="space-y-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-left">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><span className="size-5 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="size-3 text-emerald-500" /></span> Device Trust: 98%</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><span className="size-5 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="size-3 text-emerald-500" /></span> Velocity Valid</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3 animate-pulse"><span className="size-5 rounded-full bg-blue-500/10 flex items-center justify-center"><RefreshCw className="size-3 text-blue-500 animate-spin" /></span> Securing node...</p>
              </div>
            </div>
          </div>
        );

      case 'auth':
        return (
          <div className="flex flex-col items-center justify-center p-8 py-16 space-y-10 animate-in fade-in">
            <div className="size-20 rounded-[2rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
              <Lock className="size-10 text-amber-500" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black tracking-tightest text-white">Sign Transaction</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Verify ₦{parseFloat(amount).toLocaleString()}</p>
            </div>
            <Button onClick={() => setSenderState('gesture')} className="w-full h-16 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest flex justify-center gap-3 shadow-lg shadow-amber-500/20">
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
            {flyOrb && (
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-out slide-out-to-top-[800px] fade-out duration-700 ease-in-out">
                 <div className="size-20 bg-emerald-400 rounded-full shadow-[0_0_80px_rgba(52,211,153,1)] flex items-center justify-center border-4 border-white/50"><Send className="size-8 text-slate-900" /></div>
               </div>
            )}
            
            {renderCameraView()}

            {!flyOrb && (
               <button onClick={()=>{setIsPicked(true); executeDrop();}} className="mt-8 px-6 py-3 rounded-full bg-white/5 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/10 cursor-pointer z-10">
                 Tap to force drop 🚀
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
            <div className="size-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.6)]"><CheckCircle2 className="size-12 text-white" /></div>
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
            }} className="mt-8 h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
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
            <p className="text-[10px] font-black uppercase text-indigo-500 animate-pulse tracking-[0.2em]">{incomingTransfer?.isGift ? '🎁 Incoming Gift' : 'Incoming Drop'}</p>
            <h3 className="text-4xl font-black text-white my-1">₦{parseFloat(incomingTransfer?.amount || '0').toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">From {incomingTransfer?.sender_name}</p>
          </div>
          
          {renderCameraView()}

          <button onClick={()=>{acceptTransfer();}} disabled={isProcessing} className="mt-8 px-6 py-3 rounded-full bg-white/5 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/10 cursor-pointer z-10 shrink-0">
            {isProcessing ? 'Catching...' : 'Tap for manual catch ✋'}
          </button>
        </div>
      );
      case 'success': return (
        <div className="flex flex-col items-center justify-center p-8 py-16 space-y-6 animate-in zoom-in">
           <div className="size-24 rounded-full bg-emerald-500 flex justify-center items-center shadow-[0_0_60px_rgba(16,185,129,0.7)]"><CheckCircle2 className="size-12 text-white" /></div>
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
           <Button onClick={publishRequest} className="w-full h-14 rounded-[1.5rem] bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest">Broadcast Request</Button>
        </div>
      );
      case 'broadcasting': return (
        <div className="flex flex-col items-center justify-center p-8 py-16 space-y-8 animate-in fade-in">
          <div className="relative size-32 flex items-center justify-center"><div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" /><div className="relative z-10 size-20 rounded-full bg-slate-900 border-4 border-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)]"><Activity className="size-8 text-amber-500 animate-pulse" /></div></div>
          <div className="text-center space-y-2"><h3 className="text-2xl font-black text-white">Request Active</h3><p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest animate-pulse">Broadcasting ₦{parseFloat(amount).toLocaleString()} request</p></div>
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
        {role === 'sender' && <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none" />}
        {role === 'recipient' && <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/15 blur-[100px] rounded-full pointer-events-none" />}
        {role === 'requestor' && <div className="absolute inset-0 flex justify-center items-center pointer-events-none"><div className="w-80 h-80 bg-amber-500/10 blur-[90px] rounded-full" /></div>}

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
