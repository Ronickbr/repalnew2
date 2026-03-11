import React, { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useCreateLead } from '../hooks/useLeads'

interface ContactFormProps {
  productName?: string
  className?: string
  title?: string
}

const ContactForm: React.FC<ContactFormProps> = ({ 
  productName, 
  className = '',
  title = 'Entre em Contato'
}) => {
  const [formData, setFormData] = useState({
    client_name: '',
    phone: '',
    email: '',
    message: '',
  })

  const createLead = useCreateLead()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.client_name.trim() || !formData.phone.trim()) {
      return
    }

    try {
      await createLead.mutateAsync({
        name: formData.client_name,
        phone: formData.phone,
        email: formData.email,
        message: formData.message,
        product_name: productName,
      })
      
      // Reset form
      setFormData({
        client_name: '',
        phone: '',
        email: '',
        message: '',
      })
    } catch {
      // Erro já tratado pelo toast
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-[#333333] mb-4">{title}</h3>
      
      {productName && (
        <div className="bg-[#000080] bg-opacity-10 border border-[#000080] rounded-lg p-3 mb-4">
          <p className="text-sm text-[#000080] font-medium">
            Produto de interesse: <span className="font-semibold">{productName}</span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="client_name" className="block text-sm font-medium text-[#333333] mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            id="client_name"
            name="client_name"
            value={formData.client_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000080] focus:border-transparent transition-colors duration-200"
            placeholder="Seu nome completo"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[#333333] mb-1">
            Telefone/WhatsApp *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000080] focus:border-transparent transition-colors duration-200"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#333333] mb-1">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000080] focus:border-transparent transition-colors duration-200"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-[#333333] mb-1">
            Mensagem
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000080] focus:border-transparent transition-colors duration-200 resize-none"
            placeholder="Conte-nos mais sobre suas necessidades..."
          />
        </div>

        <button
          type="submit"
          disabled={createLead.isPending || !formData.client_name.trim() || !formData.phone.trim()}
          className="w-full bg-[#8B0000] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#6B0000] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {createLead.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Enviar Mensagem</span>
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Ao enviar este formulário, você concorda em ser contatado pela nossa equipe.
      </p>
    </div>
  )
}

export default ContactForm