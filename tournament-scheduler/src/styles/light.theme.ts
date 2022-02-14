import { createTheme } from '@mui/material'
import { amber as warn, indigo as primary, orange as secondary, red as error } from '@mui/material/colors'

import baseThemeOptions from './base.theme'
import { mergeDeep } from 'src/utils/objectUtils'

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
      background: {
        // HACK: I shouldn't need to set this: https://next.material-ui.com/customization/default-theme/#explore
        default: 'unset',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fill: 'black',
            backgroundColor: 'unset !important',
          },
          // Dropdowns, lists, and carheaders
          '.MuiPaper-elevation4, .MuiPaper-elevation8': {
            backgroundImage: `linear-gradient(${primary[800]}1E, ${primary[800]}1E)`, // rgba: R G B 0.12
          },
          // Datepicker
          '.PrivatePickersToolbar-root, .MuiTabs-root': {
            backgroundColor: `${primary[100]}28`, // rgba: R G B 0.16
          },
          /* Replicate Material Design Style with AddToCalendar */
          '.chq-atc .chq-atc--dropdown': {
            backgroundImage: `linear-gradient(${primary[800]}1E, ${primary[800]}1E)`, // rgba: R G B 0.12
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
