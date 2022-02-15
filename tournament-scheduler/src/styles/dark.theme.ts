import { createTheme } from '@mui/material'
import { lightBlue as secondary, red as error, teal as primary, yellow as warn } from '@mui/material/colors'

import baseThemeOptions from './base.theme'
import { mergeDeep } from 'src/utils/objectUtils'

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
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fill: 'white',
            backgroundColor: '#222',
          },
          // Datepicker
          '.PrivatePickersToolbar-root, .MuiTabs-root': {
            backgroundColor: '#222',
          },
          /* Replicate Material Design Style with AddToCalendar */
          '.chq-atc': {
            '.chq-atc--button.chq-atc--button, .chq-atc--button path, .chq-atc--dropdown, .chq-atc--dropdown a': {
              color: 'white',
              fill: 'white',
            },
            '.chq-atc--dropdown': {
              backgroundColor: '#121212',
              'a:hover ': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
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
          '::-webkit-scrollbar-thumb, ::-webkit-scrollbar-corner, ::-webkit-scrollbar-track': {
            // Opera can't take transparent here
            backgroundColor: '#303030',
            borderColor: '#424242',
            '&:hover': {
              // Opera can't take transparent here
              backgroundColor: '#242424',
            },
          },
          '::-webkit-scrollbar-track-piece': {
            // TODO MUI5: Check if this is still good
            backgroundColor: '#424242',
          },
        },
      },
    },
  },
))

export default theme
