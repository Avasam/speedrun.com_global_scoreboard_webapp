import { Input, Link, Stack, useTheme } from '@material-ui/core'
import type { ChangeEvent, FC } from 'react'
import { useState } from 'react'

const MIN_WIDTH = 9 // SRC name

const InputSpan: FC<{ styleProps: unknown }> = ({ styleProps, ...props }) =>
  <span {...props}>{props.children}</span>

const SrcApiKeyLink = () => {
  const [srcNameInput, setSrcNameInput] = useState('')
  const [linkHover, setStartHover] = useState(false)
  const theme = useTheme()

  const handleNameChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSrcNameInput(event.currentTarget.value)

  return <Stack component='span' direction='row' alignItems='center' display='inline-flex'>
    <Link
      className={srcNameInput.length > 0 ? '' : 'disabled'}
      href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
      target='src'
      rel='noopener'
      style={{ textDecoration: linkHover ? 'underline' : undefined }}
      onMouseEnter={() => setStartHover(true)}
      onMouseLeave={() => setStartHover(false)}
    >www.speedrun.com/</Link>
    <Input
      // divs are not allowed as childs of p
      // eslint-disable-next-line react/display-name
      components={{ Root: InputSpan }}
      name='src-name'
      placeholder='SRC name'
      // HACK using span as component looses ::before, so we have to reimplement this
      style={{
        borderBottomColor: srcNameInput.length > 0 ? theme.palette.primary.main : theme.palette.text.disabled,
        borderBottomStyle: 'solid',
        borderBottomWidth: '2px',
      }}
      inputProps={{
        'data-lpignore': 'true',
        style: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          width: `${srcNameInput.length > 0 ? srcNameInput.length + 0.5 : MIN_WIDTH}ch`,
          textDecoration: linkHover ? 'underline' : undefined,
        },
      }}
      onChange={handleNameChange}
    />
    <Link
      className={srcNameInput.length > 0 ? '' : 'disabled'}
      href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
      target='src'
      rel='noopener'
      style={{ textDecoration: linkHover ? 'underline' : undefined }}
      onMouseEnter={() => setStartHover(true)}
      onMouseLeave={() => setStartHover(false)}
    >/settings/api</Link>
  </Stack>
}

export default SrcApiKeyLink
