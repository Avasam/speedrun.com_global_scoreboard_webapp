import React, { useState, useEffect } from 'react';

import { createDefaultSchedule, Schedule, ScheduleDto } from '../models/Schedule';
import User from '../models/User';
import { Card, CardContent, CardActions, Button, makeStyles, Theme, Container } from '@material-ui/core';
import { Styles } from '@material-ui/core/styles/withStyles';
import { ScheduleWizard } from './ScheduleWizard'

const getSchedules = () =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/schedules`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
  }).then(res =>
    res.json().then((scheduleDtos: ScheduleDto[] | undefined) =>
      scheduleDtos?.map(scheduleDto => new Schedule(scheduleDto))))

type ScheduleManagementProps = {
  currentUser: User
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = (props: ScheduleManagementProps) => {
  const [schedules, setSchedules] = useState<Schedule[] | undefined>(undefined)
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | undefined>(undefined)

  const editSchedule = (schedule?: Schedule) => {
    setCurrentSchedule(schedule)
  }

  const handleSave = (schedule: Schedule) => {
    console.log(schedule)
    setCurrentSchedule(undefined)
  }

  useEffect(() => {
    getSchedules()
      .then((res: Schedule[] | undefined) => {
        console.log(res)
        setSchedules(res)
      })
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
  const classes = makeStyles((styles as Styles<Theme, {}, "card" | "cardActions">))()

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
      <div style={{ marginTop: styles.card.marginTop }}>
        This is where the user '{props.currentUser.name}' can see and edit their schedule forms
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
            {schedule.name}
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
              onClick={() => copyToClipboard(`${schedule.registrationLink}`)}
            >
              Copy registration link
            </Button>
          </CardActions>
        </Card>
      )}
    </Container>
}

export default ScheduleManagement;
