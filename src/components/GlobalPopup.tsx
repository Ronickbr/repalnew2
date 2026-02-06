import React, { useState } from 'react';
import { X, Mail, User, ArrowRight, Tag } from 'lucide-react';
import { usePopup } from '../contexts/PopupContext';
import { useNavigate } from 'react-router-dom';
import { useCreateLead } from '../hooks/useLeads';

const GlobalPopup: React.FC = () => {
  const { activePopup, hidePopup } = usePopup();
  const navigate = useNavigate();
  const createLead = useCreateLead();

  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  interface ContentBlock {
    type: string;
    value: string;
    action?: string;
  }

  if (!activePopup) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      hidePopup();
    }
  };

  const handleLeadSubmitLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createLead.mutateAsync({
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone,
        message: 'Lead capturado via Pop-up',
        source: 'popup_lead_capture'
      });
      hidePopup();
      localStorage.setItem('popup_lead_submitted', 'true');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[2050] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-scale-in">
        
        {/* Standard Close Button */}
        {!(activePopup.type === 'promo' && activePopup.image) && (
          <button 
            onClick={hidePopup} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X size={24} />
          </button>
        )}

        <div className={activePopup.type === 'promo' && activePopup.image ? "p-0" : "p-6 sm:p-8"}>
          
          {/* INFO POPUP */}
          {activePopup.type === 'info' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{activePopup.title}</h2>
              <p className="text-gray-600 mb-6">{activePopup.message}</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={hidePopup}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
                {activePopup.link && (
                  <button 
                    onClick={() => { navigate(activePopup.link!); hidePopup(); }}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Cadastre-se Agora
                  </button>
                )}
              </div>
            </div>
          )}

          {/* LEAD CAPTURE POPUP */}
          {activePopup.type === 'lead' && (
            <div>
               <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">{activePopup.title || 'Receba Novidades'}</h2>
                 <p className="text-gray-600">{activePopup.message || 'Cadastre-se para receber ofertas exclusivas.'}</p>
               </div>
               
               <form onSubmit={handleLeadSubmitLocal} className="space-y-4">
                 <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                   <input 
                     type="text" 
                     placeholder="Seu nome"
                     required
                     value={leadForm.name}
                     onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                   />
                 </div>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                   <input 
                     type="email" 
                     placeholder="Seu melhor e-mail"
                     required
                     value={leadForm.email}
                     onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                   />
                 </div>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📞</span>
                   <input 
                     type="tel" 
                     placeholder="WhatsApp (Opcional)"
                     value={leadForm.phone}
                     onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                   />
                 </div>

                 <button 
                   type="submit" 
                   disabled={isSubmitting}
                   className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                 >
                   {isSubmitting ? 'Enviando...' : 'Quero Receber Ofertas'}
                   {!isSubmitting && <ArrowRight size={18} />}
                 </button>
               </form>
               <p className="text-xs text-gray-400 text-center mt-4">
                 Não enviamos spam. Seus dados estão seguros.
               </p>
            </div>
          )}

          {/* PROMO POPUP */}
          {activePopup.type === 'promo' && (
            <>
              {activePopup.data?.content_layout && activePopup.data.content_layout.length > 0 ? (
                /* DYNAMIC LAYOUT */
                <div className="relative">
                   {activePopup.image && (
                      <div className="w-full h-48 bg-cover bg-center" style={{ backgroundImage: `url(${activePopup.image})` }}>
                        <button 
                          onClick={hidePopup} 
                          className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                   )}
                   
                   <div className="p-6 sm:p-8">
                      {!activePopup.image && (
                        <div className="relative w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Tag className="w-8 h-8 text-red-600" />
                        </div>
                      )}
                      
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{activePopup.title}</h2>
                      {activePopup.message && <p className="text-gray-600 mb-6 text-center">{activePopup.message}</p>}

                      <div className="space-y-4">
                        {activePopup.data.content_layout.map((block: ContentBlock, idx: number) => (
                          <div key={idx}>
                            {block.type === 'text' && (
                              <p className="text-gray-700 text-center whitespace-pre-wrap">{block.value}</p>
                            )}
                            
                            {block.type === 'image' && block.value && (
                              <img src={block.value} alt="Content" className="w-full h-auto rounded-lg shadow-sm" />
                            )}

                            {block.type === 'button' && (
                              <button 
                                onClick={() => {
                                  if (block.action === 'link' && activePopup.link) {
                                     navigate(activePopup.link);
                                  } 
                                  hidePopup();
                                }}
                                className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm"
                              >
                                {block.value}
                              </button>
                            )}

                            {block.type === 'form' && (
                              <form onSubmit={handleLeadSubmitLocal} className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <input 
                                  type="text" 
                                  placeholder="Seu nome"
                                  required
                                  value={leadForm.name}
                                  onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                />
                                <input 
                                  type="email" 
                                  placeholder="Seu e-mail"
                                  required
                                  value={leadForm.email}
                                  onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                />
                                <input 
                                   type="tel" 
                                   placeholder="WhatsApp (Opcional)"
                                   value={leadForm.phone}
                                   onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                 />
                                <button 
                                  type="submit" 
                                  disabled={isSubmitting}
                                  className="w-full bg-red-900 text-white py-3 rounded-lg font-bold hover:bg-red-800 transition-colors flex items-center justify-center gap-2"
                                >
                                  {isSubmitting ? 'Enviando...' : (block.value || 'Enviar')}
                                  {!isSubmitting && <ArrowRight size={18} />}
                                </button>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              ) : (
                /* STATIC LEGACY LAYOUT */
                <div className={`text-center ${activePopup.image ? 'relative h-full min-h-[450px] flex flex-col justify-end' : ''}`}>
                   {activePopup.image && (
                     <div className="absolute inset-0 z-0">
                       <img src={activePopup.image} alt="Background" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                       
                       {/* Close Button for Image Background */}
                       <button 
                          onClick={hidePopup} 
                          className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white/80 hover:text-white p-2 rounded-full transition-colors z-20 backdrop-blur-sm"
                        >
                          <X size={20} />
                        </button>
                     </div>
                   )}

                  <div className={`relative z-10 ${activePopup.image ? 'p-8 text-white' : ''}`}>
                    {!activePopup.image && (
                       <div className="relative w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                         <Tag className="w-8 h-8 text-red-600" />
                         {activePopup.data?.discount_percentage && (
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                              -{activePopup.data.discount_percentage}%
                            </div>
                         )}
                       </div>
                    )}
                    
                    {activePopup.image && activePopup.data?.discount_percentage && (
                       <div className="inline-block bg-red-600 text-white font-bold px-4 py-1.5 rounded-full shadow-lg mb-4 transform -rotate-2">
                          {activePopup.data.discount_percentage}% OFF
                       </div>
                    )}

                    <h2 className={`text-2xl font-bold mb-2 mt-2 ${activePopup.image ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>{activePopup.title}</h2>
                    <p className={`mb-6 ${activePopup.image ? 'text-gray-200 drop-shadow-sm' : 'text-gray-600'}`}>{activePopup.message}</p>
                    
                    <button 
                      onClick={() => { if(activePopup.link) navigate(activePopup.link); hidePopup(); }}
                      className={`w-full py-3 rounded-lg font-bold transition-colors animate-pulse shadow-lg ${
                        activePopup.image 
                          ? 'bg-white text-red-600 hover:bg-gray-100' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      Aproveitar Oferta
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default GlobalPopup;
