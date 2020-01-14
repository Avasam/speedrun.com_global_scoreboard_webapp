import React, { useEffect, useState } from 'react'
import { Container } from '@material-ui/core'
import DateFnsUtils from '@date-io/moment'
import { Schedule, ScheduleDto } from '../models/Schedule'
import moment from 'moment'

interface ScheduleRegistrationProps {
  scheduleId: number
}

const getSchedule = (id: number) =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/schedules/${id}`, {
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
      res.json().then((scheduleDto: ScheduleDto) => new Schedule(scheduleDto)))

const ScheduleRegistration: React.FC<ScheduleRegistrationProps> = (props: ScheduleRegistrationProps) => {
  const [schedule, setSchedule] = useState<Schedule | undefined>(undefined)

  useEffect(() => {
    getSchedule(props.scheduleId)
      .then((schedule: Schedule) => setSchedule(schedule))
      .catch(console.error)
  }, [props.scheduleId])

  return <Container>
    {!schedule
      ? <div>Sorry. `<code>{props.scheduleId}</code>` is not a valid schedule id.</div>
      : <div style={{ textAlign: 'left', width: 'fit-content', margin: 'auto' }}>
        <label>Schedule for: {schedule.name}</label>
        {!schedule.active && <div><br />This schedule is currently inactive and registration is closed.</div>}
        {schedule.timeSlots.map(timeSlot =>
          <div key={`timeslot-${timeSlot.id}`}>
            {
              moment(timeSlot.dateTime).format(new DateFnsUtils().dateTime24hFormat) +
              ` (${timeSlot.registrations.length} / ${timeSlot.maximumEntries}` +
              ` entr${timeSlot.registrations.length === 1 ? 'y' : 'ies'})`
            }
            <ol>
              {timeSlot.registrations.map(registration =>
                <li key={`registration-${registration.id}`}>
                  <ul style={{ listStyleType: 'none' }}>
                    {registration.participants.map((participant, index) =>
                      <li key={`participant-${index}`}>{participant}</li>
                    )}
                  </ul>
                </li>
              )}
            </ol>
          </div>
        )}
      </div>
    }

  </Container>
}

export default ScheduleRegistration
