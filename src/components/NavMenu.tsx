import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu, X,
  Beef, Snowflake, ChefHat, Utensils, Package, Wrench, UtensilsCrossed
} from 'lucide-react';
import { useSubcategories } from '../hooks/useSubcategories';
import type { CategoryWithSubcategories, Subcategory } from '../hooks/useSubcategories';
import type { ProductWithCategory } from '../types/product';
import { useFeaturedProductsByCategory } from '../hooks/useProducts';

/* ----------  TYPES  ---------- */
type Category = {
  id: number | string;
  name: string;
  slug: string;
  icon?: string;
  children?: Category[];
};

/* ----------  ICON MAP  ---------- */
const iconMap: Record<string, React.ElementType> = {
  Beef, Snowflake, ChefHat, Utensils, Package, Wrench, UtensilsCrossed
};

/* ----------  PRODUTO DESTAQUE (mini componente) ---------- */
const Featured: React.FC<{ categoryId: string | number }> = ({ categoryId }) => {
  const { data, isLoading } = useFeaturedProductsByCategory(categoryId);
  const product: ProductWithCategory | undefined = data?.[0];

  if (isLoading)
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-32 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
      </div>
    );
  if (!product) return null;

  const imgUrl = product?.product_images?.[0]?.image_url || product?.image_url || '';
  return (
    <div className="space-y-3">
      {imgUrl && (
        <div className="w-full h-40 bg-white rounded-md border flex items-center justify-center overflow-hidden">
          <img
            src={imgUrl}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        </div>
      )}
      <p className="text-sm text-gray-700">{product.name}</p>
      <Link
        to={`/produto/${product.id}`}
        className="block w-full py-2 bg-orange-500 text-white text-center rounded hover:bg-orange-600"
      >
        Ver produto
      </Link>
    </div>
  );
};

/* ----------  DROPDOWN 2 COLUNAS  ---------- */
const MegaDropdown: React.FC<{
  category: Category;
  isOpen: boolean;
  onClose: () => void;
}> = ({ category, isOpen, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [alignRight, setAlignRight] = useState(false);

  useEffect(() => {
    const handle = (e: MouseEvent) =>
      ref.current && !ref.current.contains(e.target as Node) && onClose();
    if (isOpen) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const computePlacement = () => {
      const el = ref.current;
      const parent = el?.parentElement;
      if (!el || !parent) return;
      const dropWidth = el.offsetWidth || 640;
      const parentRect = parent.getBoundingClientRect();
      const spaceRight = window.innerWidth - parentRect.left;
      setAlignRight(dropWidth > spaceRight);
    };
    // compute after mount and on resize
    requestAnimationFrame(computePlacement);
    window.addEventListener('resize', computePlacement);
    return () => window.removeEventListener('resize', computePlacement);
  }, [isOpen]);

  if (!isOpen) return null;

  const Icon = category.icon ? iconMap[category.icon] : null;

  return (
    <div
      ref={ref}
      className={`absolute ${alignRight ? 'right-0 left-auto' : 'left-0'} top-full mt-2 w-[640px] max-w-[90vw] bg-white rounded-lg shadow-xl border border-gray-200 z-50`}
    >
      <div className="flex">
        <div className="flex-1 p-5 border-r">
          <div className="flex items-center gap-2 mb-3">
            {Icon && <Icon className="w-5 h-5 text-orange-500" />}
            <h3 className="font-semibold text-gray-800">{category.name}</h3>
          </div>
          <div className="max-h-64 overflow-y-auto pr-2">
            <ul className="space-y-2">
              {category.children?.map((sub) => (
                <li key={sub.id}>
                  <Link
                    to={`/categorias/${category.slug}/${sub.slug}`}
                    onClick={onClose}
                    className="block px-3 py-2 rounded text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Coluna 2 – destaque */}
        <div className="w-72 p-5">
          <Featured categoryId={category.id} />
        </div>
      </div>
    </div>
  );
};

/* ----------  NAVMENU PRINCIPAL  ---------- */
const NavMenu: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { data: categoriesWithSubs } = useSubcategories();
  const location = useLocation();
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* monta árvore pai -> filhos */
  const tree = useMemo<Category[]>(() => {
    if (!categoriesWithSubs) return [];
    return (categoriesWithSubs as CategoryWithSubcategories[]).map((p: CategoryWithSubcategories) => {
      const name = p.name.toLowerCase();
      const icon = name.includes('açougue')
        ? 'Beef'
        : name.includes('refrigeração comercial')
        ? 'Snowflake'
        : name.includes('padaria')
        ? 'ChefHat'
        : name.includes('bar') || name.includes('restaurante')
        ? 'Utensils'
        : name.includes('mobiliário')
        ? 'Package'
        : name.includes('peças')
        ? 'Wrench'
        : 'UtensilsCrossed';

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        icon,
        children: (p.subcategories || [])
          .map((k: Subcategory) => ({ id: k.id, name: k.name, slug: k.slug }))
          .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
      } as Category;
    });
  }, [categoriesWithSubs]);

  /* fecha tudo ao trocar de página */
  useEffect(() => {
    setOpen(null);
    setMobileOpen(false);
  }, [location]);

  /* função auxiliar para navegação mobile - removida pois agora usa Link direto */
  // const handleMobileNavigation = (path: string) => {
  //   console.log('Mobile navigation iniciada:', path);
  //   navigate(path);
  // };

  /* Hook para detectar dispositivos móveis */
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
  };

  // Debug para mobile
  useEffect(() => {
    if (isMobileDevice()) {
      console.log('Dispositivo móvel detectado:', navigator.userAgent);
    }
  }, []);

  /* render desktop – categorias na esquerda */
  const desktop = (
    <nav className="hidden lg:flex items-center gap-4">
      {tree.map((cat) => {
        const Icon = iconMap[cat.icon || ''];
        return (
          <div key={cat.id} className="relative">
            <button
              onClick={() => setOpen(open === cat.slug ? null : cat.slug)}
              className="flex items-center gap-1 px-3 py-2 rounded-md text-[#D0021B] hover:bg-red-50 hover:text-[#8b0000] transition"
            >
              {Icon && <Icon className="w-6 h-6" />}
              <span className="font-medium whitespace-nowrap">{cat.name}</span>
            </button>
            <MegaDropdown
              category={cat}
              isOpen={open === cat.slug}
              onClose={() => setOpen(null)}
            />
          </div>
        );
      })}
    </nav>
  );

  /* Adicionar estilos CSS para performance mobile */
  const mobileStyles = `
    .touch-manipulation {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    
    .mobile-menu-drawer {
      will-change: transform;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    
    .menu-closing {
      transition: transform 0.25s ease-out !important;
    }
    
    @media (max-width: 640px) {
      .mobile-menu-item {
        min-height: 44px;
        padding: 12px;
      }
    }
  `;

  /* render mobile – off-canvas com mesmo conteúdo */
  const mobile = (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
      <button
        onClick={() => {
          setMobileOpen(true);
          // Limpar classe de fechamento ao abrir
          const menuElement = document.querySelector('.mobile-menu-drawer');
          if (menuElement) {
            menuElement.classList.remove('menu-closing');
          }
        }}
        className="lg:hidden p-2 rounded-md text-[#D0021B]"
      >
        <Menu />
      </button>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* overlay */}
        <div
          onClick={() => {
            setMobileOpen(false);
            setOpen(null);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            setMobileOpen(false);
            setOpen(null);
          }}
          className={`absolute inset-0 bg-black transition-opacity duration-200 ${
            mobileOpen ? 'opacity-50' : 'opacity-0'
          }`}
        />
        {/* drawer */}
        <div
          className={`mobile-menu-drawer absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          } ${!mobileOpen ? 'menu-closing' : ''}`}
        >
          <header className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-gray-800">Menu</h2>
            <button onClick={() => setMobileOpen(false)}>
              <X />
            </button>
          </header>

          <div className="p-4 space-y-4 overflow-y-auto">
            {tree.map((cat) => {
              const isOpen = open === cat.slug;
              const Icon = cat.icon ? iconMap[cat.icon] : null;
              
              return (
                <div key={cat.id} className="border-b pb-3">
                  {/* Header da categoria */}
                  <button
                    onClick={() => setOpen(isOpen ? null : cat.slug)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      setOpen(isOpen ? null : cat.slug);
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-md cursor-pointer text-[#D0021B] hover:bg-red-50 hover:text-[#8b0000] transition w-full text-left active:bg-red-100 active:scale-98 touch-manipulation mobile-menu-item"
                  >
                    {Icon && <Icon className="w-6 h-6 text-[#D0021B]" />}
                    <span className="font-medium text-gray-800 whitespace-nowrap flex-1">{cat.name}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Conteúdo dropdown */}
                  <div className={`mt-3 grid grid-cols-1 gap-4 pl-8 transition-all duration-200 ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="max-h-64 overflow-y-auto pr-2">
                      <ul className="space-y-2">
                        {cat.children?.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              to={`/categorias/${cat.slug}/${sub.slug}`}
                              onClick={() => {
                                console.log('Link clicado:', sub.name);
                                // Fechar menu imediatamente
                                setMobileOpen(false);
                                setOpen(null);
                              }}
                              className="block text-sm text-gray-700 hover:text-orange-600 w-full text-left py-1 active:bg-orange-50 active:text-orange-600 transition-colors duration-150 touch-manipulation"
                              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Featured categoryId={cat.id} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className={`${className} relative`}>
      {desktop}
      {mobile}
    </div>
  );
};

export default NavMenu;