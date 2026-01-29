/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0df280',
                'bg-dark': '#050a08',
                'glass-border': 'rgba(255, 255, 255, 0.08)',
                'glass-bg': 'rgba(17, 24, 20, 0.75)'
            },
            fontFamily: {
                sans: ['Space Grotesk', 'sans-serif'],
            }
        },
    },
    plugins: [],
    darkMode: 'class',
}
