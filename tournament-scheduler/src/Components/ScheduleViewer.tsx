import '@culturehq/add-to-calendar/dist/styles.css'

import AddToCalendar from '@culturehq/add-to-calendar'
import DateFnsUtils from '@date-io/moment'
import { Container, createStyles, List, ListItem, ListItemText, makeStyles } from '@material-ui/core'
import { StatusCodes } from 'http-status-codes'
import moment from 'moment'
import type { FC } from 'react'
import { useEffect, useState } from 'react'

import { apiGet } from 'src/fetchers/Api'
import type { ScheduleDto } from 'src/Models/Schedule'
import { Schedule } from 'src/Models/Schedule'
import { TimeSlot } from 'src/Models/TimeSlot'
import { addTime, diffDays, fancyFormat } from 'src/utils/Date'
import { buildCalendarEventDescription, buildCalendarEventTitle, getDeadlineDueText } from 'src/utils/ScheduleHelper'

type ScheduleRegistrationProps = {
  scheduleId: number
}

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      backgroundColor: theme.palette.background.paper,
      margin: theme.spacing(math.HALF),
    },
    rootHeader: {
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightBold,
      backgroundColor: theme.palette.background.default,
      paddingTop: theme.spacing(math.HALF),
      paddingBottom: theme.spacing(math.HALF),
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
    addToCalendar: {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      marginTop: theme.spacing(1.25),
      marginLeft: theme.spacing(2),
      marginBottom: 10,
      display: 'inline-block',
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.background.paper,
      borderRadius: 4,
    },
  }))

const getSchedule = (id: number) =>
  apiGet(`schedules/${id}`)
    .then(res =>
      res.json().then((scheduleDto: ScheduleDto) => new Schedule(scheduleDto)))

const embedded = typeof new URLSearchParams(window.location.search).get('embedded') == 'string'

const ScheduleViewer: FC<ScheduleRegistrationProps> = (props: ScheduleRegistrationProps) => {
  const [scheduleState, setScheduleState] = useState<Schedule | null | undefined>()
  const classes = useStyles()

  useEffect(() => {
    getSchedule(props.scheduleId)
      .then((schedule: Schedule) => {
        schedule.timeSlots.sort(TimeSlot.compareFn)
        setScheduleState(schedule)
      })
      .catch((err: Response) => {
        if (err.status === StatusCodes.NOT_FOUND) {
          setScheduleState(null)
        } else {
          console.error(err)
        }
      })
  }, [props.scheduleId])

  const deadlineDaysLeft = diffDays(schedule?.deadline)

  const timeslots = schedule?.timeSlots.filter(timeSlot => timeSlot.registrations.length > 0) ?? []
  return <Container maxWidth='md'>
    {!schedule
      ? schedule === null && <div>Sorry. `<code>{props.scheduleId}</code>` is not a valid schedule id.</div>
      : <div style={{
        textAlign: 'left',
        width: 'fit-content',
        margin: 'auto',
      }}>
        {/* Invisible normally, but offers a background in embedded */}
        <Paper style={{ boxShadow: 'none', background: theme.palette.background.default }}>
          <label>Schedule for: {schedule.name}</label>
          <span style={{ display: 'block' }}>All dates and times are given in your local timezone.</span>
          {schedule.active
            ? schedule.deadline && <p>
              Registrations {deadlineDaysLeft > 0 ? 'are closing' : 'closed'} {getDeadlineDueText(deadlineDaysLeft)}.
            </p>
            : <p>This schedule is currently inactive and registration is closed.</p>
          }
          {timeslots.length === 0 && <p>There are no registrations for this schedule.</p>}
        </Paper>

        {timeslots.map(timeSlot =>
          <Paper key={`timeslot-${timeSlot.id}`} elevation={24}>
            <List
              key={`timeslot-${timeSlot.id}`}
              className={classes.root}
              subheader={
                <Paper>
                  <ListItemText
                    primary={<>
                      {fancyFormat(timeSlot.dateTime)}
                      {/* TODO: Make paper colored buttons */}
                      <Button
                        sx={{
                          float: 'right',
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: `0px 11px 15px -7px rgb(0 0 0 / 20%),
                                      0px 24px 38px 3px rgb(0 0 0 / 14%),
                                      0px 9px 46px 8px rgb(0 0 0 / 12%)`,
                          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
                          '&:hover, .chq-atc--dropdown a:hover ': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          },
                        }}
                      >Add to calendar</AddToCalendar>
                    </div>
                  </>}
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

    export default ScheduleViewer
