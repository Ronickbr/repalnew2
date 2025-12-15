import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'
import './index.css'
import './styles/responsive.css'
import App from './App.tsx'
import { supabase } from './lib/supabase'

function addScriptToHead(element: HTMLScriptElement) {
  document.head.appendChild(element)
}

function createExternalScript(src: string, id: string) {
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.src = src
  s.async = true
  s.id = id
  addScriptToHead(s)
}

function createInlineScript(content: string, id: string) {
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id = id
  s.text = content
  addScriptToHead(s)
}

function addNoScriptToBody(content: string, id: string) {
  if (document.getElementById(id)) return
  const n = document.createElement('noscript')
  n.id = id
  n.innerHTML = content
  document.body.appendChild(n)
}

async function loadIntegrations() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('integrations')
      .maybeSingle()
    if (error) return
    const cfg = (data && (data as { integrations?: Record<string, string> }).integrations) || {}

    const gtmId = String(cfg.google_tag_manager_id || '').trim()
    const pixelId = String(cfg.facebook_pixel_id || '').trim()

    

    if (gtmId) {
      createInlineScript(
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
        'gtm-init'
      )
    }

    if (pixelId) {
      createExternalScript('https://connect.facebook.net/en_US/fbevents.js', 'fb-pixel-loader')
      createInlineScript(
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
        'fb-pixel-init'
      )
      addNoScriptToBody(
        `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`,
        'fb-pixel-noscript'
      )
    }
  } catch (err) {
    console.warn('Falha ao carregar integrações', err)
  }
}

async function bootstrap() {
  await loadIntegrations()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
}

bootstrap()
