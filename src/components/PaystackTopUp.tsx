'use client';
import { usePaystackPayment } from 'react-paystack';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PaystackTopUp({ 
  amount, 
  currentBalance,
  onSuccessReturn, 
  onClose 
}: { 
  amount: string; 
  currentBalance: number;
  onSuccessReturn: () => void;
  onClose: () => void;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const walletDocRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'wallets', user.uid) : null), [firestore, user]);

  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || 'user@example.com',
    amount: (parseFloat(amount) || 0) * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_b8e5196cd637d4ee7119ff3c6981881ae2128a39',
  };

  const initializePayment = usePaystackPayment(config);

  const handleSuccess = async (reference: any) => {
    if (walletDocRef) {
      const db = firestore!;
      const amtNum = parseFloat(amount);
      try {
        await updateDoc(walletDocRef, { balance: currentBalance + amtNum });
        await addDoc(collection(db, 'wallets', user!.uid, 'transactions'), {
          type: 'credit',
          amount: amtNum,
          description: 'Paystack Top-up',
          timestamp: serverTimestamp(),
          reference: reference.reference,
          status: 'success'
        });
      } catch (e) {
        console.error("Paystack topup error:", e);
      }
    }
    onSuccessReturn();
  };

  return (
    <button 
      onClick={() => {
        if (parseFloat(amount) > 0) {
          initializePayment({ onSuccess: handleSuccess, onClose });
        }
      }}
      style={{ flex: 1, padding: '14px', borderRadius: '16px', background: '#00d27b', color: '#000', fontWeight: '800', border: 'none', cursor: 'pointer' }}
    >
      Proceed
    </button>
  );
}
