// Theme configuration store for ZenMedix
// Shared by the app shell and the premium UI system

export const THEMES = {
    medico: {
        id: 'medico',
        name: 'Medico',
        description: 'Azul quirurgico contemporaneo',
        colors: {
            50: '#eef8ff',
            100: '#d8edff',
            200: '#b5dbff',
            300: '#7dc1ff',
            400: '#3ea0ff',
            500: '#157ef3',
            600: '#0d66d7',
            700: '#0f4fa4',
            800: '#123f80',
            900: '#16376a',
        },
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        description: 'Teal dental premium',
        colors: {
            50: '#edf9f7',
            100: '#d5f1ec',
            200: '#afe2da',
            300: '#78cdc1',
            400: '#39b2a5',
            500: '#159488',
            600: '#0f7c78',
            700: '#10615f',
            800: '#114d4d',
            900: '#123f40',
        },
    },
}

export const MODES = ['light', 'dark', 'system']

export function getConfigTheme() {
    return localStorage.getItem('medflow_theme') || 'medico'
}

export function saveConfigTheme(theme) {
    localStorage.setItem('medflow_theme', theme)
    applyTheme(theme)
}

export function getConfigMode() {
    return localStorage.getItem('medflow_mode') || 'light'
}

export function saveConfigMode(mode) {
    localStorage.setItem('medflow_mode', mode)
    applyMode(mode)
}

function hexToRgbChannels(hexColor) {
    const hex = hexColor.replace('#', '')
    const normalized = hex.length === 3
        ? hex.split('').map((char) => `${char}${char}`).join('')
        : hex

    const intValue = Number.parseInt(normalized, 16)
    const r = (intValue >> 16) & 255
    const g = (intValue >> 8) & 255
    const b = intValue & 255

    return `${r} ${g} ${b}`
}

export function applyTheme(themeId) {
    const theme = THEMES[themeId] || THEMES.medico
    const root = document.documentElement

    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--primary-${key}`, value)
    })

    root.style.setProperty('--color-primary', hexToRgbChannels(theme.colors[600]))
    root.style.setProperty('--color-primary-hover', hexToRgbChannels(theme.colors[700]))
    root.style.setProperty('--color-primary-light', hexToRgbChannels(theme.colors[50]))

    root.style.display = 'none'
    root.offsetHeight
    root.style.display = ''
}

export function applyMode(mode) {
    const root = document.documentElement

    if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', prefersDark)
    } else {
        root.classList.toggle('dark', mode === 'dark')
    }
}

export function initializeTheme() {
    const theme = getConfigTheme()
    const mode = getConfigMode()

    applyTheme(theme)
    applyMode(mode)

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (getConfigMode() === 'system') {
            document.documentElement.classList.toggle('dark', event.matches)
        }
    })
}
