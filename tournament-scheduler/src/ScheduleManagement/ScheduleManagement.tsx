import React, { useEffect, useState } from 'react'

import { Schedule, ScheduleDto, createDefaultSchedule } from '../models/Schedule'
import User from '../models/User'
import { Button, Card, CardActions, CardContent, Container, IconButton, Theme, makeStyles } from '@material-ui/core'
import { Styles } from '@material-ui/core/styles/withStyles'
import { ScheduleWizard } from './ScheduleWizard'

const getSchedules = () =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/schedules`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
  })
    .then(res => res.status >= 400 && res.status < 600
      ? Promise.reject(res)
      : res)
    .then(res =>
      res.json().then((scheduleDtos: ScheduleDto[] | undefined) =>
        scheduleDtos?.map(scheduleDto => new Schedule(scheduleDto))))

const postSchedules = (schedule: ScheduleDto) =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/schedules`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
    body: JSON.stringify(schedule),
  })
    .then(res => res.status >= 400 && res.status < 600
      ? Promise.reject(res)
      : res)
    .then(res => res.json())

const putSchedule = (schedule: ScheduleDto) =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/schedules/${schedule.id}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
    body: JSON.stringify(schedule),
  })
    .then(res => res.status >= 400 && res.status < 600
      ? Promise.reject(res)
      : res)

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

const ScheduleManagement: React.FC<ScheduleManagementProps> = (props: ScheduleManagementProps) => {
  const [schedules, setSchedules] = useState<Schedule[] | undefined>(undefined)
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | undefined>(undefined)

  const editSchedule = (schedule?: Schedule) =>
    setCurrentSchedule(schedule)

  const handleDelete = (scheduleId: number) =>
    deleteSchedule(scheduleId)
      .then(() => setSchedules(schedules?.filter(schedule => schedule.id !== scheduleId)))
      .catch(console.error)

  const handleSave = (schedule: ScheduleDto) => {
    console.log(schedule.id)
    const savePromise = schedule.id === -1
      ? postSchedules(schedule)
      : putSchedule(schedule)
    savePromise
      .then(() => {
        getSchedules()
          .then((res: Schedule[] | undefined) => {
            console.log(res)
            setSchedules(res)
          })
          .catch(console.error)
        setCurrentSchedule(undefined)
      })
      .catch(console.error)
  }

  useEffect(() => {
    getSchedules()
      .then((res: Schedule[] | undefined) => {
        console.log(res)
        setSchedules(res)
      })
      .catch(console.error)
  }, [])

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
  const classes = makeStyles((styles as Styles<Theme, {}, 'card' | 'cardActions'>))()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => console.log('text copied to clipboard successfully'),
      (err) => console.error(err),
    )
  }

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
        onClick={() => editSchedule(createDefaultSchedule())}
      >
        Create new Schedule
      </Button>
      {schedules && schedules.map(schedule =>
        <Card className={classes.card} key={schedule.id}>
          <CardContent>
            <span>{schedule.name}</span>
            <IconButton
              style={{ color: 'red' }}
              color="secondary"
              aria-label="delete schedule"
              component="button"
              onClick={() => handleDelete(schedule.id)}
            >
              &times;
            </IconButton>
          </CardContent>
          <CardActions className={classes.cardActions}>
            <Button
              size="small"
              onClick={() => editSchedule(schedule)}
            >
              Edit
            </Button>
            <Button
              size="small"
              onClick={() => window.location.href = `${window.location.pathname}?view=${schedule.id}`}
            >
              Open public page
            </Button>
            <Button
              size="small"
              onClick={() => copyToClipboard(`${schedule.registrationLink}`)}
            >
              Copy registration link
            </Button>
          </CardActions>
        </Card>
      )}
    </Container>
}

export default ScheduleManagement
