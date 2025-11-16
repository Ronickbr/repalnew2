import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Position {
  top: number;
  left: number;
  width: number;
  maxWidth: number;
}

interface SmartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerElement: HTMLElement | null;
  children: React.ReactNode;
  className?: string;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  maxHeight?: number;
  offset?: number;
}

const SmartDropdown: React.FC<SmartDropdownProps> = ({
  isOpen,
  onClose,
  triggerElement,
  children,
  className = '',
  placement = 'bottom-start',
  maxHeight = 400,
  offset = 8
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({
    top: 0,
    left: 0,
    width: 0,
    maxWidth: 0
  });
  const [isPositioned, setIsPositioned] = useState(false);
  const [computedMaxHeight, setComputedMaxHeight] = useState(maxHeight);

  // Função para calcular posição ideal do dropdown
  const calculatePosition = useCallback(() => {
    if (!triggerElement || !dropdownRef.current) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;
    const scrollLeft = window.pageXOffset;

    // Largura fixa de 400px conforme solicitado
    
    // Largura fixa de 400px
    const maxAvailableWidth = 400;

    // Posição base inicial
    let top = 0;
    let left = 0;
    const width = 400; // Largura fixa de 400px
    const maxWidth = maxAvailableWidth;

    // Calcular posição baseada no placement
    switch (placement) {
      case 'bottom-start':
        top = triggerRect.bottom + offset;
        left = triggerRect.left;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + offset;
        left = triggerRect.right - width;
        break;
      case 'top-start':
        top = triggerRect.top - offset;
        left = triggerRect.left;
        break;
      case 'top-end':
        top = triggerRect.top - offset;
        left = triggerRect.right - width;
        break;
    }

    // Ajustar para não ultrapassar as bordas da viewport
    // Horizontal
    if (left < 16) {
      left = 16;
    } else if (left + width > viewportWidth - 16) {
      left = viewportWidth - width - 16;
    }

    // Vertical - verificar se cabe embaixo, senão colocar em cima
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    
    let newMaxHeight = maxHeight;
    if (placement.startsWith('bottom') && spaceBelow < 200 && spaceAbove > spaceBelow) {
      // Não cabe embaixo, colocar em cima
      top = triggerRect.top - offset;
      // Recalcular altura máxima
      newMaxHeight = Math.min(maxHeight, spaceAbove - offset - 16);
    } else if (placement.startsWith('top') && spaceAbove < 200 && spaceBelow > spaceAbove) {
      // Não cabe em cima, colocar embaixo
      top = triggerRect.bottom + offset;
      // Recalcular altura máxima
      newMaxHeight = Math.min(maxHeight, spaceBelow - offset - 16);
    } else {
      // Ajustar altura máxima baseada no espaço disponível
      const availableSpace = placement.startsWith('bottom') ? spaceBelow : spaceAbove;
      newMaxHeight = Math.min(maxHeight, availableSpace - offset - 16);
    }

    // Adicionar scroll offset
    top += scrollTop;
    left += scrollLeft;

    setPosition({
      top,
      left,
      width,
      maxWidth
    });
    setComputedMaxHeight(newMaxHeight);
    setIsPositioned(true);
  }, [triggerElement, placement, offset, maxHeight]);

  // Atualizar posição quando abrir ou quando a janela for redimensionada
  useEffect(() => {
    if (isOpen && triggerElement) {
      // Pequeno delay para garantir que o DOM foi atualizado
      const timer = setTimeout(() => {
        calculatePosition();
      }, 50); // Aumentado de 10ms para 50ms para garantir renderização

      return () => clearTimeout(timer);
    }
  }, [isOpen, triggerElement, calculatePosition]);

  // Atualizar posição em resize e scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      calculatePosition();
    };

    const handleScroll = () => {
      calculatePosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, calculatePosition]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerElement &&
        !triggerElement.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerElement]);

  if (!isOpen || !triggerElement) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className={`fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 ${className}`}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        maxWidth: `${position.maxWidth}px`,
        maxHeight: `${computedMaxHeight}px`,
        overflow: 'hidden',
        opacity: isPositioned ? 1 : 0,
        transform: isPositioned ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 200ms ease-out, transform 200ms ease-out'
      }}
      role="menu"
      aria-hidden={!isOpen}
    >
      <div 
        className="w-full h-full overflow-auto"
        style={{ maxHeight: `${computedMaxHeight}px` }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default SmartDropdown;