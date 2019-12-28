import React, { useState } from 'react';
import { TextField, Link } from '@material-ui/core';

const SrcApiKeyLink: React.FC = () => {
  const [srcNameInput, setSrcNameInput] = useState('');

  return <span className='src-api-key-link'>
    <Link
      className={srcNameInput.length ? '' : 'disabled'}
      href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
      target='src'
      rel='noopener'
    >https://www.speedrun.com/</Link>
    <TextField
      name='src-name'
      placeholder='SRC name'
      style={{ width: `${srcNameInput.length ? srcNameInput.length + 1 : 9.3}ch` }}
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

export default SrcApiKeyLink;