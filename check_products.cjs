require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkProducts() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, product_name, slug')
      .eq('active', true)
      .limit(3);
    
    if (error) {
      console.error('Erro:', error);
      return;
    }
    
    console.log('Produtos disponíveis:');
    products.forEach(p => {
      console.log(`- ${p.product_name} (slug: ${p.slug || 'sem-slug'})`);
    });
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

checkProducts();