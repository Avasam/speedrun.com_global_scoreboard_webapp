import { Button, ButtonGroup, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Input, Stack, Typography, useTheme } from '@material-ui/core'
import { ArrowDownward, ArrowUpward, CancelPresentation } from '@material-ui/icons'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import type { IOrderableProps } from 'src/Models/IOrderable'
import type { ScheduleGroup } from 'src/Models/Schedule'

type ScheduleGroupCardProps = IOrderableProps<ScheduleGroup> & {
  group: ScheduleGroup
  children: ReactElement | ReactElement[]
  onDelete: (groupId: number) => void
  onEdit: (groupName: string) => void
}

const ScheduleGroupCard = (props: ScheduleGroupCardProps) => {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState(props.group.name)
  const theme = useTheme()

  const handleClose = (confirmed: boolean) => {
    confirmed && props.onDelete(props.group.id)
    setOpen(false)
  }

  const handleGroupNameChange = (newName: string) => setGroupName(newName)
  const handleSaveGroupName = () => props.onEdit(groupName)

  return <>
    <Card component={Stack} direction='row' textAlign='start' justifyContent='space-between'>
      <CardContent style={{ flex: 1, paddingRight: 0 }}>
        <Stack direction='row' alignItems='flex-start'>

          <Stack direction='row' flexWrap='wrap' alignItems='center' flex='1'>
            <Typography variant='h5' flex='1'>
              <Input
                value={groupName}
                required
                error={props.group.name === ''}
                sx={{ ...theme.typography.h5, width: '100%', minWidth: '200px' }}
                onChange={event => handleGroupNameChange(event.currentTarget.value)}
              />
            </Typography>
            <ButtonGroup
              size='small'
              disabled={props.group.name === groupName}
              sx={{ visibility: props.group.name === groupName ? 'hidden' : 'visible' }}
            >
              <Button disabled={props.group.name === ''} onClick={handleSaveGroupName}>Save</Button>
              <Button color='error' onClick={() => handleGroupNameChange(props.group.name)}>Reset</Button>
            </ButtonGroup>

            <Button
              component={RouterLink}
              size='small'
              to={`/view/group/${props.group.id}`}
            >
              Open public group page
            </Button>
          </Stack>

          <IconButton
            sx={{ marginTop: -0.5 }}
            className='error'
            aria-label='delete group'
            onClick={() => setOpen(true)}
          ><CancelPresentation /></IconButton>
        </Stack>

        <Stack spacing={2} >
          {props.children}
        </Stack>
      </CardContent>
      <Stack component={CardActions} alignItems='flex-end'>
        <IconButton
          size='small'
          aria-label='move up'
          disabled={props.isFirst}
          onClick={() => props.onMove(props.group, -1)}
        ><ArrowUpward /></IconButton>
        <IconButton
          size='small'
          aria-label='move down'
          disabled={props.isLast}
          onClick={() => props.onMove(props.group, 1)}
        ><ArrowDownward /></IconButton>
      </Stack>
    </Card>

    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle id='alert-dialog-title'>Permanently delete this group?</DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description'>
          Are you sure that you want to delete &quot;{props.group.name}&quot; forever?
          This action will take effect immediatly and is irreversible.
          <strong><i> All schedules contained will be ungrouped.</i></strong>
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
          <strong>Yes, delete this group</strong>
        </Button>
      </DialogActions>
    </Dialog>
  </>
}

export default ScheduleGroupCard
