import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  Beef, Snowflake, ChefHat, Utensils, Package, Wrench, UtensilsCrossed,
  Phone, Mail,
  ShoppingCart
} from 'lucide-react';
import { useSubcategories } from '../hooks/useSubcategories';
import type { CategoryWithSubcategories, Subcategory } from '../hooks/useSubcategories';
import type { ProductWithCategory } from '../types/product';
import { useFeaturedProductsByCategory } from '../hooks/useProducts';
import { useSiteSettings } from '../hooks/useSiteSettings';

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
                    to={`/categorias/${category.slug}?sub=${sub.id}`}
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

import SearchBar from './SearchBar';

/* ----------  MOBILE DRAWER COMPONENT  ---------- */
export const MobileMenuDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpenBudget: () => void;
}> = ({ isOpen, onClose, onOpenBudget }) => {
  // Force update check
  const { data: categoriesWithSubs } = useSubcategories();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const { contactPhone, contactEmail } = useSiteSettings();

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

  // Styles for mobile performance handled via Tailwind utility classes
  // touch-manipulation is available in Tailwind
  // will-change-transform is available or can be arbitrary
  
  return (
    <>
      <div
        className={`fixed inset-0 z-[2000] lg:hidden ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      >
        {/* overlay */}
        <div
          onClick={onClose}
          className={`absolute inset-0 bg-black transition-opacity duration-200 ${
            isOpen ? 'opacity-50' : 'opacity-0'
          }`}
          aria-label="Fechar menu"
        />
        {/* drawer */}
        <div
          className={`absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col will-change-transform [backface-visibility:hidden] ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header do Menu com Busca e Fechar */}
          <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
               <span className="font-semibold text-gray-800 text-lg">Menu</span>
               <button 
                 onClick={onClose} 
                 className="min-w-[48px] min-h-[48px] flex items-center justify-center -mr-2 text-gray-500 hover:text-primary active:bg-gray-100 rounded-full transition-colors touch-manipulation"
                 aria-label="Fechar menu"
               >
                <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="relative">
              <SearchBar 
                isMobile 
                placeholder="Pesquisar..." 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all h-[48px]"
                iconClassName="w-5 h-5 text-gray-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Minha Lista Section */}
            <div className="p-4 border-b border-gray-100">
               <button
                 onClick={() => {
                   onClose();
                   onOpenBudget();
                 }}
                 className="flex items-center gap-3 w-full px-3 rounded-lg text-gray-800 hover:bg-red-50 active:bg-red-100 hover:text-primary font-medium transition-colors touch-manipulation min-h-[48px] p-3"
               >
                 <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-primary">
                    <ShoppingCart className="w-5 h-5" />
                 </div>
                 <span className="text-base">Minha Lista</span>
               </button>
            </div>

            {/* Links Principais */}
            <div className="p-4 space-y-1 border-b border-gray-100">
                <Link 
                  to="/" 
                  className="flex items-center gap-3 px-3 rounded-lg text-gray-700 hover:bg-red-50 active:bg-red-100 hover:text-primary font-medium transition-colors min-h-[48px] p-3"
                  onClick={onClose}
                >
                  <span className="text-base">Início</span>
                </Link>

                <Link 
                  to="/minha-conta" 
                  className="flex items-center gap-3 px-3 rounded-lg text-gray-700 hover:bg-red-50 active:bg-red-100 hover:text-primary font-medium transition-colors min-h-[48px] p-3"
                  onClick={onClose}
                >
                  <span className="text-base">Minha Conta</span>
                </Link>
            </div>

            {/* Categorias */}
            <div className="p-4 space-y-2">
              <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categorias</h3>
              {tree.map((cat) => {
                const isCatOpen = openCategory === cat.slug;
                const Icon = cat.icon ? iconMap[cat.icon] : null;
                
                return (
                  <div key={cat.id} className="border-b border-gray-50 last:border-0">
                    <button
                      onClick={() => setOpenCategory(isCatOpen ? null : cat.slug)}
                      className="flex items-center gap-3 px-3 rounded-lg cursor-pointer text-gray-700 hover:bg-red-50 active:bg-red-100 hover:text-primary transition w-full text-left touch-manipulation min-h-[48px] p-3"
                      aria-expanded={isCatOpen}
                    >
                      {Icon && <Icon className="w-6 h-6 text-gray-400" />}
                      <span className="font-medium flex-1 text-base">{cat.name}</span>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCatOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <div 
                      className={`grid transition-all duration-300 ease-in-out ${
                        isCatOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="pl-12 pr-2 py-1 space-y-1">
                          {cat.children?.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/categorias/${cat.slug}?sub=${sub.id}`}
                              onClick={onClose}
                              className="block text-sm text-gray-600 hover:text-primary active:bg-gray-50 px-2 rounded transition-colors mobile-menu-item flex items-center"
                            >
                              {sub.name}
                            </Link>
                          ))}
                          <Link
                              to={`/categorias/${cat.slug}`}
                              onClick={onClose}
                              className="block text-sm font-medium text-primary hover:underline px-2 mt-1 mobile-menu-item flex items-center"
                           >
                              Ver tudo em {cat.name}
                           </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contact Info Footer */}
            <div className="mt-4 p-4 bg-gray-50 border-t border-gray-200 pb-safe">
               {contactPhone && (
                  <a href={`tel:${contactPhone}`} className="flex items-center gap-3 text-sm text-gray-600 mb-2 mobile-menu-item active:bg-gray-200 rounded-lg">
                    <Phone className="w-5 h-5" /> {contactPhone}
                  </a>
               )}
               {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 text-sm text-gray-600 mobile-menu-item active:bg-gray-200 rounded-lg">
                    <Mail className="w-5 h-5" /> {contactEmail}
                  </a>
               )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ----------  NAVMENU PRINCIPAL (DESKTOP) ---------- */
const NavMenu: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { data: categoriesWithSubs } = useSubcategories();
  const location = useLocation();
  const [open, setOpen] = useState<string | null>(null);

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
  }, [location]);

  return (
    <div className={`${className} relative`}>
      <nav className="hidden lg:flex items-center gap-4">
        {tree.map((cat) => {
          const Icon = iconMap[cat.icon || ''];
          return (
            <div key={cat.id} className="relative">
              <button
                onClick={() => setOpen(open === cat.slug ? null : cat.slug)}
                className="flex items-center gap-1 px-3 py-2 rounded-md text-primary hover:bg-red-50 hover:text-primary-hover transition"
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
    </div>
  );
};

export default NavMenu;
