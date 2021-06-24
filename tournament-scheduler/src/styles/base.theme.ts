/* eslint-disable @typescript-eslint/no-magic-numbers */
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
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': {
            paddingBottom: themeSpacing(2),
          },
          '.MuiListItem-root': {
            margin: `0 -${themeSpacing(2)}`,
          },
        },
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
          '.MuiPaper-root:first-of-type > &': {
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
    MuiModal: {
      styleOverrides: {
        root: {
          '.PrivatePickersSlideTransition-root': {
            minHeight: '232px', // Fixes weird extra-height in calendar picker
          },
          '[class*="PickerToolbar-penIcon"]': {
            display: 'none',
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.MuiPickersDay-root': {
            backgroundColor: 'unset',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
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
            marginLeft: `-${themeSpacing(1.25)}`,
            width: `calc(100% + ${themeSpacing(2.5)})`,
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
