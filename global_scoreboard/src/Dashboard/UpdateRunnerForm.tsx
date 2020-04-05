
import { BsPrefixProps, ReplaceProps } from 'react-bootstrap/helpers'
import { Button, Form, FormControlProps, InputGroup } from 'react-bootstrap'
import React, { FormEvent, useState } from 'react'
import Player from '../models/Player'

type UpdateRunnerFormProps = {
  currentUser: Player | null
  onUpdate: (updatedRunner: Player) => void
}

const UpdateRunnerForm = (props: UpdateRunnerFormProps) => {

  const [updateUserNameOrId, setUpdateUserNameOrId] = useState('')

  const updateRunner = () => props.onUpdate({
    rank: -1,
    name: 'UpdatedPlayer',
    score: 500,
    lastUpdate: new Date(),
    userId: updateUserNameOrId,
  })

  const handleOnChange = (event: FormEvent<ReplaceProps<'input', BsPrefixProps<'input'> & FormControlProps>>) =>
    setUpdateUserNameOrId(event.currentTarget.value || '')

  return (
    <Form>
      <Form.Group controlId="update-user">
        <Form.Label>Update runner:</Form.Label>
        <InputGroup>
          <Form.Control
            required
            placeholder={props.currentUser ? 'Name or ID' : 'Please log in first'}
            onChange={handleOnChange}
            disabled={!props.currentUser}
            aria-describedby="update user name or id"
          />
          <InputGroup.Append>
            <Button id="update-runner-button"
              disabled={!props.currentUser}
              onClick={updateRunner}
            >Update</Button>
          </InputGroup.Append>
        </InputGroup>
      </Form.Group>
    </Form>
  )
}

export default UpdateRunnerForm
