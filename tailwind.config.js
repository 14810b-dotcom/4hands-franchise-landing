/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./franch/**/*.html'],
    theme: {
        extend: {
            colors: {
                bg: '#FFFFFF',
                'bg-soft': '#F8F5FF',
                surface: '#FFFFFF',
                ink: '#1A1A1A',
                'ink-soft': '#3D3D3D',
                purple: '#7C3FAE',
                'purple-light': '#A06DD4',
                'purple-deep': '#5A2A82',
                pink: '#ED2CEE',
                'pink-light': '#F478F5',
                graphite: '#6B6B76',
            },
            fontFamily: {
                display: ['Wix Madefor Display', 'system-ui', 'sans-serif'],
                body: ['Wix Madefor Display', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
