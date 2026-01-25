import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link, Navigate } from 'react-router-dom'
import { MessageCircle, ArrowLeft, ChevronLeft, ChevronRight, Star, Shield, Truck, Award, Clock, X, ZoomIn, Plus, Check } from 'lucide-react'
import { useProductBySlug, useSimilarProducts } from '../hooks/useProducts'
import WhatsAppButton from '../components/WhatsAppButton'
import { useBudget } from '../contexts/BudgetContext'
import { useAuth } from '../hooks/useAuth'
import ProductCard from '../components/ProductCard'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { sanitizeMetaDescription, sanitizeMetaTitle, normalizeKeywords } from '../lib/seo'
import { logActivity } from '../lib/supabase'
import { SafeHTML } from '../components/SafeHTML'


const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading: loading, error } = useProductBySlug(slug || '')
  const { canonicalBaseUrl } = useSiteSettings()
  const { data: similarProducts, isLoading: loadingSimilar } = useSimilarProducts(product?.id || '', product?.subcategory?.id, 4)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const { state: budgetState, addItem } = useBudget()
  const { isAuthenticated } = useAuth()
  const [isAddedToBudget, setIsAddedToBudget] = useState(false)
  
  // Close modal on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isModalOpen])

  // Cleanup body overflow when component unmounts
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Verificar se o produto já está na lista de orçamento
  React.useEffect(() => {
    if (product) {
      const isInBudget = budgetState.items.some(item => item.id === product.id)
      setIsAddedToBudget(isInBudget)
    }
  }, [product, budgetState.items])

  React.useEffect(() => {
    if (!product) return;
    const details = {
      product_id: product.id,
      product_name: product.name,
      slug: product.slug,
    };
    logActivity({
      action: 'product_view',
      resource_type: 'product',
      resource_id: String(product.id),
      details: JSON.stringify(details),
      user_agent: navigator.userAgent,
      status: 'success',
    })
  }, [product])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-80 mb-8"></div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <div className="h-[500px] bg-gray-200 rounded-2xl mb-4"></div>
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded-xl"></div>
                <div className="h-48 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return <Navigate to="/categorias" replace />
  }

  const productImages = product.product_images?.sort((a, b) => a.sort_order - b.sort_order) || []
  const mainImageUrl = (product as { image?: string }).image || product.image_url
  
  const images = [...productImages]
  
  // Adiciona a imagem principal se ela existir e não estiver na lista de imagens adicionais
  if (mainImageUrl && !images.some(img => img.image_url === mainImageUrl)) {
    images.unshift({
      id: `main-${product.id}`,
      image_url: mainImageUrl,
      alt_text: product.name,
      sort_order: -1
    })
  }

  const currentImage = images[currentImageIndex]

  const whatsappMessage = `Olá! Tenho interesse no produto: ${product.name}. Gostaria de mais informações sobre especificações, preço e disponibilidade.`

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const openModal = (index: number) => {
    setModalImageIndex(index)
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    document.body.style.overflow = 'unset'
  }

  const nextModalImage = () => {
    setModalImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevModalImage = () => {
    setModalImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const addToBudget = () => {
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        image: images[0]?.image_url || product.image_url
      })
      setIsAddedToBudget(true)
    }
  }

  const metaTitle = (product?.seo_title && sanitizeMetaTitle(product.seo_title)) || product?.name || 'Produto'
  const metaDescription = sanitizeMetaDescription(product?.seo_description || product?.description || '')
  const metaKeywords = normalizeKeywords(product?.seo_keywords || (product?.tags || []).join(', '))
  const origin = (canonicalBaseUrl || '').trim().replace(/\/+$/, '')
  const canonicalHref = origin ? `${origin}/produto/${product.slug}` : undefined
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: sanitizeMetaDescription(product.description || ''),
    sku: product.sku_code || undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    image: images.map(img => img.image_url).filter(Boolean),
    category: product.category && typeof product.category === 'object' ? product.category.name : undefined,
    url: canonicalHref,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={metaKeywords} />
        {canonicalHref && <link rel="canonical" href={canonicalHref} />}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="product" />
        <script type="application/ld+json">
          {JSON.stringify(productJsonLd)}
        </script>
      </Helmet>
      {/* Hidden SEO Tags */}
      {product?.tags && product.tags.length > 0 && (
        <div className="hidden" aria-hidden="true">
          {product.tags.map((tag, index) => (
            <span key={index} itemProp="keywords">{tag}</span>
          ))}
        </div>
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8 bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm border border-gray-200/50">
          <Link to="/" className="hover:text-[#8B0000] transition-colors duration-200 font-medium">Início</Link>
          {/* Removed parent_category reference as it doesn't exist in Category interface */}
          {product.category && typeof product.category === 'object' && (
            <>
              <span className="text-gray-400">/</span>
              <Link 
                to={`/categorias/${product.category.slug}`} 
                className="hover:text-[#8B0000] transition-colors duration-200 font-medium"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span className="text-gray-400">/</span>
          <span className="text-[#333333] font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Back Button */}
        <Link
          to={product.category?.slug ? `/categorias/${product.category.slug}` : "/categorias"}
          className="inline-flex items-center space-x-2 text-[#000080] hover:text-[#000060] mb-8 transition-all duration-200 bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-gray-200/50 hover:shadow-md hover:bg-white/90"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">
            Voltar para {product.category && typeof product.category === 'object' ? product.category.name : 'Categorias'}
          </span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Image Gallery */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden group">
              {currentImage ? (
                <>
                  <div className="relative aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] lg:aspect-[3/2] max-h-[400px] sm:max-h-[500px]">
                    <img
                      src={currentImage.image_url}
                      alt={('alt_text' in currentImage ? currentImage.alt_text?.toString() : '') || product.name}
                      className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105 max-h-[400px] sm:max-h-[500px] cursor-pointer"
                      onClick={() => openModal(currentImageIndex)}
                    />
                    <div 
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center cursor-pointer"
                      onClick={() => openModal(currentImageIndex)}
                    >
                      <div className="bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                        <ZoomIn className="h-4 w-4 sm:h-6 sm:w-6 text-gray-800" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-2 sm:p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg border border-gray-200/50"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-2 sm:p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg border border-gray-200/50"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-white/90 backdrop-blur-sm text-gray-800 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg border border-gray-200/50">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] lg:aspect-[3/2] max-h-[400px] sm:max-h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <Star className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                    <span className="text-gray-500 font-medium text-sm sm:text-base">Sem imagem disponível</span>
                  </div>
                </div>
              )}
            </div>

            {/* Carousel with Dots and Thumbnails */}
            {images.length > 1 && (
              <div className="space-y-3 sm:space-y-4">
                {/* Dots Indicator */}
                <div className="flex justify-center space-x-1 sm:space-x-2">
                  {images.map((_, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                        index === currentImageIndex
                          ? 'bg-primary scale-125 shadow-lg'
                          : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                  {images.map((image, index: number) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative h-16 sm:h-20 lg:h-24 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 group flex items-center justify-center ${
                        index === currentImageIndex
                          ? 'border-primary ring-2 ring-primary ring-opacity-30 shadow-lg'
                          : 'border-gray-200 hover:border-primary/50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text || `${product.name} - Imagem ${index + 1}`}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 max-h-16 sm:max-h-20 lg:max-h-24"
                      />
                      {index === currentImageIndex && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse"></div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50">
              <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                {product.category && typeof product.category === 'object' && (
                  <span className="bg-gradient-to-r from-[#000080] to-[#000060] text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full font-medium shadow-md">
                    {product.category.name}
                  </span>
                )}
                {product.featured && (
                  <span className="bg-gradient-to-r from-primary to-[#660000] text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full flex items-center space-x-1 sm:space-x-2 font-medium shadow-md">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                    <span>Produto em Destaque</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-3 sm:mb-4 leading-tight">
                {product.name}

              {isAuthenticated && product.price !== undefined && (
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-3 sm:mb-4">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                </div>
              )}

              </h1>
              <h2 className="sr-only">Descrição do Produto</h2>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Award className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span>Equipamento Profissional</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-[#000080]" />
                  <span>Garantia Inclusa</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="hidden relative bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/40 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] overflow-hidden">
              <h2 className="text-xl md:text-2xl font-bold text-[#333333] mb-6 md:mb-8 flex items-center space-x-3">
                <div className="w-2 h-6 md:h-8 bg-gradient-to-b from-primary via-[#B22222] to-[#000080] rounded-full shadow-lg flex-shrink-0"></div>
                <span className="bg-gradient-to-r from-[#333333] to-[#555555] bg-clip-text text-transparent">Diferenciais do Produto</span>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent"></div>
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Card 1 - Garantia */}
                <div className="group relative text-center p-6 md:p-8 bg-gradient-to-br from-red-50/95 via-red-100/90 to-red-200/85 rounded-2xl shadow-lg border border-red-300/50 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400/5 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-[#DC143C] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary via-[#B22222] to-[#DC143C] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <h4 className="font-bold text-base md:text-lg text-primary mb-2 group-hover:text-[#B22222] transition-colors duration-300">Garantia Assegurada</h4>
                    <p className="text-xs md:text-sm text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">Produto com garantia completa do fabricante e suporte técnico especializado</p>
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-tl from-red-200/30 to-transparent rounded-tl-full"></div>
                </div>

                {/* Card 2 - Entrega */}
                <div className="group relative text-center p-6 md:p-8 bg-gradient-to-br from-emerald-50/95 via-green-100/90 to-green-200/85 rounded-2xl shadow-lg border border-green-300/50 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#25D366] to-[#32CD32] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#25D366] via-[#32CD32] to-[#20B858] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Truck className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <h4 className="font-bold text-base md:text-lg text-[#25D366] mb-2 group-hover:text-[#20B858] transition-colors duration-300">Entrega Nacional</h4>
                    <p className="text-xs md:text-sm text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">Enviamos para todo o território brasileiro com logística especializada</p>
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-tl from-green-200/30 to-transparent rounded-tl-full"></div>
                </div>

                {/* Card 3 - Qualidade */}
                <div className="group relative text-center p-6 md:p-8 bg-gradient-to-br from-blue-50/95 via-blue-100/90 to-indigo-200/85 rounded-2xl shadow-lg border border-blue-300/50 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden lg:col-span-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#000080] to-[#4169E1] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#000080] via-[#4169E1] to-[#1E90FF] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Award className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <h4 className="font-bold text-base md:text-lg text-[#000080] mb-2 group-hover:text-[#4169E1] transition-colors duration-300">Alta Qualidade</h4>
                    <p className="text-xs md:text-sm text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">Equipamento de nível profissional com certificações internacionais</p>
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-tl from-blue-200/30 to-transparent rounded-tl-full"></div>
                </div>
              </div>
              
              {/* Decorative elements - positioned safely */}
              <div className="absolute -top-2 -right-2 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#8B0000]/3 to-[#000080]/3 rounded-full blur-xl pointer-events-none"></div>
              <div className="absolute -bottom-2 -left-2 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-tr from-[#25D366]/3 to-[#000080]/3 rounded-full blur-lg pointer-events-none"></div>
            </div>

            {/* CTA Buttons */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 space-y-4">
              <h3 className="text-xl font-bold text-[#333333] mb-4 flex items-center space-x-2">
                <div className="w-1 h-6 bg-gradient-to-b from-[#25D366] to-[#20B858] rounded-full"></div>
                <span>Entre em Contato</span>
              </h3>
              
              <WhatsAppButton
                className="w-full bg-gradient-to-r from-green-700 to-green-600 text-white py-4 px-6 rounded-xl font-bold hover:from-green-800 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl hover:scale-105 transform"
                message={whatsappMessage}
              >
                
                <span>Solicitar Orçamento</span>
              </WhatsAppButton>
              
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={addToBudget}
                  disabled={isAddedToBudget}
                  className={`py-3 px-4 rounded-xl font-bold transition-all duration-300 text-center shadow-md hover:shadow-lg hover:scale-105 transform flex items-center justify-center space-x-2 ${
                    isAddedToBudget
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : 'border-2 border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white'
                  }`}
                >
                  {isAddedToBudget ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Adicionado à Lista</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Incluir na Lista</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-[#8B0000]" />
                    <span>Resposta rápida</span>
                  </div>
                  <div className="w-1 h-4 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4 text-[#000080]" />
                    <span>Atendimento especializado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description - Full Width Section */}
        {product?.description && (
          <div className="xl:col-span-3 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-bold text-[#333333] mb-4 flex items-center space-x-2">
                <div className="w-1 h-6 bg-gradient-to-b from-[#8B0000] to-[#000080] rounded-full"></div>
                <span>Descrição do Produto</span>
              </h3>
              <SafeHTML 
                className="text-gray-700 leading-relaxed text-base prose prose-gray max-w-none"
                html={product.description}
              />
            </div>
          </div>
        )}

        {/* Technical Specifications - Full Width Section */}
        {product?.specifications && (
          <div className="xl:col-span-3 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-bold text-[#333333] mb-4 flex items-center space-x-2">
                <div className="w-1 h-6 bg-gradient-to-b from-[#000080] to-[#8B0000] rounded-full"></div>
                <span>Especificações Técnicas</span>
              </h3>
              <SafeHTML 
                className="text-gray-700 leading-relaxed text-base prose prose-gray max-w-none"
                html={product.specifications}
              />
            </div>
          </div>
        )}

        {/* Stats Section */}
        <section className="py-12 bg-white border-t">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Frete Rápido e Seguro */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#8B0000'}}>
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900 leading-tight">Frete Rápido e Seguro</div>
                  <div className="text-sm text-gray-600 font-medium leading-tight">Chega até você sem demora.</div>
                </div>
              </div>

              {/* Padrão Profissional */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#8B0000'}}>
                    <Award className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900 leading-tight">Padrão Profissional</div>
                  <div className="text-sm text-gray-600 font-medium leading-tight">Tecnologia de nível industrial.</div>
                </div>
              </div>

              {/* Proteção Total */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#8B0000'}}>
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900 leading-tight">Proteção Total</div>
                  <div className="text-sm text-gray-600 font-medium leading-tight">Embalagens resistentes contra danos.</div>
                </div>
              </div>

              {/* Atendimento 24/7 */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#8B0000'}}>
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-900 leading-tight">Atendimento 24/7</div>
                  <div className="text-sm text-gray-600 font-medium leading-tight">Suporte para qualquer situação.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Similar Products Section - Before Footer */}
        {similarProducts && similarProducts.length > 0 && (
          <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100 border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[#333333] mb-4">
                  Produtos Relacionados
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Confira outros produtos da mesma categoria que podem te interessar
                </p>
              </div>
              
              {loadingSimilar ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-lg p-4 animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {similarProducts.map((similarProduct) => (
                    <ProductCard
                      key={similarProduct.id}
                      product={similarProduct}
                      viewMode="grid"
                    />
                  ))}
                </div>
              )}
              
              <div className="text-center mt-12">
                <Link
                  to={`/categorias/${product.category?.slug}`}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#8B0000] to-[#B22222] text-white px-8 py-3 rounded-xl font-semibold hover:from-[#B22222] hover:to-[#DC143C] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  <span>Ver todos os produtos da categoria</span>
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Image Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={closeModal}>
            <div className="relative max-w-7xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
              >
                <X className="h-6 w-6" />
              </button>
              
              {/* Modal Image */}
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={images[modalImageIndex]?.image_url}
                  alt={(images[modalImageIndex] as { alt_text?: string })?.alt_text || product.name}
                  className="w-full max-h-[80vh] object-contain"
                />
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevModalImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-4 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextModalImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-4 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm text-gray-800 px-6 py-3 rounded-full text-lg font-medium shadow-lg">
                    {modalImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
              
              {/* Modal Thumbnails */}
              {images.length > 1 && (
                <div className="mt-4 flex justify-center space-x-2 overflow-x-auto pb-2">
                  {images.map((image, index: number) => (
                    <button
                      key={image.id}
                      onClick={() => setModalImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                        index === modalImageIndex
                          ? 'border-[#8B0000] ring-2 ring-[#8B0000] ring-opacity-50 shadow-lg'
                          : 'border-white/50 hover:border-white shadow-md'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text || `${product.name} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail
