import { Input, Link, Stack, useTheme } from '@material-ui/core'
import type { ChangeEvent, FC } from 'react'
import { useState } from 'react'

const MIN_WIDTH = 9 // SRC name

const SrcApiKeyLink: FC = () => {
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
      components={{ Root: 'span' }}
      name='src-name'
      placeholder='SRC name'
      // HACK using span as ocmponent looses ::before, so we have to reimplement this
      style={{
        borderBottomColor: srcNameInput.length > 0 ? theme.palette.primary.main : theme.palette.text.disabled,
        borderBottomStyle: 'solid',
        borderBottomWidth: '2px',
      }}
      inputProps={{
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
