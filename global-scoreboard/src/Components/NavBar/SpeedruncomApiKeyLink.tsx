import type { ChangeEventHandler } from 'react'
import { useState } from 'react'
import { Button, FormControl, InputGroup } from 'react-bootstrap'

const SpeedruncomApiKeyLink = () => {
  const [speedruncomNameInput, setSpeedruncomNameInput] = useState('')

  const handleNameChange: ChangeEventHandler<HTMLInputElement> = event =>
    setSpeedruncomNameInput(event.currentTarget.value)

  return <InputGroup as='span' className='speedruncom-api-key-link'>
    <Button
      as='a'
      disabled={speedruncomNameInput.length === 0}
      href={`https://www.speedrun.com/${speedruncomNameInput}/settings/api`}
      target='speedruncom'
      variant='outline-secondary'
    >
      www.speedrun.com/
    </Button>
    <FormControl
      aria-describedby='speedrun.com name'
      data-lpignore='true'
      name='speedruncom-name'
      onChange={handleNameChange}
      placeholder='SR.C name'
      style={{ minWidth: 85 }}
      type='text'
    />
    <Button
      as='a'
      disabled={speedruncomNameInput.length === 0}
      href={`https://www.speedrun.com/${speedruncomNameInput}/settings/api`}
      target='speedruncom'
      variant='outline-secondary'
    >
      /settings/api/
    </Button>
  </InputGroup>
}

export default SpeedruncomApiKeyLink
