/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      '4xl': '2560px',
    },
    extend: {
      colors: {
        primary: '#8B0000',
        'primary-hover': '#6d0000',
        secondary: '#1c243c',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      fontSize: {
        'xxs': '0.65rem',
        'xxxs': '0.55rem',
        'xs-fluid': ['clamp(0.75rem, 1vw, 0.875rem)', {
          lineHeight: '1.25rem',
        }],
        'sm-fluid': ['clamp(0.875rem, 1.2vw, 1rem)', {
          lineHeight: '1.375rem',
        }],
        'base-fluid': ['clamp(1rem, 1.5vw, 1.125rem)', {
          lineHeight: '1.5rem',
        }],
        'lg-fluid': ['clamp(1.125rem, 2vw, 1.5rem)', {
          lineHeight: '1.75rem',
        }],
        'xl-fluid': ['clamp(1.25rem, 2.5vw, 2rem)', {
          lineHeight: '1.875rem',
        }],
        '2xl-fluid': ['clamp(1.5rem, 3vw, 2.5rem)', {
          lineHeight: '2rem',
        }],
        '3xl-fluid': ['clamp(1.875rem, 4vw, 3rem)', {
          lineHeight: '2.25rem',
        }],
        '4xl-fluid': ['clamp(2.25rem, 5vw, 4rem)', {
          lineHeight: '2.5rem',
        }],
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
      backdropBlur: {
        xs: '2px',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [],
};
