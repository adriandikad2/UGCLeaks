/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        noob: {
          pink: '#ff006e',
          cyan: '#00d9ff',
          yellow: '#ffbe0b',
          lime: '#00ff41',
          purple: '#b54eff',
          orange: '#ff8c42',
          red: '#ff1744',
          blue: '#2196f3',
          indigo: '#667eea',
          violet: '#764ba2',
        },
      },
      boxShadow: {
        blocky: '8px 8px 0px rgba(0, 0, 0, 0.2)',
        'blocky-lg': '12px 12px 0px rgba(0, 0, 0, 0.3)',
        'glow-pink': '0 0 20px rgba(255, 0, 110, 0.6)',
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.6)',
        'glow-yellow': '0 0 20px rgba(255, 190, 11, 0.6)',
        'glow-purple': '0 0 20px rgba(181, 78, 255, 0.6)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'float-fast': 'float-fast 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-rotate': 'bounce-rotate 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotateX(0deg) rotateY(0deg)' },
          '50%': { transform: 'translateY(-20px) rotateX(20deg) rotateY(20deg)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotateX(0deg) rotateY(0deg)' },
          '50%': { transform: 'translateY(-30px) rotateX(-15deg) rotateY(-15deg)' },
        },
        'float-fast': {
          '0%, 100%': { transform: 'translateY(0px) rotateX(0deg) rotateY(0deg)' },
          '50%': { transform: 'translateY(-15px) rotateX(25deg) rotateY(-25deg)' },
        },
      },
    },
  },
  plugins: [],
}
