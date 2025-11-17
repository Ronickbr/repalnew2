import React from 'react';

interface DashboardStatsProps {
  stats: {
    totalProducts: number;
    totalCategories: number;
    totalBrands: number;
    totalUsers: number;
    totalLeads: number;
    totalBanners: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statItems = [
    {
      name: 'Produtos',
      value: stats.totalProducts,
      icon: 'Package',
      color: 'blue',
      href: '/admin/products',
      description: 'Total de produtos cadastrados'
    },
    {
      name: 'Categorias',
      value: stats.totalCategories,
      icon: 'Filter',
      color: 'green',
      href: '/admin/categories',
      description: 'Categorias de produtos'
    },
    {
      name: 'Marcas',
      value: stats.totalBrands,
      icon: 'ShoppingBag',
      color: 'purple',
      href: '/admin/brands',
      description: 'Marcas disponíveis'
    },
    {
      name: 'Usuários',
      value: stats.totalUsers,
      icon: 'Users',
      color: 'orange',
      href: '/admin/users',
      description: 'Usuários cadastrados'
    },
    {
      name: 'Leads',
      value: stats.totalLeads,
      icon: 'UserPlus',
      color: 'indigo',
      href: '/admin/leads',
      description: 'Leads capturados'
    },
    {
      name: 'Banners',
      value: stats.totalBanners,
      icon: 'Image',
      color: 'pink',
      href: '/admin/banners',
      description: 'Banners ativos'
    }
  ];

  const getIcon = (iconName: string) => {
    const icons = {
      Package: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      Filter: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      ),
      ShoppingBag: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      Users: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      UserPlus: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      Image: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    };
    return icons[iconName as keyof typeof icons] || icons.Package;
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100',
      pink: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {statItems.map((item) => (
        <a
          key={item.name}
          href={item.href}
          className={`group relative overflow-hidden rounded-lg border-2 p-3 sm:p-4 transition-all duration-200 hover:shadow-lg hover:scale-105 ${getColorClasses(item.color)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium opacity-80 group-hover:opacity-100">
                {item.name}
              </p>
              <p className="text-lg sm:text-2xl font-bold group-hover:scale-110 transition-transform">
                {item.value.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs opacity-70 group-hover:opacity-100 mt-1 leading-tight">
                {item.description}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <div className="rounded-full bg-white bg-opacity-20 p-1.5 sm:p-2 group-hover:bg-opacity-30 transition-all">
                {getIcon(item.icon)}
              </div>
            </div>
          </div>
          
          {/* Efeito de brilho no hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
        </a>
      ))}
    </div>
  );
};

export default DashboardStats;