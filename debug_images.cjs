require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testProductImages() {
  try {
    console.log('🔍 Testando carregamento de imagens de produtos...');
    
    // Buscar um produto com suas imagens
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        product_name,
        slug,
        image_url,
        product_images (
          id,
          image_url,
          alt_text,
          sort_order,
          is_primary
        )
      `)
      .eq('active', true)
      .limit(1)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar produto:', error);
      return;
    }
    
    console.log('✅ Produto encontrado:', {
      id: product.id,
      name: product.product_name,
      slug: product.slug,
      image_url: product.image_url,
      product_images_count: product.product_images?.length || 0
    });
    
    if (product.product_images && product.product_images.length > 0) {
      console.log('📸 Imagens do produto:');
      product.product_images.forEach((img, index) => {
        console.log(`  ${index + 1}. URL: ${img.image_url}`);
        console.log(`     Alt: ${img.alt_text || 'N/A'}`);
        console.log(`     Sort: ${img.sort_order}`);
        console.log(`     Primary: ${img.is_primary}`);
      });
    } else {
      console.log('⚠️ Nenhuma imagem encontrada na tabela product_images');
      if (product.image_url) {
        console.log('📷 Usando image_url principal:', product.image_url);
      }
    }
    
  } catch (err) {
    console.error('💥 Erro:', err.message);
  }
}

testProductImages();