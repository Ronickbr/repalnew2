// Tipos principais do sistema
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  parent_id?: string;
  active: boolean;
  featured: boolean;
  sort_order: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  slug: string;
  logo?: string;
  website?: string;
  active: boolean;
  featured: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  sku: string;
  barcode?: string;
  price?: number;
  promotional_price?: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level: number;
  weight?: number;
  dimensions?: string;
  image?: string;
  additional_images?: string[];
  specifications_html?: string;
  category_id: string;
  subcategory_id?: string; // Campo para subcategoria
  brand?: string; // Campo brand é texto, não chave estrangeira
  featured: boolean;
  featured_in_dropdown: boolean;
  featured_on_homepage: boolean;
  active: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  created_at: string;
  updated_at: string;
  // Relations
  categories?: Category;
}



export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  created_at: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface FormError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormError[];
}

export interface ExportOptions {
  format: 'csv' | 'json';
  filters?: Record<string, unknown>;
  columns?: string[];
  filename?: string;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  category?: string;
  brand?: string;
  status?: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
  totalUsers: number;
  lowStockProducts: number;
  featuredProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  recentOrders: number;
  totalRevenue: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para formulários
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'datetime-local';
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
  helpText?: string;
  autoComplete?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'url' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}

// Tipos para temas e estilos
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
}

// Tipos para configurações
export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  siteLogo?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  currency: string;
  timezone: string;
  language: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    allowMessages: boolean;
  };
}

// Tipos para relatórios
export interface SalesReport {
  date: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    product: Product;
    quantity: number;
    revenue: number;
  }>;
  topCategories: Array<{
    category: Category;
    revenue: number;
  }>;
}

export interface StockReport {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
}

export interface UserActivityReport {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  topUsersByActivity: Array<{
    user: User;
    activityCount: number;
  }>;
}