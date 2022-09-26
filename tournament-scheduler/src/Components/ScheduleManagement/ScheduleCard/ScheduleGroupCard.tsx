import ArrowDownward from '@mui/icons-material/ArrowDownward'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import CancelPresentation from '@mui/icons-material/CancelPresentation'
import { Button, ButtonGroup, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Input, Stack, Typography, useTheme } from '@mui/material'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import type { IOrderableProps } from 'src/Models/IOrderable'
import type { ScheduleGroup } from 'src/Models/ScheduleGroup'

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
    <Card component={Stack} direction='row' justifyContent='space-between' textAlign='start'>
      <CardContent style={{ flex: 1, paddingRight: 0 }}>
        <Stack alignItems='flex-start' direction='row'>

          <Stack alignItems='center' direction='row' flex='1' flexWrap='wrap'>
            <Typography flex='1' variant='h5'>
              <Input
                error={props.group.name === ''}
                onChange={event => handleGroupNameChange(event.currentTarget.value)}
                required
                sx={{ ...theme.typography.h5, width: '100%', minWidth: '200px' }}
                value={groupName}
              />
            </Typography>
            <ButtonGroup
              disabled={props.group.name === groupName}
              size='small'
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
            aria-label='delete group'
            color='error'
            onClick={() => setOpen(true)}
            size='large'
            sx={{ marginTop: -0.5 }}
          >
            <CancelPresentation />
          </IconButton>
        </Stack>

        <Stack spacing={2} >
          {props.children}
        </Stack>
      </CardContent>
      <Stack alignItems='flex-end' component={CardActions}>
        <IconButton
          aria-label='move up'
          disabled={props.isFirst}
          onClick={() => props.onMove(props.group, -1)}
          size='small'
        >
          <ArrowUpward />
        </IconButton>
        <IconButton
          aria-label='move down'
          disabled={props.isLast}
          onClick={() => props.onMove(props.group, 1)}
          size='small'
        >
          <ArrowDownward />
        </IconButton>
      </Stack>
    </Card>

    <Dialog
      aria-describedby='alert-dialog-description'
      aria-labelledby='alert-dialog-title'
      onClose={handleClose}
      open={open}
    >
      <DialogTitle id='alert-dialog-title'>Permanently delete this group?</DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description'>
          Are you sure that you want to delete &quot;
          {props.group.name}
          &quot; forever?
          This action will take effect immediatly and is irreversible.
          <strong><i> All schedules contained will be ungrouped.</i></strong>
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
          <strong>Yes, delete this group</strong>
        </Button>
      </DialogActions>
    </Dialog>
  </>
}

export default ScheduleGroupCard
