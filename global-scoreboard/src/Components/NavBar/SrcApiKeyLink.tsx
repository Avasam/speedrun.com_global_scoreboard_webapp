import type { ChangeEventHandler } from 'react'
import { useState } from 'react'
import { Button, FormControl, InputGroup } from 'react-bootstrap'

const SrcApiKeyLink = () => {
  const [srcNameInput, setSrcNameInput] = useState('')

  const handleNameChange: ChangeEventHandler<HTMLInputElement> = event =>
    setSrcNameInput(event.currentTarget.value)

  return <InputGroup as='span' className='src-api-key-link'>
    <Button
      disabled={srcNameInput.length === 0}
      as='a'
      variant='outline-secondary'
      href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
      target='src'
    >www.speedrun.com/</Button>
    <FormControl
      style={{ minWidth: 85 }}
      type='text'
      name='src-name'
      placeholder='SRC name'
      aria-describedby='src name'
      data-lpignore='true'
      onChange={handleNameChange}
    />
    <Button
      disabled={srcNameInput.length === 0}
      as='a'
      variant='outline-secondary'
      href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
      target='src'
    >/settings/api/</Button>
  </InputGroup>
}

export default SrcApiKeyLink
