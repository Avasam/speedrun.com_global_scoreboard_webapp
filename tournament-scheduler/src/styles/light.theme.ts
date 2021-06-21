import { amber as warn, indigo as primary, orange as secondary, red as error } from '@material-ui/core/colors'
import { createTheme } from '@material-ui/core/styles'

import baseThemeOptions from './base.theme'
import { mergeDeep } from 'src/utils/MergeDeep'

// Actual theme declaration
const theme = createTheme(mergeDeep(
  baseThemeOptions,
  {
    palette: {
      mode: 'light',
      primary,
      secondary,
      warn: warn[600],
      error,
    },
    components: {
      // HACK: Couldn't get the color override working.
      // See the following issue for eventual solution:
      // https://github.com/mui-org/material-ui/issues/24778
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&.error': {
              color: error[500],
            },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fill: 'black',
          },

          '.MuiPaper-elevation8.MuiPaper-elevation8': {
            backgroundColor: `${primary[800]}1E`, // rgba: R G B 0.12
          },
          '.PrivatePickersToolbar-root, .MuiTabs-root, .MuiPaper-elevation1.MuiPaper-elevation1': {
            backgroundColor: `${primary[100]}28`, // rgba: R G B 0.16
          },
          /* Replicate Material Design Style with AddToCalendar */
          '.chq-atc .chq-atc--dropdown': {
            backgroundColor: 'white',
            'a:hover ': {
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
            },
          },
          '.error-as-warning': {
            '.MuiFormLabel-root.Mui-error, .MuiFormHelperText-root.Mui-error': {
              color: warn[600],
            },
            '.MuiInput-underline.Mui-error:after': {
              borderBottomColor: warn[600],
            },
          },
        },
      },
    },
  },
))

export default theme