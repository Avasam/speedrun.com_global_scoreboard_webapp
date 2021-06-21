import type { ThemeOptions } from '@material-ui/core/styles'
import { createTheme } from '@material-ui/core/styles'

import math from 'src/utils/Math'

// Uses default `{spacing: 8}`
const themeSpacing = createTheme().spacing

const baseThemeOptions: ThemeOptions = {
  components: {
    MuiToolbar: {
      styleOverrides: {
        root: {
          justifyContent: 'space-between',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          textAlign: 'start',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'standard',
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: themeSpacing(2),
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          paddingLeft: themeSpacing(2),
          paddingRight: themeSpacing(2),
        },
        multiline: {
          '.MuiPaper-root:first-child > &': {
            paddingTop: themeSpacing(1),
            paddingBottom: themeSpacing(1),
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          paddingTop: 0,
          paddingBottom: 0,
          width: 'auto',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          '&.disabled': {
            color: 'gray',
            pointerEvents: 'none',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        code: {
          fontFamily: ['source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'].join(','),
        },
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        label: {
          fontSize: 'calc(10px + 2vmin)',
        },
        '.MuiButtonBase-root.MuiPickersDay-root': {
          backgroundColor: 'unset',
        },
        /* Replicate Material Design Style with AddToCalendar */
        '.chq-atc': {
          '.chq-atc--button.chq-atc--button, path, .chq-atc--dropdown, .chq-atc--dropdown a': {
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: themeSpacing(math.HALF),
            border: 'none',
            padding: 0,
            backgroundColor: 'transparent',
            color: 'inherit',
            fill: 'inherit !important',
          },
          '.chq-atc--dropdown a': {
            padding: `${themeSpacing(1)} ${themeSpacing(2)}`,
          },
          '.chq-atc--dropdown': {
            marginTop: `${themeSpacing(math.HALF)}`,
            marginLeft: `-${themeSpacing(1 + math.QUARTER)}`,
            width: `calc(100% + ${themeSpacing(2 + math.HALF)})`,
            padding: `${themeSpacing(1)} 0`,
            boxShadow: `0px 2px 4px -1px rgb(0 0 0 / 20%),
                        0px 4px 5px 0px rgb(0 0 0 / 14%),
                        0px 1px 10px 0px rgb(0 0 0 / 12%)`,
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
          },
        },
      },
    },
  },
}

export default baseThemeOptions
