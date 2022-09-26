import type { ChangeEventHandler, FormEvent } from 'react'
import { useState } from 'react'
import { Button, Form, InputGroup } from 'react-bootstrap'

import Configs from 'src/Models/Configs'
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
            aria-describedby='update user name or id'
            data-lpignore='true'
            disabled={!Configs.bypassUpdateRestrictions &&
              (props.updating || !props.currentUser)}
            onChange={handleOnChange}
            placeholder={props.currentUser ? 'Name or ID' : 'Please log in first'}
            required
          />
          <Button
            disabled={!Configs.bypassUpdateRestrictions &&
              (props.updating || !props.currentUser || !updateUserNameOrId)}
            id='update-runner-button'
            onClick={() => props.onUpdate(updateUserNameOrId.trim())}
            type='submit'
          >
            Update
          </Button>
        </InputGroup>
      </Form.Group>
    </Form>
  )
}

export default UpdateRunnerForm
