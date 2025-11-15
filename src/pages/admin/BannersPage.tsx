import React, { useState } from 'react';
import { useBanners, Banner } from '../../hooks/useBanners';
import BannerManager from '../../components/admin/BannerManager';
import { BannerModal } from '../../components/admin';

const BannersPage: React.FC = () => {
  const { 
    banners, 
    error: bannerError,
    fetchBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    uploadBannerImage
  } = useBanners();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    image_url: '',
    link_url: '',
    active: true,
    sort_order: 1
  });
  const [formLoading, setFormLoading] = useState(false);
  const [imageMethod, setImageMethod] = useState<'url' | 'upload'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Funções para upload de imagem
  const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return { isValid: false, error: 'Tipo de arquivo inválido. Use: JPG, PNG, GIF, SVG ou WebP.' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'Arquivo muito grande. Máximo: 5MB.' };
    }

    return { isValid: true };
  };

  const handleFileSelect = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const uploadedUrl = await uploadBannerImage(file);
      
      if (!uploadedUrl) {
        // Se falhar, sugerir usar URL direta
        alert('Erro ao fazer upload da imagem. Por favor, use a opção de URL direta ou verifique as permissões do Supabase.');
      }
      
      return uploadedUrl;
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      alert('Erro ao fazer upload da imagem. Por favor, use a opção de URL direta.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const openBannerModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title || '',
        image_url: banner.image_url || '',
        link_url: banner.link_url || '',
        active: banner.active ?? true,
        sort_order: banner.sort_order ?? 1
      });
      // Se já tem imagem URL, manter o método URL
      setImageMethod(banner.image_url ? 'url' : 'url');
    } else {
      setEditingBanner(null);
      setBannerForm({
        title: '',
        image_url: '',
        link_url: '',
        active: true,
        sort_order: banners.length + 1
      });
      setImageMethod('url');
    }
    setSelectedFile(null);
    setShowBannerModal(true);
  };

  const saveBanner = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    try {
      setFormLoading(true);
      
      // Validações básicas
      if (!bannerForm.title?.trim()) {
        alert('Por favor, insira um título para o banner.');
        return;
      }
      
      // Se estiver usando upload de arquivo, fazer upload primeiro
      let finalImageUrl = bannerForm.image_url;
      if (imageMethod === 'upload' && selectedFile) {
        const uploadedUrl = await handleImageUpload(selectedFile);
        if (!uploadedUrl) {
          return; // Erro já foi tratado na função de upload
        }
        finalImageUrl = uploadedUrl;
      }
      
      if (!finalImageUrl?.trim()) {
        alert('Por favor, forneça uma imagem para o banner (URL ou upload).');
        return;
      }

      const bannerData = {
        title: bannerForm.title.trim(),
        image_url: finalImageUrl.trim(),
        link_url: bannerForm.link_url?.trim() || undefined,
        active: bannerForm.active ?? true,
        sort_order: bannerForm.sort_order ?? 1
      };
      
      let result;
      if (editingBanner) {
        result = await updateBanner(editingBanner.id!, bannerData);
      } else {
        result = await createBanner(bannerData);
      }

      if (result) {
        setShowBannerModal(false);
        await fetchBanners();
      } else {
        alert('Erro ao salvar banner. Verifique os dados e tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao salvar banner:', err);
      alert('Erro ao salvar banner. Por favor, tente novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;

    try {
      await deleteBanner(id);
    } catch (err) {
      console.error('Erro ao excluir banner:', err);
    }
  };

  const handleToggleBannerStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleBannerStatus(id, !currentStatus);
    } catch (err) {
      console.error('Erro ao atualizar status do banner:', err);
    }
  };

  const handleBannerFormChange = (field: string, value: any) => {
    setBannerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = (totalPages: number) => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <>
      <BannerManager
        banners={banners}
        loading={false}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onNewBanner={() => openBannerModal()}
        onEditBanner={openBannerModal}
        onDeleteBanner={handleDeleteBanner}
        onToggleStatus={handleToggleBannerStatus}
        onPageChange={goToPage}
        onPreviousPage={goToPreviousPage}
        onNextPage={goToNextPage}
        getTotalPages={getTotalPages}
      />

      {showBannerModal && (
        <BannerModal
          isOpen={showBannerModal}
          onClose={() => setShowBannerModal(false)}
          editingBanner={editingBanner}
          bannerForm={bannerForm}
          bannerError={bannerError}
          formLoading={formLoading}
          imageMethod={imageMethod}
          selectedFile={selectedFile}
          uploadingImage={uploadingImage}
          onSubmit={saveBanner}
          onFormChange={handleBannerFormChange}
          onImageMethodChange={setImageMethod}
          onFileSelect={handleFileSelect}
        />
      )}
    </>
  );
};

export default BannersPage;