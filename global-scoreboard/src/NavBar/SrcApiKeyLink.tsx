import { BsPrefixProps, ReplaceProps } from 'react-bootstrap/helpers'
import { Button, Form, FormControlProps, InputGroup } from 'react-bootstrap'
import React, { FC, FormEvent, useState } from 'react'

const SrcApiKeyLink: FC = () => {
  const [srcNameInput, setSrcNameInput] = useState('')

  const handleNameChange = (event: FormEvent<ReplaceProps<'input', BsPrefixProps<'input'> & FormControlProps>>) =>
    setSrcNameInput(event.currentTarget.value || '')

  return <span className='src-api-key-link'>
    <InputGroup>
      <InputGroup.Prepend>
        <Button
          disabled={!srcNameInput.length}
          as="a"
          variant="outline-secondary"
          href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
          target="src"
        >www.speedrun.com/</Button>
      </InputGroup.Prepend>
      <Form.Control
        type="text"
        name="src-name"
        placeholder="SRC name"
        aria-describedby="src name"
        onChange={handleNameChange}
      />
      <InputGroup.Append>
        <Button
          disabled={!srcNameInput.length}
          as="a"
          variant="outline-secondary"
          href={`https://www.speedrun.com/${srcNameInput}/settings/api`}
          target="src"
        >/settings/api/</Button>
      </InputGroup.Append>
    </InputGroup>
  </span>
}

export default SrcApiKeyLink
