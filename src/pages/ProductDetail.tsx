import React, { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { MessageCircle, ArrowLeft, ChevronLeft, ChevronRight, Star, Shield, Truck, Award, Clock, X, ZoomIn } from 'lucide-react'
import { useProductBySlug } from '../hooks/useProducts'
import WhatsAppButton from '../components/WhatsAppButton'

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading: loading, error } = useProductBySlug(slug || '')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  
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

  const images = product.images?.sort((a, b) => a.sort_order - b.sort_order) || []
  const currentImage = images[currentImageIndex]

  const whatsappMessage = `Olá! Tenho interesse no produto: ${product.product_name}. Gostaria de mais informações sobre especificações, preço e disponibilidade.`

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8 bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm border border-gray-200/50">
          <Link to="/" className="hover:text-[#8B0000] transition-colors duration-200 font-medium">Início</Link>
          <span className="text-gray-400">/</span>
          <Link to="/categorias" className="hover:text-[#8B0000] transition-colors duration-200 font-medium">Categoria</Link>
          {/* Removed parent_category reference as it doesn't exist in Category interface */}
          {product.categories && typeof product.categories === 'object' && (
            <>
              <span className="text-gray-400">/</span>
              <Link 
                to={`/categorias/${product.categories.slug}`} 
                className="hover:text-[#8B0000] transition-colors duration-200 font-medium"
              >
                {product.categories.name}
              </Link>
            </>
          )}
          <span className="text-gray-400">/</span>
          <span className="text-[#333333] font-semibold truncate max-w-xs">{product.product_name}</span>
        </nav>

        {/* Back Button */}
        <Link
          to="/categorias"
          className="inline-flex items-center space-x-2 text-[#000080] hover:text-[#000060] mb-8 transition-all duration-200 bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-gray-200/50 hover:shadow-md hover:bg-white/90"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Voltar as Categorias</span>
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="xl:col-span-2 space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden group">
              {currentImage ? (
                <>
                  <div className="relative cursor-pointer aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] lg:aspect-[3/2]" onClick={() => openModal(currentImageIndex)}>
                    <img
                      src={currentImage.image_url}
                      alt={('alt_text' in currentImage ? currentImage.alt_text?.toString() : '') || product.product_name}
                      className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                        <ZoomIn className="h-6 w-6 text-gray-800" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg border border-gray-200/50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg border border-gray-200/50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-gray-200/50">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] lg:aspect-[3/2] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="h-8 w-8 text-gray-400" />
                    </div>
                    <span className="text-gray-500 font-medium">Sem imagem disponível</span>
                  </div>
                </div>
              )}
            </div>

            {/* Carousel with Dots and Thumbnails */}
            {images.length > 1 && (
              <div className="space-y-4">
                {/* Dots Indicator */}
                <div className="flex justify-center space-x-2">
                  {images.map((_, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentImageIndex
                          ? 'bg-[#8B0000] scale-125 shadow-lg'
                          : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {images.map((image, index: number) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative h-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 group ${
                        index === currentImageIndex
                          ? 'border-[#8B0000] ring-2 ring-[#8B0000] ring-opacity-30 shadow-lg'
                          : 'border-gray-200 hover:border-[#8B0000]/50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text || `${product.product_name} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {index === currentImageIndex && (
                        <div className="absolute inset-0 bg-[#8B0000]/10 flex items-center justify-center">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#8B0000] rounded-full animate-pulse"></div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
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
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {product.categories && typeof product.categories === 'object' && (
                  <span className="bg-gradient-to-r from-[#000080] to-[#000060] text-white text-sm px-4 py-2 rounded-full font-medium shadow-md">
                    {product.categories.name}
                  </span>
                )}
                {product.featured && (
                  <span className="bg-gradient-to-r from-[#8B0000] to-[#660000] text-white text-sm px-4 py-2 rounded-full flex items-center space-x-2 font-medium shadow-md">
                    <Star className="h-4 w-4 fill-current" />
                    <span>Produto em Destaque</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-[#333333] mb-3 leading-tight">
                {product.product_name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4 text-[#8B0000]" />
                  <span>Equipamento Profissional</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-[#000080]" />
                  <span>Garantia Inclusa</span>
                </div>
              </div>
            </div>



            {/* Benefits */}
            {product.benefits && product.benefits.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
                <h3 className="text-xl font-bold text-[#333333] mb-4 flex items-center space-x-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-[#8B0000] to-[#000080] rounded-full"></div>
                  <span>Principais Benefícios</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Array.isArray(product.benefits) ? product.benefits : []).map((benefit: {title: string, description: string}, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-[#8B0000] rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1">{benefit.title}</h4>
                        <p className="text-gray-600 text-sm">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="hidden relative bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/40 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] overflow-hidden">
              <h3 className="text-xl md:text-2xl font-bold text-[#333333] mb-6 md:mb-8 flex items-center space-x-3">
                <div className="w-2 h-6 md:h-8 bg-gradient-to-b from-[#8B0000] via-[#B22222] to-[#000080] rounded-full shadow-lg flex-shrink-0"></div>
                <span className="bg-gradient-to-r from-[#333333] to-[#555555] bg-clip-text text-transparent">Diferenciais do Produto</span>
                <div className="flex-1 h-px bg-gradient-to-r from-[#8B0000]/30 to-transparent"></div>
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Card 1 - Garantia */}
                <div className="group relative text-center p-6 md:p-8 bg-gradient-to-br from-red-50/95 via-red-100/90 to-red-200/85 rounded-2xl shadow-lg border border-red-300/50 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400/5 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8B0000] to-[#DC143C] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#8B0000] via-[#B22222] to-[#DC143C] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <h4 className="font-bold text-base md:text-lg text-[#8B0000] mb-2 group-hover:text-[#B22222] transition-colors duration-300">Garantia Assegurada</h4>
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
                className="w-full bg-gradient-to-r from-[#25D366] to-[#20B858] text-white py-4 px-6 rounded-xl font-bold hover:from-[#20B858] hover:to-[#1DA851] transition-all duration-300 flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl hover:scale-105 transform"
                message={whatsappMessage}
              >
                
                <span>Solicitar Orçamento</span>
              </WhatsAppButton>
              
              <div className="grid grid-cols-1 gap-4">
                {product.categories && typeof product.categories === 'object' && product.categories.slug ? (
                  <Link
                    to={`/categorias/${product.categories.slug}`}
                    className="border-2 border-[#8B0000] text-[#8B0000] py-3 px-4 rounded-xl font-bold hover:bg-[#8B0000] hover:text-white transition-all duration-300 text-center shadow-md hover:shadow-lg hover:scale-105 transform flex items-center justify-center space-x-2"
                  >
                    <Star className="h-4 w-4" />
                    <span>Ver Similares</span>
                  </Link>
                ) : (
                  <div className="border-2 border-gray-300 text-gray-400 py-3 px-4 rounded-xl font-bold text-center cursor-not-allowed flex items-center justify-center space-x-2">
                    <Star className="h-4 w-4" />
                    <span>Categoria não disponível</span>
                  </div>
                )}
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
              <div 
                className="text-gray-700 leading-relaxed text-base prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
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

        {/* Image Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={closeModal}>
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
                  alt={(images[modalImageIndex] as { alt_text?: string })?.alt_text || product.product_name}
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
                        alt={image.alt_text || `${product.product_name} - Imagem ${index + 1}`}
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