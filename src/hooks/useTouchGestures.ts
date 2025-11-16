import { useState, useEffect, useCallback, useRef } from 'react';

interface TouchGestureOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  preventDefault?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isMoving: boolean;
  tapCount: number;
  lastTapTime: number;
}

export const useTouchGestures = (elementRef: React.RefObject<HTMLElement>, options: TouchGestureOptions = {}) => {
  const {
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    preventDefault = true,
  } = options;

  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isMoving: false,
    tapCount: 0,
    lastTapTime: 0,
  });

  const [isTouching, setIsTouching] = useState(false);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    const now = Date.now();
    
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      isMoving: false,
      tapCount: touchState.current.tapCount,
      lastTapTime: touchState.current.lastTapTime,
    };

    setIsTouching(true);
  }, [preventDefault]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    const state = touchState.current;
    
    if (!state.isMoving) {
      const deltaX = Math.abs(touch.clientX - state.startX);
      const deltaY = Math.abs(touch.clientY - state.startY);
      
      // Considera movimento se o deslocamento for maior que 10px
      if (deltaX > 10 || deltaY > 10) {
        state.isMoving = true;
      }
    }
  }, [preventDefault]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    const touch = event.changedTouches[0];
    const state = touchState.current;
    const now = Date.now();
    
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;
    const deltaTime = now - state.startTime;
    
    // Detecta tap simples ou duplo
    const tapDeltaTime = now - state.lastTapTime;
    
    if (!state.isMoving && deltaTime < 300) {
      // Tap detectado
      if (tapDeltaTime < 300) {
        // Duplo tap
        state.tapCount = 2;
        if (onDoubleTap) {
          onDoubleTap();
        }
      } else {
        // Aguarda para verificar se é duplo tap
        setTimeout(() => {
          if (state.tapCount === 1 && onTap) {
            onTap();
          }
          state.tapCount = 0;
        }, 300);
        state.tapCount = 1;
      }
      state.lastTapTime = now;
    } else if (state.isMoving) {
      // Detecta gestos de swipe
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (absX > threshold || absY > threshold) {
        if (absX > absY) {
          // Swipe horizontal
          if (deltaX > 0) {
            // Swipe para direita
            if (onSwipeRight) onSwipeRight();
          } else {
            // Swipe para esquerda
            if (onSwipeLeft) onSwipeLeft();
          }
        } else {
          // Swipe vertical
          if (deltaY > 0) {
            // Swipe para baixo
            if (onSwipeDown) onSwipeDown();
          } else {
            // Swipe para cima
            if (onSwipeUp) onSwipeUp();
          }
        }
      }
    }

    setIsTouching(false);
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, preventDefault]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  return {
    isTouching,
  };
};

// Hook específico para menu mobile com swipe
export const useMobileMenuGestures = (isOpen: boolean, onClose: () => void) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  useTouchGestures(menuRef, {
    threshold: 80,
    onSwipeLeft: () => {
      if (isOpen) {
        onClose();
      }
    },
    onSwipeRight: () => {
      // Não faz nada - swipe da direita abre o menu (pode ser implementado no componente pai)
    },
    preventDefault: true,
  });

  return menuRef;
};

// Hook para detectar se é dispositivo touch
export const useIsTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const hasMsPoints = 'msMaxTouchPoints' in navigator && Number((navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints) > 0;
    setIsTouchDevice(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      hasMsPoints
    );
  }, []);

  return isTouchDevice;
};

// Hook para melhorar a responsividade touch em botões
export const useTouchFeedback = () => {
  const [isPressed, setIsPressed] = useState(false);

  const handlers = {
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false),
    onTouchCancel: () => setIsPressed(false),
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
  };

  return {
    isPressed,
    touchProps: handlers,
  };
};