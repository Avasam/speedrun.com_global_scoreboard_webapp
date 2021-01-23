import { Link, TextField } from '@material-ui/core'
import type { ChangeEvent, FC } from 'react'
import { useState } from 'react'

const SrcApiKeyLink: FC = () => {
  const [srcNameInput, setSrcNameInput] = useState('')

  const handleNameChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSrcNameInput(event.currentTarget.value)

  return <span className='src-api-key-link'>
    <Link
      className={srcNameInput.length > 0 ? '' : 'disabled'}
      href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
      target='src'
      rel='noopener'
    >www.speedrun.com/</Link>
    <TextField
      name='src-name'
      placeholder='SRC name'
      style={{ width: `${srcNameInput.length > 0 ? srcNameInput.length + 1 : 9}ch` }}
      onChange={handleNameChange}
    />
    <Link
      className={srcNameInput.length > 0 ? '' : 'disabled'}
      href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
      target='src'
      rel='noopener'
    >/settings/api</Link>
  </span>
}

export default SrcApiKeyLink
