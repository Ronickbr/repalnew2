import React, { useEffect, useRef } from 'react';
import { usePopup } from '../contexts/PopupContext';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { usePromotions } from '../hooks/usePromotions';

const PopupManager: React.FC = () => {
  const { showPopup } = usePopup();
  const { user, loading } = useAuth();
  const { data: promotions } = usePromotions();
  const location = useLocation();
  const timeouts = useRef<NodeJS.Timeout[]>([]);
  const listeners = useRef<{ type: string; listener: EventListener }[]>([]);

  // Cleanup function
  const cleanup = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    listeners.current.forEach(({ type, listener }) => {
      document.removeEventListener(type, listener);
      window.removeEventListener(type, listener);
    });
    listeners.current = [];
  };

  // Clear triggers on unmount or path change
  useEffect(() => {
    return cleanup;
  }, [location.pathname]);

  useEffect(() => {
    if (loading) return;
    
    // Cleanup previous triggers before setting new ones
    cleanup();

    // 1. INFO POPUP (Legacy logic)
    if (!user && (location.pathname === '/' || location.pathname.includes('/produto/'))) {
      const seenInfo = sessionStorage.getItem('popup_info_seen');
      if (!seenInfo) {
        const t = setTimeout(() => {
          if (!document.querySelector('.popup-active')) { // Check if any popup is active
             // We use isPopupVisible from context, but inside timeout it might be stale if closure, 
             // but here we are inside useEffect, so it should be fine if we depend on it, 
             // BUT we want to avoid re-running effect on isPopupVisible change.
             // So we'll trust the context showPopup to handle overlap or check global state if needed.
             // For now, let's just fire it.
             showPopup({
              type: 'info',
              title: 'Veja os Preços!',
              message: 'Cadastre-se ou faça login para visualizar os preços exclusivos dos nossos produtos.',
              link: '/cadastro'
            });
            sessionStorage.setItem('popup_info_seen', 'true');
          }
        }, 3000);
        timeouts.current.push(t);
      }
    }

    // 2. LEAD CAPTURE (Legacy logic)
    if (!user) {
      const leadSubmitted = localStorage.getItem('popup_lead_submitted');
      if (!leadSubmitted) {
        const t = setTimeout(() => {
           // We override banner if it's open or check
           const seenLead = sessionStorage.getItem('popup_lead_seen');
           if (!seenLead) {
             showPopup({
               type: 'lead',
               title: 'Quer 10% de Desconto?',
               message: 'Cadastre seu e-mail e receba um cupom exclusivo para sua primeira compra.',
             });
             sessionStorage.setItem('popup_lead_seen', 'true');
           }
        }, 15000);
        timeouts.current.push(t);
      }
    }

    // 3. DYNAMIC PROMOTIONS
    if (promotions && promotions.length > 0 && !location.pathname.includes('/admin')) {
       promotions.forEach(promo => {
         if (!promo.active) return;

         const storageKey = `popup_promo_${promo.id}_seen`;
         const seenPromo = sessionStorage.getItem(storageKey);
         
         if (seenPromo) return;

         const triggerType = promo.trigger_type || 'time';
         const triggerValue = promo.trigger_value || 5;

         const showPromo = () => {
           // Check again if seen (in case triggered multiple times quickly)
           if (sessionStorage.getItem(storageKey)) return;
           
           // Check if another popup is visible? 
           // We can't easily check 'isPopupVisible' here without adding it to dependency array,
           // which would re-register everything.
           // Ideally showPopup should handle queueing or ignoring.
           
           showPopup({
             type: 'promo',
             title: promo.title,
             message: promo.description || 'Confira nossas ofertas especiais!',
             link: promo.link_url || '/produtos',
             image: promo.image_url || undefined,
             data: promo 
           });
           sessionStorage.setItem(storageKey, 'true');
           
           // Cleanup this specific promo listeners if needed? 
           // For now, simple logic.
         };

         // --- TRIGGER IMPLEMENTATION ---

         // A. TIME
         if (triggerType === 'time') {
           const t = setTimeout(() => {
             showPromo();
           }, triggerValue * 1000);
           timeouts.current.push(t);
         }

         // B. SCROLL
         else if (triggerType === 'scroll') {
           const scrollListener = () => {
             const scrollTop = window.scrollY;
             const docHeight = document.documentElement.scrollHeight - window.innerHeight;
             const scrollPercent = (scrollTop / docHeight) * 100;
             
             if (scrollPercent >= triggerValue) {
               showPromo();
               window.removeEventListener('scroll', scrollListener);
             }
           };
           window.addEventListener('scroll', scrollListener);
           listeners.current.push({ type: 'scroll', listener: scrollListener });
         }

         // C. EXIT INTENT
         else if (triggerType === 'exit_intent') {
           const exitListener = (e: MouseEvent) => {
             if (e.clientY <= 0) {
               showPromo();
               document.removeEventListener('mouseleave', exitListener as EventListener);
             }
           };
           document.addEventListener('mouseleave', exitListener);
           listeners.current.push({ type: 'mouseleave', listener: exitListener as EventListener });
         }

         // D. INACTIVITY
         else if (triggerType === 'inactivity') {
           let inactivityTimer: NodeJS.Timeout;
           
           const resetTimer = () => {
             clearTimeout(inactivityTimer);
             inactivityTimer = setTimeout(() => {
               showPromo();
               cleanupInactivity();
             }, triggerValue * 1000);
           };

           const cleanupInactivity = () => {
             document.removeEventListener('mousemove', resetTimer);
             document.removeEventListener('keypress', resetTimer);
             window.removeEventListener('scroll', resetTimer);
             clearTimeout(inactivityTimer);
           };

           document.addEventListener('mousemove', resetTimer);
           document.addEventListener('keypress', resetTimer);
           window.addEventListener('scroll', resetTimer);
           
           listeners.current.push({ type: 'mousemove', listener: resetTimer });
           listeners.current.push({ type: 'keypress', listener: resetTimer });
           listeners.current.push({ type: 'scroll', listener: resetTimer }); // Reusing scroll type for cleanup tracking

           // Start timer initially
           resetTimer();
         }
       });
    }

  }, [loading, user, location.pathname, promotions, showPopup]); // Removed isPopupVisible to avoid re-run

  return null;
};

export default PopupManager;
