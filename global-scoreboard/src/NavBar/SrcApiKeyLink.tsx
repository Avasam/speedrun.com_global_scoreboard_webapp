import { Button, Form, InputGroup } from 'react-bootstrap'
import { ChangeEventHandler, FC, useState } from 'react'

const SrcApiKeyLink: FC = () => {
  const [srcNameInput, setSrcNameInput] = useState('')

  const handleNameChange: ChangeEventHandler<HTMLInputElement> = event =>
    setSrcNameInput(event.currentTarget.value)

  return <span className='src-api-key-link'>
    <InputGroup>
      <InputGroup.Prepend>
        <Button
          disabled={srcNameInput.length === 0}
          as='a'
          variant='outline-secondary'
          href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
          target='src'
        >www.speedrun.com/</Button>
      </InputGroup.Prepend>
      {/* TODO: Adapt to characters length like in tournament scheduler */}
      <Form.Control
        style={{ minWidth: 85 }}
        type='text'
        name='src-name'
        placeholder='SRC name'
        aria-describedby='src name'
        onChange={handleNameChange}
      />
      <InputGroup.Append>
        <Button
          disabled={srcNameInput.length === 0}
          as='a'
          variant='outline-secondary'
          href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
          target='src'
        >/settings/api/</Button>
      </InputGroup.Append>
    </InputGroup>
  </span>
}

export default SrcApiKeyLink
