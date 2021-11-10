import Brightness4 from '@mui/icons-material/Brightness4'
import Brightness7 from '@mui/icons-material/Brightness7'
import { AppBar, Box, Button, CssBaseline, IconButton, Link, Stack, Toolbar, Typography, useMediaQuery } from '@mui/material'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import { StatusCodes } from 'http-status-codes'
import { useEffect, useState } from 'react'
import { Link as RouterLink, Route, Switch, useLocation } from 'react-router-dom'

import LoginForm from './LoginForm/LoginForm'
import ScheduleManagement from './ScheduleManagement/ScheduleManagement'
import ScheduleRegistration from './ScheduleRegistration'
import ScheduleGroupViewer from './ScheduleViewer/ScheduleGroupViewer'
import ScheduleViewer from './ScheduleViewer/ScheduleViewer'
import { apiGet } from 'src/fetchers/api'
import type User from 'src/Models/User'
import darkTheme from 'src/styles/dark.theme'
import lightTheme from 'src/styles/light.theme'
import copyToClipboard from 'src/utils/clipboard'

type Themes = 'dark' | 'light'
type StylesOverrides = { body: { background: string } }
const embedded = typeof new URLSearchParams(window.location.search).get('embedded') == 'string'
if (embedded) {
  (lightTheme.components?.MuiCssBaseline?.styleOverrides as unknown as StylesOverrides).body.background = 'transparent';
  (darkTheme.components?.MuiCssBaseline?.styleOverrides as unknown as StylesOverrides).body.background = 'transparent'
}

const getCurrentUser = () => apiGet('users/current').then(response => response.json())

const logout = (setCurrentUser: (user: null) => void) => {
  setCurrentUser(null)
  localStorage.removeItem('jwtToken')
}

const App = () => {
  /* eslint-disable react-hooks/rules-of-hooks */
  for (const param of ['register', 'view']) {
    const oldParamValue = new URLSearchParams(window.location.search).get(param)
    if (oldParamValue != null) {
      const newLink = `${window.location.origin}${process.env.PUBLIC_URL}/${param}/${oldParamValue}`
      console.warn(`Old ${param} param found in URL, redirecting to:`, newLink)
      copyToClipboard(newLink).finally(() => window.location.href = newLink)
      return <>{undefined}</>
    }
  }

  const isMobileSize = useMediaQuery('(max-width:640px)', { noSsr: true })
  const [currentUser, setCurrentUser] = useState<User | null | undefined>()
  const location = useLocation()

  useEffect(() => {
    getCurrentUser()
      .then((response: { user: User | undefined }) => response.user)
      .then(setCurrentUser)
      .catch((error: Response) => {
        if (error.status === StatusCodes.UNAUTHORIZED) {
          setCurrentUser(null)
        } else {
          console.error(error)
        }
      })
  }, [])

  const prefersLightScheme = useMediaQuery('@media (prefers-color-scheme: light)', { noSsr: true })
  const savedTheme = localStorage.getItem('preferedMaterialTheme') ?? (prefersLightScheme ? 'light' : 'dark')
  const [preferedMaterialTheme, setpreferedMaterialTheme] = useState(savedTheme)
  const saveTheme = (theme: Themes) => {
    setpreferedMaterialTheme(theme)
    localStorage.setItem('preferedMaterialTheme', theme)
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={preferedMaterialTheme === 'light' ? lightTheme : darkTheme}>
        <CssBaseline />
        <Stack style={{ height: '100%', textAlign: 'center' }}>
          {!embedded &&
            <AppBar enableColorOnDark position='static'>
              <Toolbar>
                <Link
                  component={RouterLink}
                  style={{ height: 'auto', width: 'auto' }}
                  to='/'
                >
                  {(currentUser || isMobileSize || location.pathname !== '/') &&
                    <IconButton size='large'>
                      <img
                        alt='logo'
                        src={`${window.location.origin}/assets/images/favicon.webp`}
                        style={{
                          height: !currentUser && isMobileSize ? 'auto' : '40px',
                          maxWidth: '90px', // Enough to fit title at minimum supported width
                        }}
                      />
                    </IconButton>}
                </Link>
                <Typography variant={currentUser || isMobileSize ? 'h4' : 'h2'}>Tournament Scheduler</Typography>
                <Stack alignItems='center' direction='row' flexWrap='wrap' justifyContent='flex-end' spacing={2}>
                  {preferedMaterialTheme === 'dark'
                    ? <IconButton
                      color='default'
                      onClick={() => saveTheme('light')}
                      size='large'
                    >
                      <Brightness7 />
                    </IconButton>
                    : <IconButton
                      color='default'
                      onClick={() => saveTheme('dark')}
                      size='large'
                    >
                      <Brightness4 />
                    </IconButton>}
                  {currentUser &&
                    <Button
                      color='secondary'
                      onClick={() => logout(setCurrentUser)}
                      size='small'
                      variant='contained'
                    >
                      Logout
                    </Button>}
                </Stack>
              </Toolbar>
            </AppBar>}

          <Box sx={{
            flex: 1,
            overflow: 'auto',
          }}
          >
            <Switch>
              <Route
                exact
                path='/view/:scheduleId'
                render={routeProps => <ScheduleViewer scheduleId={Number(routeProps.match.params.scheduleId)} />}
              />
              <Route
                path='/view/group/:groupId'
                render={routeProps => <ScheduleGroupViewer groupId={Number(routeProps.match.params.groupId)} />}
              />
              <Route
                path='/register/:registrationId?'
                render={routeProps => <ScheduleRegistration {...routeProps.match.params} />}
              />
              {currentUser !== undefined &&
                <Route
                  render={currentUser
                    ? () => <ScheduleManagement currentUser={currentUser} />
                    : () => <LoginForm onLogin={setCurrentUser} />}
                />}
            </Switch>
          </Box>

          <footer>
            &copy;
            {' '}
            <Link
              href='https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/blob/main/LICENSE'
              target='about'
            >
              Copyright
            </Link>
            {` ${new Date().getFullYear()} by `}
            <Link
              href='https://github.com/Avasam/'
              target='about'
            >
              Samuel Therrien
            </Link>
            {' ('}
            <Link href='https://www.twitch.tv/Avasam' target='about'>
              Avasam
              {/**/}
              <img
                alt='Twitch'
                height='14'
                src='https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png'
              />
            </Link>
            ).
            Powered by
            <Link
              href='https://www.speedrun.com/'
              target='speedruncom'
            >
              speedrun.com
            </Link>
            {' and'}
            <Link
              href='https://www.pythonanywhere.com/'
              target='about'
            >
              PythonAnywhere
            </Link>
          </footer>
        </Stack>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

export default App
