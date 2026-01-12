export default function handler(req, res) {
  if (req.method === 'POST') {
    // Na Vercel, o sitemap é dinâmico. O POST serve apenas para o admin confirmar a ação.
    return res.status(200).json({ 
      success: true, 
      enabled: true, 
      path: '/sitemap.xml', 
      message: 'Sitemap atualizado dinamicamente' 
    });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
