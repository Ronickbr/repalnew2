import React, { useState } from 'react';
import CategoryManager from '../../components/admin/CategoryManager';
import type { Category } from '../../lib/supabase';

const CategoriesPage: React.FC = () => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  return (
    <div>
      <CategoryManager
        onCategorySelect={(category) => {
          
          setEditingCategory(category);
        }}
        selectedCategory={editingCategory}
      />
    </div>
  );
};

export default CategoriesPage;
