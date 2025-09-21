require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkProductImages() {
  try {
    const slug = 'ps22-moedor-de-carne-boca-22-15-hp-cv-220-v';
    
    // Primeiro, buscar o produto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, product_name, slug, image_url')
      .eq('slug', slug)
      .single();
    
    if (productError) {
      console.error('Erro ao buscar produto:', productError);
      return;
    }
    
    console.log('=== PRODUTO ENCONTRADO ===');
    console.log('ID:', product.id);
    console.log('Nome:', product.product_name);
    console.log('Image URL principal:', product.image_url);
    
    // Agora buscar as imagens do produto
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order');
    
    if (imagesError) {
      console.error('Erro ao buscar imagens:', imagesError);
      return;
    }
    
    console.log('\n=== IMAGENS DO PRODUTO ===');
    console.log('Total de imagens encontradas:', images ? images.length : 0);
    
    if (images && images.length > 0) {
      images.forEach((img, index) => {
        console.log(`\nImagem ${index + 1}:`);
        console.log('  ID:', img.id);
        console.log('  URL (primeiros 100 chars):', img.image_url.substring(0, 100) + '...');
        console.log('  Alt Text:', img.alt_text);
        console.log('  Sort Order:', img.sort_order);
        console.log('  É Principal:', img.is_primary);
      });
    } else {
      console.log('Nenhuma imagem encontrada para este produto.');
    }
    
  } catch (err) {
    console.error('Erro geral:', err.message);
  }
}

checkProductImages();