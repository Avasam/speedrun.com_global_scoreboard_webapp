
import type { ChangeEventHandler, FormEvent } from 'react'
import { useState } from 'react'
import { Button, Form, InputGroup } from 'react-bootstrap'

import type Player from 'src/Models/Player'

export type UpdateRunnerFormProps = {
  currentUser: Player | null
  updating: boolean
  onUpdate: (runnerNameOrId: string) => void
}

const UpdateRunnerForm = (props: UpdateRunnerFormProps) => {
  const [updateUserNameOrId, setUpdateUserNameOrId] = useState('')

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = event =>
    setUpdateUserNameOrId(event.currentTarget.value)

  return (
    <Form onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}>
      <Form.Group className='mb-3' controlId='update-user'>
        <Form.Label>Update runner:</Form.Label>
        <InputGroup>
          <Form.Control
            required
            placeholder={props.currentUser ? 'Name or ID' : 'Please log in first'}
            onChange={handleOnChange}
            disabled={process.env.REACT_APP_BYPASS_UPDATE_RESTRICTIONS !== 'true' &&
              (props.updating || !props.currentUser)}
            aria-describedby='update user name or id'
            data-lpignore='true'
          />
          <Button
            id='update-runner-button'
            type='submit'
            disabled={process.env.REACT_APP_BYPASS_UPDATE_RESTRICTIONS !== 'true' &&
              (props.updating || !props.currentUser || !updateUserNameOrId)}
            onClick={() => props.onUpdate(updateUserNameOrId.trim())}
          >Update</Button>
        </InputGroup>
      </Form.Group>
    </Form>
  )
}

export default UpdateRunnerForm
