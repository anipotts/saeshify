"use client";
import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Check } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationToggle() {
   const [isSupported, setIsSupported] = useState(false);
   const [isSubscribed, setIsSubscribed] = useState(false);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
       if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
           setIsSupported(true);
           checkSubscription();
       }
   }, []);

   const checkSubscription = async () => {
       try {
           const reg = await navigator.serviceWorker.ready;
           const sub = await reg.pushManager.getSubscription();
           if (sub) {
               setIsSubscribed(true);
           }
       } catch(e) {
           console.error("Error checking subscription:", e);
       }
   };

   const handleSubscribe = async () => {
       setLoading(true);
       try {
           const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
           if (!vapidKey) {
               alert("Configuration Error: VAPID Key missing.");
               setLoading(false);
               return;
           }

           // Request Permission first
           const permission = await Notification.requestPermission();
           if (permission !== 'granted') {
               alert("Permission denied. Enable notifications in your browser settings.");
               setLoading(false);
               return;
           }

           const reg = await navigator.serviceWorker.ready;
           const sub = await reg.pushManager.subscribe({
               userVisibleOnly: true,
               applicationServerKey: urlBase64ToUint8Array(vapidKey)
           });
           
           // Send to Server
           const res = await fetch('/api/push/subscribe', {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({ subscription: sub })
           });
           
           if (!res.ok) throw new Error("Server failed to save subscription");

           setIsSubscribed(true);
       } catch (e) {
           console.error("Subscription failed", e);
           alert("Failed to enable notifications. " + (e as any).message);
       }
       setLoading(false);
   };
   
   if (!isSupported) return null;

   return (
       <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-white/5">
           <div className="flex items-center gap-3">
               <div className={`p-2 rounded-full ${isSubscribed ? 'bg-green-900/20' : 'bg-zinc-800'}`}>
                   {isSubscribed ? <Bell size={20} className="text-[#1DB954]" /> : <BellOff size={20} className="text-muted-foreground" />}
               </div>
               <div>
                   <h3 className="font-bold text-sm text-white">Notifications</h3>
                   <p className="text-xs text-muted-foreground">Get nudges based on your listening</p>
               </div>
           </div>
           
           <button 
             onClick={handleSubscribe} 
             disabled={isSubscribed || loading}
             className={`h-9 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                 isSubscribed 
                 ? 'bg-transparent text-[#1DB954] cursor-default' 
                 : 'bg-white text-black hover:scale-105 active:scale-95'
             }`}
           >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (
                  isSubscribed ? 'On' : 'Enable'
              )}
           </button>
       </div>
   )
}
