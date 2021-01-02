import { Container, List, ListItem, ListItemText, createStyles, makeStyles } from '@material-ui/core'
import React, { FC, useEffect, useState } from 'react'
import { Schedule, ScheduleDto } from '../models/Schedule'
import DateFnsUtils from '@date-io/moment'
import { TimeSlot } from '../models/TimeSlot'
import { apiGet } from '../fetchers/Api'
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
  }))

const getSchedule = (id: number) =>
  apiGet(`schedules/${id}`)
    .then(res =>
      res.json().then((scheduleDto: ScheduleDto) => new Schedule(scheduleDto)))

const ScheduleRegistration: FC<ScheduleRegistrationProps> = (props: ScheduleRegistrationProps) => {
  const [scheduleState, setScheduleState] = useState<Schedule | null | undefined>()
  const classes = useStyles()

  useEffect(() => {
    getSchedule(props.scheduleId)
      .then((schedule: Schedule) => {
        schedule.timeSlots.sort(TimeSlot.compareFn)
        setScheduleState(schedule)
      })
      .catch(err => {
        if (err.status === 404) {
          setScheduleState(null)
        } else {
          console.error(err)
        }
      })
  }, [props.scheduleId])

  return <Container>
    {!scheduleState
      ? scheduleState === null && <div>Sorry. `<code>{props.scheduleId}</code>` is not a valid scheduleState id.</div>
      : <div style={{ textAlign: 'left', width: 'fit-content', margin: 'auto' }}>
        <label>Schedule for: {scheduleState.name}</label>
        <span style={{ display: 'block' }}>All dates and times are given in your local timezone.</span>
        {!scheduleState.active && <div><br />This scheduleState is currently inactive and registration is closed.</div>}
        {scheduleState
          .timeSlots
          .filter(timeSlot => timeSlot.registrations.length > 0)
          .map(timeSlot =>
            <List
              key={`timeslot-${timeSlot.id}`}
              className={classes.root}
              subheader={
                <ListItemText
                  className={classes.rootHeader}
                  primary={moment(timeSlot.dateTime).format(`ddd ${new DateFnsUtils().dateTime24hFormat}`)}
                  secondary={
                    `(${timeSlot.registrations.length} / ${timeSlot.maximumEntries}` +
                    ` entr${timeSlot.registrations.length === 1 ? 'y' : 'ies'})`
                  }
                />
              }
            >
              {timeSlot.participantsPerEntry <= 1 &&
                <ListItemText secondary='Participants' className={classes.nested} />
              }
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {timeSlot.registrations.map((registration, registrationIndex) =>
                  <List
                    key={`registration-${registration.id}`}
                    component='div'
                    disablePadding
                    subheader={
                      timeSlot.participantsPerEntry > 1
                        ? <ListItemText secondary='Participants' />
                        : undefined
                    }
                    className={classes.nested}
                  >
                    {registration.participants.map((participant, participantIndex) =>
                      <ListItem key={`participant-${participantIndex}`} className={classes.item}>
                        <ListItemText
                          primary={
                            `${(timeSlot.participantsPerEntry > 1
                              ? participantIndex
                              : registrationIndex) + 1
                            }. ${participant}`
                          }
                        />
                      </ListItem>)}
                  </List>)}
              </div>
            </List>)}
      </div>
    }

  </Container>
}

export default ScheduleRegistration
