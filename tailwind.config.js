/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontWeight: {
  			'400': '400', '500': '500', '600': '600', '700': '700', '800': '800', '900': '900'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))', '2': 'hsl(var(--chart-2))', '3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))', '5': 'hsl(var(--chart-5))'
  			},
  			app: {
  				bg: '#3B4A2C',
  				surface: '#4A5A38',
  				card: '#2D3C20',
  				input: '#2A3A1C',
  				border: 'rgba(255,255,255,0.10)',
  				orange: '#E55C27',
  				orange2: '#FF7043',
  				amber: '#E8A830',
  				white: '#FFFFFF',
  				green: '#5C9A3C',
  				red: '#D94F3D',
  				sky: '#4A90D9',
  			},
  		},
  		fontFamily: {
  			heading: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			body: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			display: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			mono: ['DM Mono', 'Courier New', 'monospace']
  		},
  		keyframes: {
  			'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
  			'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
