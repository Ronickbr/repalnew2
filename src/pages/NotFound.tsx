import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const NotFound: React.FC = () => {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-gray-50">
      <Helmet>
        <title>Página não encontrada | Repal</title>
        <meta name="description" content="A página que você tentou acessar não existe. Volte para a página inicial e continue navegando pelo catálogo da Repal." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-xl w-full text-center">
        <div className="text-7xl font-bold text-red-900">404</div>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Ops! Página não encontrada</h1>
        <p className="mt-2 text-gray-600">A URL pode estar incorreta ou o conteúdo foi movido.</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/" className="inline-flex items-center rounded-md bg-red-900 px-5 py-3 text-white hover:bg-red-800 transition-colors">
            Voltar para a página inicial
          </Link>
          <Link to="/categorias" className="inline-flex items-center rounded-md border border-gray-300 px-5 py-3 text-gray-800 hover:bg-gray-100 transition-colors">
            Ver categorias
          </Link>
        </div>
      </div>
    </main>
  )
}

export default NotFound

