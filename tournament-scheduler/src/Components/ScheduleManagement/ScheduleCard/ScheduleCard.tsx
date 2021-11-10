import ArrowDownward from '@mui/icons-material/ArrowDownward'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import DeleteForever from '@mui/icons-material/DeleteForever'
import { Box, Button, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import type { MoveToGroupMenuProps } from './MoveToGroupMenu'
import MoveToGroupMenu from './MoveToGroupMenu'
import type { IOrderableProps } from 'src/Models/IOrderable'
import type { Schedule } from 'src/Models/Schedule'
import copyToClipboard from 'src/utils/clipboard'

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

  return <Card
    component={Stack}
    direction='row'
    elevation={8}
    justifyContent='space-between'
    textAlign='start'
  >

    <Box sx={{
      '.MuiCardActions-root': {
        flexWrap: 'wrap',
        whiteSpace: 'nowrap',
        '&>:first-of-type': {
          marginLeft: 1,
          minWidth: 'unset',
        },
      },
    }}
    >
      <CardContent>
        <Typography
          component='span'
          style={{ verticalAlign: 'middle' }}
          variant='h6'
        >
          {props.schedule.name}
        </Typography>
        <IconButton
          aria-label='delete schedule'
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
          <DialogTitle id='alert-dialog-title'>Permanently delete this schedule?</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure that you want to delete &quot;
              {props.schedule.name}
              &quot; forever?
              This action will take effect immediatly and is irreversible.
              <strong><i> You will not be able to retrieve this schedule after this point!</i></strong>
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
              <strong>Yes, delete this schedule</strong>
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>

      <CardActions style={{ flexWrap: 'wrap', whiteSpace: 'nowrap' }}>
        <Button
          onClick={() => props.onEdit(props.schedule)}
          size='small'
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
          onClick={() => copyToClipboard(`${props.schedule.registrationLink}`)}
          size='small'
        >
          Copy registration link
        </Button>
      </CardActions>
    </Box>

    <Stack alignItems='flex-end' component={CardActions}>
      <IconButton
        aria-label='move up'
        disabled={props.isFirst}
        onClick={() => props.onMove(props.schedule, -1)}
        size='small'
      >
        <ArrowUpward />
      </IconButton>
      <IconButton
        aria-label='move down'
        disabled={props.isLast}
        onClick={() => props.onMove(props.schedule, 1)}
        size='small'
      >
        <ArrowDownward />
      </IconButton>
      {props.possibleGroups.length > 0 && <MoveToGroupMenu {...props} />}
    </Stack>

  </Card >
}

export default ScheduleCard
