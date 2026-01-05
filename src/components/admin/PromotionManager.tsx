import React, { useState, useEffect } from 'react';
import { supabase, Promotion, PromotionInsert } from '../../lib/supabase';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  X,
  Calendar, 
  Image as ImageIcon,
  Tag,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  MousePointer,
  Clock,
  Scroll,
  Power,
  Smartphone,
  Monitor,
  Layout,
  Type,
  Move,
  ArrowRight
} from 'lucide-react';
import UnifiedImageUpload, { ImageItem } from '../UnifiedImageUpload';

const PromotionManager: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionInsert>({
    title: '',
    description: '',
    discount_percentage: 0,
    image_url: '',
    link_url: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    active: true,
    trigger_type: 'time',
    trigger_value: 5,
    template_type: 'custom',
    content_layout: []
  });
  
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'details' | 'content' | 'triggers'>('details');

  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [unifiedImages, setUnifiedImages] = useState<ImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadBase64Image = async (base64Url: string): Promise<string> => {
    try {
      // Extrair o tipo MIME e os dados base64
      const matches = base64Url.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Formato de imagem base64 inválido');
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      // Converter base64 para Blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      const fileExt = mimeType.split('/')[1] || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
      const filePath = `promotions/${fileName}`;
      
      // Fazer upload para o Supabase Storage (usando bucket 'products' como fallback seguro)
      const { error } = await supabase.storage
        .from('products') 
        .upload(filePath, blob);
      
      if (error) {
        console.error('Erro detalhado do Supabase Storage:', error);
        throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem base64:', error);
      throw error;
    }
  };

  const processImageUrl = async (url: string): Promise<string> => {
    const MAX_URL_LENGTH = 1024;
    
    if (url.length > MAX_URL_LENGTH) {
      if (url.startsWith('data:')) {
        try {
          const uploadedUrl = await uploadBase64Image(url);
          return uploadedUrl;
        } catch (error) {
          console.error('Erro ao fazer upload da imagem base64:', error);
          return '';
        }
      }
    }
    return url;
  };

  const syncUnifiedImagesToFormData = async (images: ImageItem[]) => {
    if (images.length > 0) {
      const mainImage = images[0];
      try {
        const processedMainImageUrl = await processImageUrl(mainImage.url);
        
        if (processedMainImageUrl === '' && mainImage.url.startsWith('data:')) {
           setFormErrors(prev => ({ ...prev, image_url: 'A imagem é muito grande e não pôde ser processada.' }));
           return;
        }

        setFormData(prev => ({
          ...prev,
          image_url: processedMainImageUrl
        }));
      } catch (error) {
        console.error('Erro ao processar imagens:', error);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        image_url: ''
      }));
    }
  };

  const handleOpenModal = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        title: promotion.title,
        description: promotion.description || '',
        discount_percentage: promotion.discount_percentage || 0,
        image_url: promotion.image_url || '',
        link_url: promotion.link_url || '',
        start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
        end_date: promotion.end_date ? promotion.end_date.split('T')[0] : '',
        active: promotion.active,
        trigger_type: promotion.trigger_type || 'time',
        trigger_value: promotion.trigger_value || 5,
        template_type: promotion.template_type || 'custom',
        content_layout: promotion.content_layout || []
      });
      
      // Initialize unifiedImages
      if (promotion.image_url) {
        setUnifiedImages([{ id: 'main', url: promotion.image_url, type: 'url' }]);
      } else {
        setUnifiedImages([]);
      }
    } else {
      setEditingPromotion(null);
      setFormData({
        title: '',
        description: '',
        discount_percentage: 0,
        image_url: '',
        link_url: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        active: true,
        trigger_type: 'time',
        trigger_value: 5,
        template_type: 'custom',
        content_layout: []
      });
      setUnifiedImages([]);
    }
    setFormErrors({});
    setActiveTab('details');
    setShowModal(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title) errors.title = 'Título é obrigatório';
    if (!formData.start_date) errors.start_date = 'Data de início é obrigatória';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        // Convert empty strings to null for optional fields
        description: formData.description || null,
        image_url: formData.image_url || null,
        link_url: formData.link_url || null,
        end_date: formData.end_date || null,
        discount_percentage: formData.discount_percentage ?? 0,
      };

      if (editingPromotion) {
        const { error } = await supabase
          .from('promotions')
          .update(dataToSave)
          .eq('id', editingPromotion.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert([dataToSave]);
        
        if (error) throw error;
      }

      setShowModal(false);
      fetchPromotions();
    } catch (error) {
      console.error('Erro ao salvar promoção:', error);
      setFormErrors({ submit: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDeleteConfirm(null);
      fetchPromotions();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const applyTemplate = (type: string) => {
    let newData: Partial<PromotionInsert> = { template_type: type as any };
    
    switch(type) {
      case 'first_purchase':
        newData = {
          ...newData,
          title: '10% de Desconto na Primeira Compra',
          description: 'Aproveite nosso presente de boas-vindas!',
          trigger_type: 'time',
          trigger_value: 10,
          content_layout: [
            { id: '1', type: 'text', value: 'Cadastre-se para ganhar 10% de desconto na primeira compra!' },
            { id: '2', type: 'form', value: 'Quero meu desconto' }
          ]
        };
        break;
      case 'abandoned_cart':
        newData = {
          ...newData,
          title: 'Não vá embora ainda!',
          description: 'Seu carrinho está cheio de coisas legais.',
          trigger_type: 'exit_intent',
          trigger_value: undefined,
          content_layout: [
            { id: '1', type: 'text', value: 'Esqueceu algo? Finalize agora e garanta seus produtos.' },
            { id: '2', type: 'button', value: 'Voltar ao Carrinho', action: 'link' }
          ]
        };
        break;
      case 'exit_intent':
        newData = {
          ...newData,
          title: 'Espere! Temos uma oferta para você',
          description: 'Antes de sair, confira esta oportunidade exclusiva.',
          trigger_type: 'exit_intent',
          trigger_value: undefined,
          content_layout: [
            { id: '1', type: 'text', value: 'Não perca esta chance única. Assine nossa newsletter e fique por dentro.' },
            { id: '2', type: 'form', value: 'Inscrever-se' }
          ]
        };
        break;
      case 'special_date':
        newData = {
          ...newData,
          title: 'Oferta Especial de Feriado',
          trigger_type: 'time',
          trigger_value: 5,
           content_layout: [
            { id: '1', type: 'text', value: 'Promoção por tempo limitado.' },
            { id: '2', type: 'button', value: 'Ver Ofertas', action: 'link' }
          ]
        };
        break;
      case 'custom':
        newData = {
          ...newData,
          title: 'Nova Promoção',
          description: '',
          trigger_type: 'time',
          trigger_value: 5,
          content_layout: []
        };
        break;
    }
    
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const addContentBlock = (type: 'text' | 'image' | 'button' | 'form') => {
    const newBlock = { 
      id: Date.now().toString(), 
      type, 
      value: type === 'text' ? 'Novo texto' : (type === 'button' || type === 'form' ? 'Enviar' : ''), 
      action: type === 'button' ? 'link' : undefined 
    };
    setFormData(prev => ({
      ...prev,
      content_layout: [...(prev.content_layout || []), newBlock]
    }));
  };

  const removeContentBlock = (index: number) => {
    const newLayout = [...(formData.content_layout || [])];
    newLayout.splice(index, 1);
    setFormData(prev => ({ ...prev, content_layout: newLayout }));
  };
  
  const moveContentBlock = (index: number, direction: 'up' | 'down') => {
     const newLayout = [...(formData.content_layout || [])];
     if (direction === 'up' && index > 0) {
       [newLayout[index], newLayout[index - 1]] = [newLayout[index - 1], newLayout[index]];
     } else if (direction === 'down' && index < newLayout.length - 1) {
       [newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
     }
     setFormData(prev => ({ ...prev, content_layout: newLayout }));
  };
  
  const updateContentBlock = (index: number, field: string, value: any) => {
    const newLayout = [...(formData.content_layout || [])];
    newLayout[index] = { ...newLayout[index], [field]: value };
    setFormData(prev => ({ ...prev, content_layout: newLayout }));
  };

  const filteredPromotions = promotions.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Promoções</h2>
          <p className="text-gray-600 mt-1">Cadastre promoções para aparecerem nos pop-ups do site</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-red-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-800 transition-colors"
        >
          <Plus size={20} />
          Nova Promoção
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar promoções..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
        </div>
      </div>

      {/* Lista de Promoções */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando promoções...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promo) => (
            <div key={promo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
              {/* Preview da Imagem */}
              <div className="h-40 bg-gray-100 relative">
                {promo.image_url ? (
                  <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={40} />
                  </div>
                )}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${promo.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {promo.active ? 'Ativo' : 'Inativo'}
                </div>
                {promo.discount_percentage && (
                  <div className="absolute bottom-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {promo.discount_percentage}% OFF
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{promo.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{promo.description || 'Sem descrição'}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(promo.start_date || '').toLocaleDateString()}</span>
                  </div>
                  {promo.end_date && (
                    <div className="flex items-center gap-1">
                      <span>até</span>
                      <span>{new Date(promo.end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  {deleteConfirm === promo.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 font-medium">Confirmar?</span>
                      <button 
                        onClick={() => handleDelete(promo.id)}
                        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(null)}
                        className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleOpenModal(promo)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(promo.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredPromotions.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Tag className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma promoção encontrada</h3>
              <p className="text-gray-500 mt-1">Crie uma nova promoção para começar.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar - Form */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'details' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}>Detalhes</button>
                  <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'content' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}>Conteúdo (Drag & Drop)</button>
                  <button onClick={() => setActiveTab('triggers')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'triggers' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}>Gatilhos</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'details' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Título da Promoção *</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            placeholder="Ex: Oferta de Verão"
                          />
                          {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                          <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            rows={3}
                            placeholder="Breve descrição da oferta..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.discount_percentage || ''}
                              onChange={(e) => setFormData({...formData, discount_percentage: Number(e.target.value)})}
                              className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                              placeholder="0"
                              min="0"
                              max="100"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <div className="flex items-center h-[42px]">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={formData.active}
                                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              <span className="ml-3 text-sm font-medium text-gray-700">{formData.active ? 'Ativo' : 'Inativo'}</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início *</label>
                          <input
                            type="date"
                            value={formData.start_date || ''}
                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                          />
                          {formErrors.start_date && <p className="text-red-500 text-xs mt-1">{formErrors.start_date}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término (Opcional)</label>
                          <input
                            type="date"
                            value={formData.end_date || ''}
                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de Fundo</label>
                          <UnifiedImageUpload
                            images={unifiedImages}
                            onImagesChange={async (newImages) => {
                              setUnifiedImages(newImages);
                              await syncUnifiedImagesToFormData(newImages);
                            }}
                            maxImages={1}
                            maxSizeInMB={5}
                          />
                          {formErrors.image_url && <p className="text-red-500 text-xs mt-1">{formErrors.image_url}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Link de Destino</label>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="text"
                              value={formData.link_url || ''}
                              onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'content' && (
                    <div className="space-y-6">
                      {/* Templates */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Templates Pré-moldados</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => applyTemplate('first_purchase')} className="p-3 border rounded-lg hover:border-red-500 hover:bg-red-50 text-left text-sm">
                            <div className="font-medium">Primeira Compra</div>
                            <div className="text-xs text-gray-500">Cupom de boas-vindas</div>
                          </button>
                          <button onClick={() => applyTemplate('abandoned_cart')} className="p-3 border rounded-lg hover:border-red-500 hover:bg-red-50 text-left text-sm">
                            <div className="font-medium">Abandono de Carrinho</div>
                            <div className="text-xs text-gray-500">Recuperar vendas</div>
                          </button>
                          <button onClick={() => applyTemplate('exit_intent')} className="p-3 border rounded-lg hover:border-red-500 hover:bg-red-50 text-left text-sm">
                            <div className="font-medium">Sair da Página</div>
                            <div className="text-xs text-gray-500">Reter visitante</div>
                          </button>
                          <button onClick={() => applyTemplate('special_date')} className="p-3 border rounded-lg hover:border-red-500 hover:bg-red-50 text-left text-sm">
                            <div className="font-medium">Datas Especiais</div>
                            <div className="text-xs text-gray-500">Feriados e eventos</div>
                          </button>
                          <button onClick={() => applyTemplate('custom')} className="p-3 border rounded-lg hover:border-red-500 hover:bg-red-50 text-left text-sm">
                            <div className="font-medium">Em Branco</div>
                            <div className="text-xs text-gray-500">Começar do zero</div>
                          </button>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Editor Drag-and-Drop (Simulado)</h4>
                        <div className="flex gap-2 mb-4">
                          <button onClick={() => addContentBlock('text')} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 flex items-center gap-1"><Type size={14}/> Texto</button>
                          <button onClick={() => addContentBlock('image')} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 flex items-center gap-1"><ImageIcon size={14}/> Imagem</button>
                          <button onClick={() => addContentBlock('button')} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 flex items-center gap-1"><MousePointer size={14}/> Botão</button>
                          <button onClick={() => addContentBlock('form')} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 flex items-center gap-1"><Layout size={14}/> Form</button>
                        </div>

                        <div className="space-y-3">
                          {formData.content_layout?.map((block: any, index: number) => (
                            <div key={block.id || index} className="p-3 border border-gray-200 rounded-lg bg-gray-50 group">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1">
                                  <Move size={12}/> {block.type}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => moveContentBlock(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">↑</button>
                                  <button onClick={() => moveContentBlock(index, 'down')} disabled={index === (formData.content_layout?.length || 0) - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">↓</button>
                                  <button onClick={() => removeContentBlock(index)} className="p-1 hover:bg-red-100 text-red-500 rounded"><Trash2 size={14}/></button>
                                </div>
                              </div>
                              
                              {block.type === 'text' && (
                                <input 
                                  type="text" 
                                  value={block.value} 
                                  onChange={(e) => updateContentBlock(index, 'value', e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  placeholder="Digite o texto..."
                                />
                              )}

                              {block.type === 'image' && (
                                <div className="space-y-2">
                                  <input 
                                    type="text" 
                                    value={block.value} 
                                    onChange={(e) => updateContentBlock(index, 'value', e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                    placeholder="URL da imagem..."
                                  />
                                  {block.value && (
                                    <div className="h-20 w-full bg-gray-200 rounded overflow-hidden">
                                      <img src={block.value} alt="Preview" className="h-full w-full object-cover" />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {block.type === 'button' && (
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={block.value} 
                                    onChange={(e) => updateContentBlock(index, 'value', e.target.value)}
                                    className="flex-1 px-2 py-1 border rounded text-sm"
                                    placeholder="Texto do botão"
                                  />
                                </div>
                              )}

                              {block.type === 'form' && (
                                <div className="space-y-2">
                                  <div className="text-xs text-gray-500 mb-1">Campos: Nome, E-mail, WhatsApp</div>
                                  <input 
                                    type="text" 
                                    value={block.value} 
                                    onChange={(e) => updateContentBlock(index, 'value', e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                    placeholder="Texto do botão de envio"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {(!formData.content_layout || formData.content_layout.length === 0) && (
                            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-lg">
                              Adicione blocos de conteúdo acima
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'triggers' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Quando exibir este pop-up?</h4>
                        
                        <div className="space-y-4">
                          <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.trigger_type === 'exit_intent' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setFormData({...formData, trigger_type: 'exit_intent'})}>
                            <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded shadow-sm"><MousePointer className="text-red-600" /></div>
                              <div>
                                <div className="font-medium">Intenção de Saída (Exit Intent)</div>
                                <div className="text-sm text-gray-500">Exibir quando o mouse sair da janela</div>
                              </div>
                            </div>
                          </div>

                          <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.trigger_type === 'time' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setFormData({...formData, trigger_type: 'time'})}>
                            <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded shadow-sm"><Clock className="text-red-600" /></div>
                              <div className="flex-1">
                                <div className="font-medium">Tempo na Página</div>
                                <div className="text-sm text-gray-500">Exibir após X segundos</div>
                              </div>
                            </div>
                            {formData.trigger_type === 'time' && (
                              <div className="mt-3 pl-12">
                                <label className="text-sm text-gray-600">Segundos:</label>
                                <input 
                                  type="number" 
                                  value={formData.trigger_value || 5} 
                                  onChange={(e) => setFormData({...formData, trigger_value: Number(e.target.value)})}
                                  className="ml-2 w-20 px-2 py-1 border rounded"
                                />
                              </div>
                            )}
                          </div>

                          <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.trigger_type === 'scroll' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setFormData({...formData, trigger_type: 'scroll'})}>
                            <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded shadow-sm"><Scroll className="text-red-600" /></div>
                              <div className="flex-1">
                                <div className="font-medium">Rolagem (Scroll)</div>
                                <div className="text-sm text-gray-500">Exibir após rolar X% da página</div>
                              </div>
                            </div>
                            {formData.trigger_type === 'scroll' && (
                              <div className="mt-3 pl-12">
                                <label className="text-sm text-gray-600">Porcentagem:</label>
                                <input 
                                  type="number" 
                                  value={formData.trigger_value || 50} 
                                  onChange={(e) => setFormData({...formData, trigger_value: Number(e.target.value)})}
                                  className="ml-2 w-20 px-2 py-1 border rounded"
                                />
                              </div>
                            )}
                          </div>

                          <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.trigger_type === 'inactivity' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setFormData({...formData, trigger_type: 'inactivity'})}>
                            <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded shadow-sm"><Power className="text-red-600" /></div>
                              <div className="flex-1">
                                <div className="font-medium">Inatividade</div>
                                <div className="text-sm text-gray-500">Exibir após X segundos sem interação</div>
                              </div>
                            </div>
                            {formData.trigger_type === 'inactivity' && (
                              <div className="mt-3 pl-12">
                                <label className="text-sm text-gray-600">Segundos:</label>
                                <input 
                                  type="number" 
                                  value={formData.trigger_value || 30} 
                                  onChange={(e) => setFormData({...formData, trigger_value: Number(e.target.value)})}
                                  className="ml-2 w-20 px-2 py-1 border rounded"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 disabled:opacity-50">
                    {isSubmitting ? 'Salvando...' : 'Salvar Promoção'}
                  </button>
                </div>
              </div>

              {/* Right Sidebar - Preview */}
              <div className="w-1/2 bg-gray-100 p-8 flex flex-col items-center justify-center overflow-y-auto">
                <div className="mb-6 flex gap-2 bg-white p-1 rounded-lg shadow-sm">
                  <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded flex items-center gap-2 ${previewMode === 'desktop' ? 'bg-gray-100 text-red-900 font-medium' : 'text-gray-500 hover:text-gray-900'}`}>
                    <Monitor size={18} /> Desktop
                  </button>
                  <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded flex items-center gap-2 ${previewMode === 'mobile' ? 'bg-gray-100 text-red-900 font-medium' : 'text-gray-500 hover:text-gray-900'}`}>
                    <Smartphone size={18} /> Mobile
                  </button>
                </div>
                
                <div className={`bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300 relative flex flex-col ${previewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-auto min-h-[400px] max-w-xl'}`}>
                    {/* Header bar fake */}
                    <div className="bg-gray-800 h-6 w-full flex items-center px-2 space-x-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>

                    {/* Content Preview */}
                    <div className="relative flex-1 overflow-y-auto">
                      {formData.image_url && (
                        <div className="w-full h-40 bg-cover bg-center" style={{ backgroundImage: `url(${formData.image_url})` }}></div>
                      )}
                      
                      <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{formData.title || 'Título da Promoção'}</h2>
                        <p className="text-gray-600 mb-4">{formData.description || 'Descrição da promoção aparecerá aqui.'}</p>
                        
                        {/* Dynamic Blocks */}
                        <div className="space-y-4">
                          {formData.content_layout?.map((block: any, idx: number) => (
                            <div key={idx}>
                              {block.type === 'text' && <p className="text-gray-700">{block.value}</p>}
                              {block.type === 'image' && block.value && (
                                <img src={block.value} alt="Content" className="w-full h-auto rounded-lg" />
                              )}
                              {block.type === 'button' && (
                                <button className="w-full bg-red-600 text-white py-3 rounded-lg font-bold">
                                  {block.value}
                                </button>
                              )}
                              {block.type === 'form' && (
                                <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  <input type="text" placeholder="Seu nome" className="w-full px-3 py-2 border rounded text-sm bg-white" disabled />
                                  <input type="email" placeholder="Seu e-mail" className="w-full px-3 py-2 border rounded text-sm bg-white" disabled />
                                  <input type="tel" placeholder="WhatsApp (Opcional)" className="w-full px-3 py-2 border rounded text-sm bg-white" disabled />
                                  <button className="w-full bg-red-600 text-white py-2 rounded font-medium text-sm flex items-center justify-center gap-2" disabled>
                                     {block.value || 'Enviar'}
                                     <ArrowRight size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Close button fake */}
                      <div className="absolute top-2 right-2 text-gray-400">
                        <X size={20} />
                      </div>
                    </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">Visualização aproximada</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionManager;
