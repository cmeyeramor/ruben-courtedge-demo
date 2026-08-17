/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TEC360 brand palette (see public/colors.json)
        'primary': '#0E223D',        // Navy - primary brand color
        'primary-light': '#1a3a5c',  // Lighter navy
        'accent': '#2F5FB4',         // TEC360 blue - primary accent
        'accent-light': '#5b82c9',   // Lighter blue
        'baby-blue': '#BED8E5',      // Soft accent / highlight tint
        'court-orange': '#2F5FB4',   // Legacy alias -> brand blue
        'court-brown': '#0E223D',    // Legacy alias -> navy
        'court-tan': '#D4D4D0',      // Legacy alias -> brand gray
        'hoop-red': '#ef4444',       // Legacy alias -> error red
        'net-white': '#ffffff',      // Legacy alias -> white
        'tech-purple': '#2F5FB4',    // Legacy alias -> brand blue
        'tech-purple-light': '#5b82c9',
        'okta-blue': '#007dc1',      // Okta brand blue
        'okta-blue-light': '#0ea5e9',
        'success-green': '#22c55e',  // Success states
        'error-red': '#ef4444',      // Error states
        'neutral-bg': '#f5f6f8',     // Light background
        'neutral-border': '#e5e7eb', // Light borders

        // Agent colors (matching backend)
        'agent-sales': '#2F5FB4',     // Blue
        'agent-inventory': '#10b981', // Green
        'agent-customer': '#0E223D',  // Navy
        'agent-pricing': '#f59e0b',   // Orange

        // Legacy progear colors (keep for compatibility)
        'progear': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        'display': ['var(--font-montserrat)', 'system-ui', 'sans-serif'], // headings / callouts
        'sans': ['var(--font-lato)', 'system-ui', 'sans-serif'],           // body copy (default)
        'mono': ['JetBrains Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
