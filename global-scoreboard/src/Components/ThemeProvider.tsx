import { createContext, useContext } from 'react'

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

const ThemeProvider = () => {
  const [theme] = useContext(ThemeContext)

  // TODO: Try to load at the very top of head so it's loaded first (but after bootstrap)
  return <>
    {theme === 'Default'
      ? <></>
      : <link
        rel='stylesheet'
        href={
          `https://cdn.jsdelivr.net/npm/bootswatch@5.0.2/dist/${theme.toLowerCase()}/bootstrap.min.css`
        }
      />}
  </>
}

export default ThemeProvider
