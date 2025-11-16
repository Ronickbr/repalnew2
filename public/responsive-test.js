// Script para testar responsividade em diferentes tamanhos de tela
// Execute este script no console do navegador (F12)

const responsiveTest = {
  breakpoints: [
    { name: 'Mobile Pequeno', width: 320, height: 568 },
    { name: 'Mobile Médio', width: 375, height: 667 },
    { name: 'Mobile Grande', width: 414, height: 896 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop Pequeno', width: 1024, height: 768 },
    { name: 'Desktop Médio', width: 1280, height: 800 },
    { name: 'Desktop Grande', width: 1440, height: 900 },
    { name: 'Full HD', width: 1920, height: 1080 },
    { name: '2K', width: 2560, height: 1440 },
    { name: '4K', width: 3840, height: 2160 }
  ],

  currentTest: 0,
  results: [],

  init() {
    console.log('🧪 Iniciando teste de responsividade...');
    this.testNextBreakpoint();
  },

  testNextBreakpoint() {
    if (this.currentTest >= this.breakpoints.length) {
      this.showResults();
      return;
    }

    const breakpoint = this.breakpoints[this.currentTest];
    console.log(`📱 Testando: ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
    
    // Redimensionar janela
    window.resizeTo(breakpoint.width, breakpoint.height);
    
    // Aguardar um pouco para a página se ajustar
    setTimeout(() => {
      this.analyzeBreakpoint(breakpoint);
      this.currentTest++;
      this.testNextBreakpoint();
    }, 2000);
  },

  analyzeBreakpoint(breakpoint) {
    const result = {
      name: breakpoint.name,
      width: breakpoint.width,
      height: breakpoint.height,
      issues: [],
      warnings: [],
      good: []
    };

    // Verificar elementos críticos
    const elements = {
      navigation: document.querySelector('nav, .navigation, header'),
      mobileMenu: document.querySelector('.mobile-menu, #mobile-menu'),
      desktopMenu: document.querySelector('.desktop-menu, .hidden.lg\\:flex'),
      productGrid: document.querySelector('.grid'),
      filters: document.querySelector('.filters, .filter-section'),
      search: document.querySelector('input[type="search"], .search'),
      buttons: document.querySelectorAll('button, .button'),
      images: document.querySelectorAll('img'),
      textElements: document.querySelectorAll('h1, h2, h3, p, span')
    };

    // Verificar visibilidade dos menus
    if (breakpoint.width < 1024) {
      if (!elements.mobileMenu && !elements.navigation?.querySelector('.mobile-menu')) {
        result.issues.push('Menu mobile não encontrado');
      }
      if (elements.desktopMenu && !elements.desktopMenu.classList.contains('hidden')) {
        result.warnings.push('Menu desktop visível em tela pequena');
      }
    } else {
      if (!elements.desktopMenu) {
        result.issues.push('Menu desktop não encontrado');
      }
    }

    // Verificar tamanho dos botões (mínimo 44px para touch)
    elements.buttons.forEach((button, index) => {
      const rect = button.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        result.warnings.push(`Botão ${index + 1} muito pequeno para touch (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
      }
    });

    // Verificar legibilidade do texto
    elements.textElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = parseFloat(computedStyle.lineHeight);
      
      if (fontSize < 12) {
        result.issues.push(`Texto ${index + 1} muito pequeno (${fontSize}px)`);
      }
      
      if (lineHeight < fontSize * 1.2) {
        result.warnings.push(`Altura da linha inadequada no texto ${index + 1}`);
      }
    });

    // Verificar imagens com lazy loading
    elements.images.forEach((img, index) => {
      if (!img.hasAttribute('loading') && !img.hasAttribute('data-src')) {
        result.warnings.push(`Imagem ${index + 1} sem lazy loading`);
      }
    });

    // Verificar grid responsivo
    if (elements.productGrid) {
      const gridStyle = window.getComputedStyle(elements.productGrid);
      const gridTemplateColumns = gridStyle.gridTemplateColumns;
      
      if (breakpoint.width < 640 && !gridTemplateColumns.includes('1fr')) {
        result.warnings.push('Grid pode não estar otimizado para mobile');
      }
    }

    // Verificar scroll horizontal
    const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
    if (hasHorizontalScroll) {
      result.issues.push('Scroll horizontal detectado');
    }

    // Verificar viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta || !viewportMeta.getAttribute('content')?.includes('width=device-width')) {
      result.issues.push('Meta tag viewport inadequada');
    }

    // Verificar performance básica
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    if (loadTime > 3000) {
      result.warnings.push(`Tempo de carregamento alto (${loadTime}ms)`);
    } else {
      result.good.push('Bom tempo de carregamento');
    }

    this.results.push(result);
  },

  showResults() {
    console.log('📊 RESULTADOS DO TESTE DE RESPONSIVIDADE:');
    console.log('=' .repeat(50));
    
    this.results.forEach(result => {
      console.log(`\n📱 ${result.name} (${result.width}x${result.height})`);
      
      if (result.issues.length > 0) {
        console.log('❌ Problemas:');
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('⚠️  Avisos:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
      
      if (result.good.length > 0) {
        console.log('✅ Pontos positivos:');
        result.good.forEach(good => console.log(`   - ${good}`));
      }
      
      if (result.issues.length === 0 && result.warnings.length === 0) {
        console.log('✅ Tudo certo!');
      }
    });

    // Resumo geral
    const totalIssues = this.results.reduce((acc, r) => acc + r.issues.length, 0);
    const totalWarnings = this.results.reduce((acc, r) => acc + r.warnings.length, 0);
    
    console.log('\n📈 RESUMO GERAL:');
    console.log(`Total de problemas: ${totalIssues}`);
    console.log(`Total de avisos: ${totalWarnings}`);
    
    if (totalIssues === 0 && totalWarnings === 0) {
      console.log('🎉 Parabéns! Sua interface está totalmente responsiva!');
    } else if (totalIssues === 0) {
      console.log('✅ Boa! Sua interface está responsiva, mas há algumas melhorias possíveis.');
    } else {
      console.log('🔧 Há problemas que precisam ser corrigidos para melhorar a responsividade.');
    }
  }
};

// Função auxiliar para testar performance
const performanceTest = {
  testImageLoading() {
    const images = document.querySelectorAll('img');
    const results = [];
    
    images.forEach((img, index) => {
      const startTime = performance.now();
      
      if (img.complete) {
        const loadTime = performance.now() - startTime;
        results.push({
          index,
          src: img.src,
          loadTime,
          status: 'already loaded'
        });
      } else {
        img.addEventListener('load', () => {
          const loadTime = performance.now() - startTime;
          results.push({
            index,
            src: img.src,
            loadTime,
            status: 'loaded'
          });
        });
        
        img.addEventListener('error', () => {
          results.push({
            index,
            src: img.src,
            loadTime: performance.now() - startTime,
            status: 'error'
          });
        });
      }
    });
    
    setTimeout(() => {
      console.log('📸 Teste de carregamento de imagens:');
      results.forEach(result => {
        console.log(`Imagem ${result.index}: ${result.status} em ${Math.round(result.loadTime)}ms`);
      });
    }, 3000);
  },

  testTouchTargets() {
    const buttons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
    const issues = [];
    
    buttons.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      const padding = {
        top: parseFloat(computedStyle.paddingTop),
        right: parseFloat(computedStyle.paddingRight),
        bottom: parseFloat(computedStyle.paddingBottom),
        left: parseFloat(computedStyle.paddingLeft)
      };
      
      const touchWidth = rect.width;
      const touchHeight = rect.height;
      
      if (touchWidth < 44 || touchHeight < 44) {
        issues.push({
          index,
          element: element.tagName,
          size: `${Math.round(touchWidth)}x${Math.round(touchHeight)}px`,
          padding: padding,
          recommendation: touchWidth < 44 ? 'Aumentar largura' : 'Aumentar altura'
        });
      }
    });
    
    console.log('👆 Teste de áreas de toque:');
    if (issues.length === 0) {
      console.log('✅ Todas as áreas de toque estão adequadas (≥44px)');
    } else {
      console.log(`⚠️  ${issues.length} elementos com área de toque inadequada:`);
      issues.forEach(issue => {
        console.log(`   Elemento ${issue.index} (${issue.element}): ${issue.size} - ${issue.recommendation}`);
      });
    }
  }
};

// Como usar:
console.log('🚀 Ferramentas de teste de responsividade carregadas!');
console.log('Comandos disponíveis:');
console.log('- responsiveTest.init() - Executa teste completo de responsividade');
console.log('- performanceTest.testImageLoading() - Testa carregamento de imagens');
console.log('- performanceTest.testTouchTargets() - Testa áreas de toque');

// Teste rápido do viewport atual
console.log(`📱 Viewport atual: ${window.innerWidth}x${window.innerHeight}px`);
console.log(`📊 DPR (Device Pixel Ratio): ${window.devicePixelRatio}`);
console.log(`🌐 User Agent: ${navigator.userAgent.substring(0, 50)}...`);