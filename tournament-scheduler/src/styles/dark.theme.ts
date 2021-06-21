import { lightBlue as secondary, red as error, teal as primary, yellow as warn } from '@material-ui/core/colors'
import { createTheme } from '@material-ui/core/styles'

import baseThemeOptions from './base.theme'
import { mergeDeep } from 'src/utils/MergeDeep'

// Actual theme declaration
const theme = createTheme(mergeDeep(
  baseThemeOptions,
  {
    palette: {
      mode: 'dark',
      primary,
      secondary,
      warn,
      error: { main: error[700] },
      background: {
        // HACK: I shouldn't need to set this: https://next.material-ui.com/customization/default-theme/#explore
        default: '#222',
      },
    },
    components: {
      // HACK: Couldn't get the color override working.
      // See the following issue for eventual solution:
      // https://github.com/mui-org/material-ui/issues/24778
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&.error': {
              color: error[700],
            },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fill: 'white',
          },
          '.PrivatePickersToolbar-root, .MuiTabs-root': {
            backgroundColor: '#222',
          },
          /* Replicate Material Design Style with AddToCalendar */
          '.chq-atc .chq-atc--dropdown': {
            backgroundColor: '#121212',
            'a:hover ': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          },
          '.error-as-warning': {
            '.MuiFormLabel-root.Mui-error, .MuiFormHelperText-root.Mui-error': {
              color: warn[500],
            },
            '.MuiInput-underline.Mui-error:after': {
              borderBottomColor: warn[500],
            },
          },
        },
      },
    },
  },
))

export default theme
