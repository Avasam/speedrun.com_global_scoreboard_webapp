import { Link, TextField } from '@material-ui/core'
import React, { FC, useState } from 'react'

const SrcApiKeyLink: FC = () => {
  const [srcNameInput, setSrcNameInput] = useState('')

  return <span className='src-api-key-link'>
    <Link
      className={srcNameInput.length ? '' : 'disabled'}
      href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
      target='src'
      rel='noopener'
    >www.speedrun.com/</Link>
    <TextField
      name='src-name'
      placeholder='SRC name'
      style={{ width: `${srcNameInput.length ? srcNameInput.length + 1 : 9}ch` }}
      onChange={event => setSrcNameInput(event.currentTarget.value)}
    />
    <Link
      className={srcNameInput.length ? '' : 'disabled'}
      href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
      target='src'
      rel='noopener'
    >/settings/api</Link>
  </span>
}

export default SrcApiKeyLink
