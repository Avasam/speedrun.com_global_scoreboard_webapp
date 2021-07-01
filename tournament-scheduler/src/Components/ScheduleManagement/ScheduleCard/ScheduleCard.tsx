import { Box, Button, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Stack, Typography } from '@material-ui/core'
import { ArrowDownward, ArrowUpward, DeleteForever } from '@material-ui/icons'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import type { MoveToGroupMenuProps } from './MoveToGroupMenu'
import MoveToGroupMenu from './MoveToGroupMenu'
import type { IOrderableProps } from 'src/Models/IOrderable'
import type { Schedule } from 'src/Models/Schedule'
import copyToClipboard from 'src/utils/Clipboard'

type ScheduleCardProps = IOrderableProps<Schedule> & MoveToGroupMenuProps & {
  schedule: Schedule
  onDelete: (scheduleId: number) => void
  onEdit: (schedule: Schedule) => void
}

const ScheduleCard = (props: ScheduleCardProps) => {
  const [open, setOpen] = useState(false)

  const handleClose = (confirmed: boolean) => {
    confirmed && props.onDelete(props.schedule.id)
    setOpen(false)
  }

  return <Card component={Stack} direction='row' textAlign='start' justifyContent='space-between' elevation={8}>

    <Box sx={{
      '.MuiCardActions-root': {
        flexWrap: 'wrap',
        whiteSpace: 'nowrap',
        '&>:first-of-type': {
          marginLeft: 1,
          minWidth: 'unset',
        },
      },
    }}>
      <CardContent>
        <Typography variant='h6' component='span' style={{ verticalAlign: 'middle' }}>{props.schedule.name}</Typography>
        <IconButton
          className='error'
          aria-label='delete schedule'
          onClick={() => setOpen(true)}
        ><DeleteForever /></IconButton>

        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>Permanently delete this schedule?</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure that you want to delete &quot;{props.schedule.name}&quot; forever?
              This action will take effect immediatly and is irreversible.
              <strong><i> You will not be able to retrieve this schedule after this point!</i></strong>
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
              <strong>Yes, delete this schedule</strong>
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>

      <CardActions style={{ flexWrap: 'wrap', whiteSpace: 'nowrap' }}>
        <Button
          size='small'
          onClick={() => props.onEdit(props.schedule)}
        >
          Edit
        </Button>
        <Button
          component={RouterLink}
          size='small'
          to={`/view/${props.schedule.id}`}
        >
          Open public page
        </Button>
        <Button
          size='small'
          onClick={() => copyToClipboard(`${props.schedule.registrationLink}`)}
        >
          Copy registration link
        </Button>
      </CardActions>
    </Box>

    <Stack component={CardActions} alignItems='flex-end'>
      <IconButton
        size='small'
        aria-label='move up'
        disabled={props.isFirst}
        onClick={() => props.onMove(props.schedule, -1)}
      ><ArrowUpward /></IconButton>
      <IconButton
        size='small'
        aria-label='move down'
        disabled={props.isLast}
        onClick={() => props.onMove(props.schedule, 1)}
      ><ArrowDownward /></IconButton>
      {props.possibleGroups.length > 0 && <MoveToGroupMenu {...props} />}
    </Stack>

  </Card >
}

export default ScheduleCard
