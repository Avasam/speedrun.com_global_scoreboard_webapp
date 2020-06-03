
import { Button, Form, InputGroup } from 'react-bootstrap'
import React, { useState } from 'react'
import Player from '../models/Player'

type UpdateRunnerFormProps = {
  currentUser: Player | null
  updating: boolean
  onUpdate: (runnerNameOrId: string) => void
}

const UpdateRunnerForm = (props: UpdateRunnerFormProps) => {
  const [updateUserNameOrId, setUpdateUserNameOrId] = useState('')

  const handleOnChange: React.ChangeEventHandler<HTMLInputElement> = event =>
    setUpdateUserNameOrId(event.currentTarget.value)

  return (
    <Form onSubmit={(event: React.FormEvent<HTMLFormElement>) => event.preventDefault()}>
      <Form.Group controlId="update-user">
        <Form.Label>Update runner:</Form.Label>
        <InputGroup>
          <Form.Control
            required
            placeholder={props.currentUser ? 'Name or ID' : 'Please log in first'}
            onChange={handleOnChange}
            disabled={window.process.env.REACT_APP_BYPASS_UPDATE_RESTRICTIONS !== 'true' && !props.currentUser}
            aria-describedby="update user name or id"
          />
          <InputGroup.Append>
            <Button
              id="update-runner-button"
              type="submit"
              disabled={window.process.env.REACT_APP_BYPASS_UPDATE_RESTRICTIONS !== 'true' &&
                (props.updating || !props.currentUser || !updateUserNameOrId)}
              onClick={() => props.onUpdate(updateUserNameOrId.trim())}
            >Update</Button>
          </InputGroup.Append>
        </InputGroup>
      </Form.Group>
    </Form>
  )
}

export default UpdateRunnerForm
