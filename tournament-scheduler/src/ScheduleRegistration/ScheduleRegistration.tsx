import React, { Fragment, useState, useEffect } from 'react'
import { Container, Card, CardContent, FormGroup, TextField, CardActions, Button } from '@material-ui/core';
import { Schedule } from '../models/Schedule';

interface ScheduleRegistrationProps {
  registrationLink: string
}

const getSchedule = (id: number, registrationKey: string) =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/schedules/${id}?registrationKey=${registrationKey}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
  }).then(res => res.json())

const ScheduleRegistration: React.FC<ScheduleRegistrationProps> = (props: ScheduleRegistrationProps) => {
  const [schedule, setSchedule] = useState<Schedule | undefined>(undefined);

  useEffect(() => {
    const splitIndex = props.registrationLink.indexOf('-')
    const id = parseInt(props.registrationLink.substr(0, splitIndex))
    const registrationKey = props.registrationLink.substr(splitIndex + 1)
    getSchedule(id, registrationKey).then(setSchedule)
  }, [])

  return <Container>
    {!schedule
      ? <div>Sorry. '<code>{props.registrationLink}</code>' does not lead to an existing registration form.</div>
      : <Card>
        <CardContent style={{ textAlign: 'left' }}>
          <div>Schedule: {schedule.name}</div>
          <div>Time slot count: {schedule.timeSlots.length}</div>
          {!schedule.active
            ? <div><br />Sorry. This schedule is currently inactive and registration is closed.</div>
            : schedule.timeSlots.map(timeSlot =>
              <Fragment key={`timeslot-${timeSlot.id}`}>
                <br />
                <div>Time slot: {timeSlot.dateTime}</div>
                <div>Entries: ??? / {timeSlot.maximumEntries}</div>
                <div>Participant per entry: {timeSlot.participantsPerEntry}</div>
                <FormGroup>
                  {(Array.apply(null, Array(timeSlot.participantsPerEntry))).map((_, index) =>
                    <TextField
                      key={`timeslot-${timeSlot.id}-participant-${index}`}
                      label={`Participant ${index + 1}'s name`}
                      onChange={event => { }}
                    />)}
                </FormGroup>
              </Fragment>
            )
          }
        </CardContent>
        <CardActions>
          <Button
            size="small"
            onClick={() => window.location.href = window.location.pathname}
          >
            Ok
        </Button>
        </CardActions>
      </Card>
    }

  </Container>
}

export default ScheduleRegistration;
