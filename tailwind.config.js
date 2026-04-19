/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'rgb(var(--color-primary, 15 124 120))',
                    hover: 'rgb(var(--color-primary-hover, 16 97 95))',
                    light: 'rgb(var(--color-primary-light, 237 249 247))',
                },
                danger: {
                    DEFAULT: '#dc2626',
                    hover: '#b91c1c',
                    light: '#fef2f2',
                },
                // Green Premium Palette
                'green-premium': {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
                display: ['Fraunces', 'Georgia', 'serif'],
            },
        },
    },
    plugins: [],
}
