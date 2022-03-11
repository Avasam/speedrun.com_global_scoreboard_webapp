import type { FC } from 'react'
import { createContext, useEffect, useMemo, useRef, useState } from 'react'

import { getLocalStorageItem, setLocalStorageItem } from 'src/utils/localStorage'

// TODO: Get through api: https://bootswatch.com/api/5.json
export const THEMES = [
  // Light
  'Default',
  'Cerulean',
  'Cosmo',
  'Flatly',
  'Journal',
  'Litera',
  'Lumen',
  'Lux',
  'Materia',
  'Minty',
  'Morph',
  'Pulse',
  'Sandstone',
  'Simplex',
  'Sketchy',
  'Spacelab',
  'United',
  'Yeti',
  'Zephyr',
  // Dark
  'Darkly',
  'Cyborg',
  'Slate',
  'Solar',
  'Superhero',
  'Vapor',
  'Quartz',
] as const
const LIGHT_THEMES_COUNT = 19

export const LIGHT_THEMES = THEMES.slice(0, LIGHT_THEMES_COUNT)

export const DARK_THEMES = THEMES.slice(LIGHT_THEMES_COUNT)

export type Themes = typeof THEMES[number]

type ThemeContextProps = [Themes, (theme: Themes) => void]
export const ThemeContext = createContext(['Default', () => { /**/ }] as ThemeContextProps)

const setHref = (element: HTMLLinkElement, theme: Themes) => {
  if (theme === 'Default') {
    element.removeAttribute('href')
  } else {
    element.href = `https://cdn.jsdelivr.net/npm/bootswatch@5.0.2/dist/${theme.toLowerCase()}/bootstrap.min.css`
  }
}

const ThemeProvider: FC = ({ children }) => {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  const savedTheme = getLocalStorageItem<Themes>('preferedBootstrapTheme', prefersDarkScheme ? 'Darkly' : 'Default')
  const [preferedBootstrapTheme, setPreferedBootstrapTheme] = useState(savedTheme)
  const bootswatchStyleRef = useRef<HTMLLinkElement>()

  useEffect(() => {
    if (bootswatchStyleRef.current) return
    // This will be constant in prod
    let bootstrapStyle = document
      .getElementsByTagName('title')
      .item(0) // <title>
      ?.nextElementSibling // <script>
      ?.nextElementSibling // <style>
      // See index.tsx for Bootstrap import index
    const devBootstrapStyle = bootstrapStyle
      ?.nextElementSibling // <style>
      ?.nextElementSibling // <style>
    if (devBootstrapStyle) bootstrapStyle = devBootstrapStyle
    if (!bootstrapStyle) throw new Error('Couldn\'t find where to inject Bootswatch in the <head>')
    bootswatchStyleRef.current = document.createElement('link')
    bootswatchStyleRef.current.id = 'bootswatch-theme'
    bootswatchStyleRef.current.rel = 'stylesheet'
    setHref(bootswatchStyleRef.current, preferedBootstrapTheme)

    document.head.insertBefore(bootswatchStyleRef.current, bootstrapStyle.nextSibling)
  })

  const value = useMemo(() => {
    const saveTheme = (theme: Themes) => {
      if (!bootswatchStyleRef.current) return
      setHref(bootswatchStyleRef.current, theme)
      setPreferedBootstrapTheme(theme)
      setLocalStorageItem('preferedBootstrapTheme', theme)
    }

    return [preferedBootstrapTheme, saveTheme] as [typeof preferedBootstrapTheme, typeof saveTheme]
  }, [preferedBootstrapTheme])

  return <ThemeContext.Provider value={value}>
    <div data-theme={preferedBootstrapTheme}>
      {children}
    </div>
  </ThemeContext.Provider>
}

export default ThemeProvider
