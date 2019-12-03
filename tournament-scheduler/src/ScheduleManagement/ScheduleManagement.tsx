import React, { useState, useEffect } from 'react';

import { Schedule, ScheduleDto } from '../models/Schedule';
import User from '../models/User';
import { Card, CardContent, CardActions, Button, makeStyles, Theme, Container } from '@material-ui/core';
import { Styles } from '@material-ui/core/styles/withStyles';

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
  const [schedules, setSchedules] = useState<Schedule[] | undefined>(undefined);

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

  return <Container>
    <div style={{ marginTop: styles.card.marginTop }}>This is where the user '{props.currentUser.name}' can see and edit their schedule forms</div>
    {schedules && schedules.map(schedule =>
      <Card className={classes.card} key={schedule.id}>
        <CardContent>
          {schedule.name}
        </CardContent>
        <CardActions className={classes.cardActions}>
          <Button size="small">Edit</Button>
          <Button size="small" onClick={() => copyToClipboard(`${schedule.registrationLink}`)}>Copy registration link</Button>
        </CardActions>
      </Card>
    )}
  </Container>
}

export default ScheduleManagement;
