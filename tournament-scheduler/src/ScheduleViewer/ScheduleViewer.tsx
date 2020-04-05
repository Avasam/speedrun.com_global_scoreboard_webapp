import { Container, List, ListItem, ListItemText, createStyles, makeStyles } from '@material-ui/core'
import React, { FC, useEffect, useState } from 'react'
import { Schedule, ScheduleDto } from '../models/Schedule'
import DateFnsUtils from '@date-io/moment'
import { TimeSlot } from '../models/TimeSlot'
import { apiGet } from '../fetchers/api'
import moment from 'moment'

interface ScheduleRegistrationProps {
  scheduleId: number
}

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      backgroundColor: theme.palette.background.paper,
      margin: theme.spacing(0.5),
    },
    rootHeader: {
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightBold,
      backgroundColor: theme.palette.background.default,
      paddingTop: theme.spacing(0.5),
      paddingBottom: theme.spacing(0.5),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
    nested: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
    item: {
      paddingTop: 0,
      paddingBottom: 0,
    },
  }),
)

const getSchedule = (id: number) =>
  apiGet(`schedules/${id}`)
    .then(res =>
      res.json().then((scheduleDto: ScheduleDto) => new Schedule(scheduleDto)))

const ScheduleRegistration: FC<ScheduleRegistrationProps> = (props: ScheduleRegistrationProps) => {
  const [schedule, setSchedule] = useState<Schedule | undefined>(undefined)
  const classes = useStyles()

  useEffect(() => {
    getSchedule(props.scheduleId)
      .then((schedule: Schedule) => {
        schedule.timeSlots.sort(TimeSlot.compareFn)
        setSchedule(schedule)
      })
      .catch(console.error)
  }, [props.scheduleId])

  return <Container>
    {!schedule
      ? <div>Sorry. `<code>{props.scheduleId}</code>` is not a valid schedule id.</div>
      : <div style={{ textAlign: 'left', width: 'fit-content', margin: 'auto' }}>
        <label>Schedule for: {schedule.name}</label>
        <span style={{ display: 'block' }}>All dates and times are given in your local timezone.</span>
        {!schedule.active && <div><br />This schedule is currently inactive and registration is closed.</div>}
        {schedule.timeSlots.map(timeSlot =>
          <List
            key={`timeslot-${timeSlot.id}`}
            className={classes.root}
            subheader={
              <ListItemText
                className={classes.rootHeader}
                primary={moment(timeSlot.dateTime).format(`ddd ${new DateFnsUtils().dateTime24hFormat}`)}
                secondary={
                  `(${timeSlot.registrations.length} / ${timeSlot.maximumEntries}` +
                  ` entr${timeSlot.registrations.length === 1 ? 'y' : 'ies'}${timeSlot.dateTime <= new Date() ? ', past deadline' : ''})`
                }
              />
            }
          >
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {timeSlot.registrations.length === 0
                ? <div className={classes.nested}>No one registered for this time slot yet.</div>
                : timeSlot.registrations.map(registration =>
                  <List
                    key={`registration-${registration.id}`}
                    component="div"
                    disablePadding
                    subheader={
                      <ListItemText secondary="Participants" />
                    }
                    className={classes.nested}
                  >
                    {registration.participants.map((participant, index) =>
                      <ListItem key={`participant-${index}`} className={classes.item}>
                        <ListItemText primary={`${index + 1}. ${participant}`} />
                      </ListItem>
                    )}
                  </List>
                )}
            </div>
          </List>
        )}
      </div>
    }

  </Container>
}

export default ScheduleRegistration
