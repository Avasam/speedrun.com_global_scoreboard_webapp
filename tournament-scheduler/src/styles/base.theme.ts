/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { ThemeOptions } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'

import math from 'src/utils/math'

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
          paddingBottom: themeSpacing(2),
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
          '.MuiPaper-root:first-of-type > &, &.MuiPaper-root:first-of-type': {
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
    MuiIconButton: {
      defaultProps: {
        color: 'primary',
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
            backgroundColor: 'transparent',
            color: 'inherit',
            fill: 'inherit !important',
          },
          '.MuiButton-sizeMedium > & .chq-atc--button, .chq-atc--dropdown a': {
            padding: `${themeSpacing(0.75)} ${themeSpacing(2)}`,
          },
          '.MuiButton-sizeSmall > & .chq-atc--button': {
            padding: `${themeSpacing(0.5)} ${themeSpacing(1.25)}`,
          },
          '.chq-atc--dropdown': {
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
