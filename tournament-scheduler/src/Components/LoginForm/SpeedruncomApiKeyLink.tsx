import type { Theme, TypographyProps } from '@mui/material'
import { Input, Link, Stack, Typography, useTheme } from '@mui/material'
import type { SxProps } from '@mui/system'
import type { ChangeEvent } from 'react'
import { useState } from 'react'

const MIN_WIDTH = 9 // SR.C name

const disabled: SxProps<Theme> = {
  '&.disabled': {
    color: 'gray',
    pointerEvents: 'none',
  },
}

const InputSpan = (props: TypographyProps) =>
  <Typography component='span' {...props}>{props.children}</Typography>

const SpeedruncomApiKeyLink = () => {
  const [sourceNameInput, setSpeedruncomNameInput] = useState('')
  const [linkHover, setStartHover] = useState(false)
  const theme = useTheme()

  const handleNameChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSpeedruncomNameInput(event.currentTarget.value)

  return <Stack alignItems='center' component='span' direction='row' display='inline-flex'>
    <Link
      href={`https://www.speedrun.com/${sourceNameInput}/settings/api`}
      onMouseEnter={() => setStartHover(true)}
      onMouseLeave={() => setStartHover(false)}
      rel='noopener'
      style={{ textDecoration: linkHover ? 'underline' : undefined }}
      sx={sourceNameInput.length > 0 ? undefined : disabled}
      target='speedruncom'
    >
      www.speedrun.com/
    </Link>
    <Input
      // divs are not allowed as childs of p
      components={{ Root: InputSpan }}
      inputProps={{
        'data-lpignore': 'true',
        style: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          width: `${sourceNameInput.length > 0 ? sourceNameInput.length + 0.5 : MIN_WIDTH}ch`,
          textDecoration: linkHover ? 'underline' : undefined,
        },
      }}
      name='speedruncom-name'
      // HACK using span as component looses ::before, so we have to reimplement this
      onChange={handleNameChange}
      placeholder='SR.C name'
      style={{
        borderBottomColor: sourceNameInput.length > 0 ? theme.palette.primary.main : theme.palette.text.disabled,
        borderBottomStyle: 'solid',
        borderBottomWidth: '2px',
      }}
    />
    <Link
      href={`https://www.speedrun.com/${sourceNameInput}/settings/api`}
      onMouseEnter={() => setStartHover(true)}
      onMouseLeave={() => setStartHover(false)}
      rel='noopener'
      style={{ textDecoration: linkHover ? 'underline' : undefined }}
      sx={sourceNameInput.length > 0 ? undefined : disabled}
      target='speedruncom'
    >
      /settings/api
    </Link>
  </Stack>
}

export default SpeedruncomApiKeyLink
