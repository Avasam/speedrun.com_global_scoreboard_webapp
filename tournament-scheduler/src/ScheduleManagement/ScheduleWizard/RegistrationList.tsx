import { Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, List, ListItem, ListItemText, TextField } from '@material-ui/core'
import { DeleteForever } from '@material-ui/icons'
import type { FC } from 'react'
import { useState } from 'react'

import type { RegistrationProxy } from '../../models/Registration'
import type Registration from '../../models/Registration'

type RegistrationListProps = {
  registration: RegistrationProxy
  index: number
  participantsPerEntry: number
  onDelete: (index: number) => void
  onSave: (registration: Registration) => void
  onReset: (index: number) => void
  onParticipantNameChange: (registration: RegistrationProxy, participantIndex: number, name: string) => void
}

const RegistrationList: FC<RegistrationListProps> = (props: RegistrationListProps) => {
  const [open, setOpen] = useState(false)

  const handleClose = (confirmed: boolean) => {
    confirmed && props.onDelete(props.index)
    setOpen(false)
  }

  return <List
    component='div'
    dense={true}
    disablePadding
    subheader={
      <div>
        <ListItemText
          style={{ marginTop: 0, textAlign: 'left', display: 'inline-block' }}
          secondary={
            <span>
              Entry #{props.index + 1}
            </span>
          }
        />
        <ButtonGroup
          style={{ marginLeft: '16px' }}
          size='small'
          disabled={!props.registration.hasChanged}
        >
          <Button color='primary' onClick={() => props.onSave(props.registration)}>Save</Button>
          <Button color='error' onClick={() => props.onReset(props.index)}>Reset</Button>
        </ButtonGroup>
        <IconButton
          className='error'
          aria-label='remove time slot'
          onClick={() => setOpen(true)}
        ><DeleteForever /></IconButton>

        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>Permanently delete this entry?</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure that you want to delete entry #{props.index + 1} of this time slot forever?
              This action will take effect immediatly and is irreversible.
              <strong>
                <i> Make sure you have notified the participants,
                  as you will not be able to retrieve this entry after this point!</i>
              </strong>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleClose(false)} autoFocus>
              Cancel
            </Button>
            <Button
              onClick={() => handleClose(true)}
              variant='outlined'
              color='error'
            >
              <strong>Yes, delete this entry</strong>
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    }
  >
    {[
      ...props.registration.participants,
      ...Array.from(
        { length: Math.max(0, props.participantsPerEntry - props.registration.participants.length) },
        () => ''
      ),
    ]
      .map((participant: string, index) =>
        <ListItem
          key={`participant-${index}`}
          style={{
            alignItems: 'baseline',
            padding: '0 16px',
            color: index >= props.participantsPerEntry ? 'red' : undefined,
          }}>
          <span>{index + 1}.&nbsp;</span>
          <TextField
            error={index >= props.participantsPerEntry}
            style={{ marginTop: 0 }}
            value={participant}
            onChange={event => props.onParticipantNameChange(
              props.registration,
              index,
              event.target.value
            )}
          />
        </ListItem>)}
  </List>
}

export default RegistrationList
