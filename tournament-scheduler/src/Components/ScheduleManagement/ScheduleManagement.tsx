import { Button, Card, CardActions, CardContent, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@material-ui/core'
import { DeleteForever } from '@material-ui/icons'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { ScheduleWizard } from './ScheduleWizard/ScheduleWizard'
import { apiDelete, apiGet, apiPost, apiPut } from 'src/fetchers/Api'
import type { ScheduleDto } from 'src/Models/Schedule'
import { createDefaultSchedule, Schedule } from 'src/Models/Schedule'
import type User from 'src/Models/User'
import copyToClipboard from 'src/utils/Clipboard'

const getSchedules = () =>
  apiGet('schedules')
    .then(res =>
      res.json().then((scheduleDtos: ScheduleDto[] | undefined) =>
        scheduleDtos?.map(scheduleDto => new Schedule(scheduleDto)) ?? []))

const postSchedules = (schedule: ScheduleDto) =>
  apiPost('schedules', schedule)
    .then(res => res.json())

const putSchedule = (schedule: ScheduleDto) =>
  apiPut(`schedules/${schedule.id}`, schedule)

const deleteSchedule = (scheduleId: number) =>
  apiDelete(`schedules/${scheduleId}`)

type ScheduleManagementProps = {
  currentUser: User
}

const styles = {
  card: {
    width: '100%',
    marginTop: '16px',
    marginBottom: '16px',
    textAlign: 'start' as const,
  },
  cardActions: {
    display: 'flex',
  },
}

const ScheduleManagement: FC<ScheduleManagementProps> = (props: ScheduleManagementProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | undefined>()

  const handleEdit = (schedule?: Schedule) =>
    setCurrentSchedule(schedule)

  const handleDelete = (scheduleId: number) =>
    deleteSchedule(scheduleId)
      .then(() => setSchedules(schedules.filter(schedule => schedule.id !== scheduleId)))
      .catch(console.error)

  const handleSave = (schedule: ScheduleDto) => {
    const savePromise = schedule.id === -1
      ? postSchedules(schedule)
      : putSchedule(schedule)
    savePromise
      .then(() => {
        getSchedules()
          .then(setSchedules)
          .catch(console.error)
        setCurrentSchedule(undefined)
      })
      .catch(console.error)
  }

  useEffect(() => {
    getSchedules()
      .then(setSchedules)
      .catch(console.error)
  }, [])  return currentSchedule
    ? <ScheduleWizard
      schedule={currentSchedule}
      onSave={handleSave}
      onCancel={() => setCurrentSchedule(undefined)}
    />
    : <Container>
      <div>
        Welcome {props.currentUser.name} ! You can manage your schedules below
      </div>

      <Button
        style={{ marginTop: styles.card.marginTop, width: styles.card.width }}
        variant='contained'
        onClick={() => handleEdit(createDefaultSchedule())}
      >
        Create new Schedule
      </Button>
      {schedules.map(schedule =>
        <ScheduleCard
          key={schedule.id}
          onDelete={handleDelete}
          onEdit={handleEdit}
          schedule={schedule}
        />)}
    </Container>
}

type ScheduleCardProps = {
  schedule: Schedule
  onDelete: (scheduleId: number) => void
  onEdit: (schedule: Schedule) => void
}

const ScheduleCard: FC<ScheduleCardProps> = (props: ScheduleCardProps) => {
  const [open, setOpen] = useState(false)

  const handleClose = (confirmed: boolean) => {
    confirmed && props.onDelete(props.schedule.id)
    setOpen(false)
  }

  return <Card style={styles.card}>
    <CardContent>
      <span>{props.schedule.name}</span>
      <IconButton
        className='error'
        aria-label='delete schedule'
        component='button'
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
    <CardActions sx={styles.cardActions}>
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
  </Card>
}

export default ScheduleManagement
