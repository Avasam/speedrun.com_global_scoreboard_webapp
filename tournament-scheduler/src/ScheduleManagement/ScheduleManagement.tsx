import { Button, Card, CardActions, CardContent, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Theme, makeStyles } from '@material-ui/core'
import React, { FC, useEffect, useState } from 'react'
import { Schedule, ScheduleDto, createDefaultSchedule } from '../models/Schedule'
import { apiGet, apiPost, apiPut } from '../fetchers/api'
import DeleteForever from '@material-ui/icons/DeleteForever'
import { ScheduleWizard } from './ScheduleWizard'
import { Styles } from '@material-ui/core/styles/withStyles'
import User from '../models/User'

const getSchedules = () =>
  apiGet('schedules')
    .then(res =>
      res.json().then((scheduleDtos: ScheduleDto[] | undefined) =>
        scheduleDtos?.map(scheduleDto => new Schedule(scheduleDto))))

const postSchedules = (schedule: ScheduleDto) =>
  apiPost('schedules', schedule)
    .then(res => res.json())

const putSchedule = (schedule: ScheduleDto) =>
  apiPut(`schedules/${schedule.id}`, schedule)

const deleteSchedule = (scheduleId: number) =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
  })
    .then(res => res.status >= 400 && res.status < 600
      ? Promise.reject(res)
      : res)

type ScheduleManagementProps = {
  currentUser: User
}

const styles = {
  card: {
    width: '100%',
    textAlign: 'start',
    marginTop: '16px',
    marginBottom: '16px',
  },
  cardActions: {
    display: 'flex',
  },
}

const ScheduleManagement: FC<ScheduleManagementProps> = (props: ScheduleManagementProps) => {
  const [schedules, setSchedules] = useState<Schedule[] | undefined>(undefined)
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | undefined>(undefined)

  const handleEdit = (schedule?: Schedule) =>
    setCurrentSchedule(schedule)

  const handleDelete = (scheduleId: number) =>
    deleteSchedule(scheduleId)
      .then(() => setSchedules(schedules?.filter(schedule => schedule.id !== scheduleId)))
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
        variant="contained"
        color="primary"
        onClick={() => handleEdit(createDefaultSchedule())}
      >
        Create new Schedule
      </Button>
      {schedules && schedules.map(schedule =>
        <ScheduleCard
          key={schedule.id}
          onDelete={handleDelete}
          onEdit={handleEdit}
          schedule={schedule}
        />
      )}
    </Container>
}

type ScheduleCardProps = {
  schedule: Schedule
  onDelete: (scheduleId: number) => void
  onEdit: (schedule: Schedule) => void
}

const ScheduleCard: FC<ScheduleCardProps> = (props: ScheduleCardProps) => {
  const classes = makeStyles((styles as Styles<Theme, {}, 'card' | 'cardActions'>))()
  const [open, setOpen] = React.useState(false)

  const handleClose = (confirmed: boolean) => {
    confirmed && props.onDelete(props.schedule.id)
    setOpen(false)
  }

  const oldCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'  // Avoid scrolling to bottom
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, 99999) // For mobile devices

    try {
      const successful = document.execCommand('copy')
      if (!successful) throw new Error('execCommand failed')
      console.info('text copied to clipboard successfully using textarea')
    } catch (err) {
      alert(`Could not copy text: ${err}`)
      console.error('Could not copy text using textarea: ', err)
    }

    document.body.removeChild(textArea)
  }

  const copyToClipboard = (text: string) => {
    if (!navigator.clipboard) {
      oldCopyToClipboard(text)
      return
    }

    navigator.clipboard.writeText(text).then(
      () => console.info('text copied to clipboard successfully'),
      (err) => {
        alert(`Could not copy text: ${err}`)
        console.error('Could not copy text: ', err)
      },
    )
  }

  return <Card className={classes.card}>
    <CardContent>
      <span>{props.schedule.name}</span>
      <IconButton
        style={{ color: 'red' }}
        color="secondary"
        aria-label="delete schedule"
        component="button"
        onClick={() => setOpen(true)}
      ><DeleteForever /></IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Permanently delete this schedule?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
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
            variant="outlined"
            color="secondary"
            style={{ color: 'red' }}
          >
            <strong>Yes, delete this schedule</strong>
          </Button>
        </DialogActions>
      </Dialog>

    </CardContent>
    <CardActions className={classes.cardActions}>
      <Button
        size="small"
        onClick={() => props.onEdit(props.schedule)}
      >
        Edit
      </Button>
      <Button
        size="small"
        onClick={() => {
          localStorage.removeItem('register')
          window.location.href = `${window.location.pathname}?view=${props.schedule.id}`
        }}
      >
        Open public page
      </Button>
      <Button
        size="small"
        onClick={() => copyToClipboard(`${props.schedule.registrationLink}`)}
      >
        Copy registration link
      </Button>
    </CardActions>
  </Card>
}

export default ScheduleManagement
