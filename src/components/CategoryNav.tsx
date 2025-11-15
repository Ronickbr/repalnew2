import React, { useMemo } from 'react'
import { Beef, Utensils, Package, ChefHat, Wrench, Snowflake, UtensilsCrossed } from 'lucide-react'

type IconName = 'Beef' | 'Utensils' | 'Package' | 'ChefHat' | 'Wrench' | 'Snowflake' | 'UtensilsCrossed'

interface CategoryItem {
  id: string | number
  name: string
  icon?: IconName
}

interface CategoryNavProps {
  categories?: CategoryItem[]
  className?: string
}

const iconMap: Record<IconName, React.ComponentType<any>> = {
  Beef,
  Utensils,
  Package,
  ChefHat,
  Wrench,
  Snowflake,
  UtensilsCrossed,
}

const defaultCategories: CategoryItem[] = [
  { id: 1, name: 'Açougue', icon: 'Beef' },
  { id: 2, name: 'Bar e Restaurante', icon: 'Utensils' },
  { id: 3, name: 'Mobiliário em Inox', icon: 'Package' },
  { id: 4, name: 'Padaria e Confeitaria', icon: 'ChefHat' },
  { id: 5, name: 'Refrigeração Comercial', icon: 'Snowflake' },
  { id: 6, name: 'Utilidades Domésticas', icon: 'UtensilsCrossed' },
]

const CategoryNav: React.FC<CategoryNavProps> = ({ categories, className = '' }) => {
  const items = useMemo(() => categories && categories.length > 0 ? categories : defaultCategories, [categories])

  const renderIcon = (icon?: IconName) => {
    if (!icon) return null
    const Icon = iconMap[icon]
    return <Icon className="w-7 h-7 text-[#D0021B] group-hover:text-[#FF4D4D] transition-colors duration-200" aria-hidden="true" />
  }

  return (
    <div className={`${className}`}>
      <nav className="hidden md:flex items-center justify-center space-x-4">
        {items.map((cat) => (
          <div key={cat.id} className="relative">
            <button
              className="group flex flex-col items-center space-y-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 text-[#D0021B] hover:text-[#FF4D4D] hover:bg-red-50"
              aria-expanded="false"
              aria-haspopup="true"
              aria-label={`Menu ${cat.name}`}
            >
              {renderIcon(cat.icon)}
              <span className="text-center whitespace-nowrap">{cat.name}</span>
            </button>
          </div>
        ))}
      </nav>

      <nav className="md:hidden flex items-center justify-center space-x-2 overflow-x-auto no-scrollbar py-2">
        {items.map((cat) => (
          <button
            key={cat.id}
            className="group flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 text-[#D0021B] hover:text-[#FF4D4D] hover:bg-red-50"
            aria-label={`Abrir ${cat.name}`}
          >
            {renderIcon(cat.icon)}
            <span className="text-center whitespace-nowrap">{cat.name}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default CategoryNav