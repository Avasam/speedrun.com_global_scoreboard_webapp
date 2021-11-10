import DeleteForever from '@mui/icons-material/DeleteForever'
import { Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, List, ListItem, ListItemText, TextField } from '@mui/material'
import { useState } from 'react'

import type { RegistrationProxy } from 'src/Models/Registration'
import type Registration from 'src/Models/Registration'

type RegistrationListProps = {
  registration: RegistrationProxy
  index: number
  participantsPerEntry: number
  onDelete: (index: number) => void
  onSave: (registration: Registration) => void
  onReset: (index: number) => void
  onParticipantNameChange: (registration: RegistrationProxy, participantIndex: number, name: string) => void
}

const RegistrationList = (props: RegistrationListProps) => {
  const [open, setOpen] = useState(false)

  const handleClose = (confirmed: boolean) => {
    confirmed && props.onDelete(props.index)
    setOpen(false)
  }

  return (
    <List
      component='div'
      dense
      subheader={
        <div>
          <ListItemText
            secondary={
              <span>
                Entry #
                {props.index + 1}
              </span>
            }
            style={{ marginTop: 0, textAlign: 'left', display: 'inline-block' }}
          />
          <ButtonGroup
            disabled={!props.registration.hasChanged}
            size='small'
            sx={{ marginLeft: 2 }}
          >
            <Button onClick={() => props.onSave(props.registration)}>Save</Button>
            <Button color='error' onClick={() => props.onReset(props.index)}>Reset</Button>
          </ButtonGroup>
          <IconButton
            aria-label='remove time slot'
            color='error'
            onClick={() => setOpen(true)}
            size='large'
          >
            <DeleteForever />
          </IconButton>

          <Dialog
            aria-describedby='alert-dialog-description'
            aria-labelledby='alert-dialog-title'
            onClose={handleClose}
            open={open}
          >
            <DialogTitle id='alert-dialog-title'>Permanently delete this entry?</DialogTitle>
            <DialogContent>
              <DialogContentText id='alert-dialog-description'>
                Are you sure that you want to delete entry #
                {props.index + 1}
                {' '}
                of this time slot forever?
                This action will take effect immediatly and is irreversible.
                {' '}

                <strong>
                  <i>
                    Make sure you have notified the participants,
                    as you will not be able to retrieve this entry after this point!
                  </i>
                </strong>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <Button autoFocus onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                color='error'
                onClick={() => handleClose(true)}
                variant='outlined'
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
            key={`participant-${participant}`}
            style={{
              alignItems: 'baseline',
              padding: '0 16px',
              color: index >= props.participantsPerEntry ? 'red' : undefined,
            }}
          >
            <span>{`${index + 1}. `}</span>
            <TextField
              error={index >= props.participantsPerEntry}
              onChange={event => props.onParticipantNameChange(
                props.registration,
                index,
                event.target.value
              )}
              style={{ marginTop: 0 }}
              value={participant}
            />
          </ListItem>)}
    </List>
  )
}

export default RegistrationList
