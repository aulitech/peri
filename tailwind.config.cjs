const generateColorClass = (variable) => {
    return ({ opacityValue }) =>
        opacityValue ?
        `rgba(var(--${variable}), ${opacityValue})` :
        `rgb(var(--${variable}))`
}

const textColor = {
    primary: generateColorClass('text-primary'),
    secondary: generateColorClass('text-secondary'),
    tertiary: generateColorClass('text-tertiary'),
}

const backgroundColor = {
    primary: generateColorClass('bg-primary'),
    secondary: generateColorClass('bg-secondary'),
    tertiary: generateColorClass('bg-tertiary'),
}

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            textColor,
            backgroundColor,
        },
        height: {
            '80vh': '80vh',
            '85vh': '85vh',
            '90vh': '90vh'
        }
    },
    plugins: [],
}