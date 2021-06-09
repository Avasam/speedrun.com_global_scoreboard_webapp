import { Button, Card, CardActions, CardContent, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@material-ui/core'
import DeleteForever from '@material-ui/icons/DeleteForever'
import { makeStyles } from '@material-ui/styles'
import type { FC } from 'react'
import { useEffect, useState } from 'react'

import { apiDelete, apiGet, apiPost, apiPut } from '../fetchers/Api'
import type { ScheduleDto } from '../models/Schedule'
import { createDefaultSchedule, Schedule } from '../models/Schedule'
import type User from '../models/User'
import copyToClipboard from '../utils/Clipboard'
import { ScheduleWizard } from './ScheduleWizard/ScheduleWizard'

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
          .then(res => setSchedules(res.reverse()))
          .catch(console.error)
        setCurrentSchedule(undefined)
      })
      .catch(console.error)
  }

  useEffect(() => {
    getSchedules()
      .then(res => setSchedules(res.reverse()))
      .catch(console.error)
  }, [])

  return currentSchedule
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
  // FIXME: Probably have to use styles correctly
  // eslint-disable-next-line @typescript-eslint/ban-types
  const classes = makeStyles(styles)()
  const [open, setOpen] = useState(false)

  const handleClose = (confirmed: boolean) => {
    confirmed && props.onDelete(props.schedule.id)
    setOpen(false)
  }

  return <Card className={classes.card}>
    <CardContent>
      <span>{props.schedule.name}</span>
      <IconButton
        style={{ color: 'red' }}
        color='secondary'
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
            color='secondary'
            style={{ color: 'red' }}
          >
            <strong>Yes, delete this schedule</strong>
          </Button>
        </DialogActions>
      </Dialog>

    </CardContent>
    <CardActions className={classes.cardActions}>
      <Button
        size='small'
        onClick={() => props.onEdit(props.schedule)}
      >
        Edit
      </Button>
      <Button
        size='small'
        onClick={() => {
          localStorage.removeItem('register')
          window.location.href = `${window.location.pathname}?view=${props.schedule.id}`
        }}
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
