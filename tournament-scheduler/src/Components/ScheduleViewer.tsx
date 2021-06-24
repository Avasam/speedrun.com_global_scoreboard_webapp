import '@culturehq/add-to-calendar/dist/styles.css'

import AddToCalendar from '@culturehq/add-to-calendar'
import { Box, Button, Container, List, ListItem, ListItemText, Paper, useTheme } from '@material-ui/core'
import { StatusCodes } from 'http-status-codes'
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

const getSchedule = (id: number) =>
  apiGet(`schedules/${id}`)
    .then(res =>
      res.json().then((scheduleDto: ScheduleDto) => new Schedule(scheduleDto)))

const ScheduleViewer = (props: ScheduleRegistrationProps) => {
  const [schedule, setSchedule] = useState<Schedule | null | undefined>()
  const theme = useTheme()

  useEffect(() => {
    getSchedule(props.scheduleId)
      .then((newSchedule: Schedule) => {
        newSchedule.timeSlots.sort(TimeSlot.compareFn)
        setSchedule(newSchedule)
      })
      .catch((err: Response) => {
        if (err.status === StatusCodes.NOT_FOUND) {
          setSchedule(null)
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
      : <div style={{ textAlign: 'left', width: 'fit-content', margin: 'auto' }}>
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
              subheader={
                <Paper>
                  <ListItemText
                    primary={<>
                      {fancyFormat(timeSlot.dateTime)}
                      <Button
                        // <button> cannot appear as a descendant of <button>
                        component='div'
                        sx={{
                          float: 'right',
                          backgroundColor: theme.palette.background.paper,
                          // TODO: Make paper colored buttons
                          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          },
                        }}
                        size='small'
                        variant='contained'
                        color='inherit'
                      >
                        <AddToCalendar
                          filename={buildCalendarEventTitle(timeSlot, schedule)}
                          event={{
                            name: buildCalendarEventTitle(timeSlot, schedule),
                            details: buildCalendarEventDescription(timeSlot, schedule),
                            location: window.location.href,
                            startsAt: timeSlot.dateTime.toISOString(),
                            endsAt: addTime(1, 'Hours', timeSlot.dateTime).toISOString(),
                          }}
                        >Add to calendar</AddToCalendar>
                      </Button>
                    </>}
                    secondary={
                      `(${timeSlot.registrations.length} / ${timeSlot.maximumEntries}` +
                      ` entr${timeSlot.registrations.length === 1 ? 'y' : 'ies'})`
                    }
                  />
                </Paper>
              }
            >
              {(timeSlot.participantsPerEntry <= 1 || timeSlot.registrations.length === 1) &&
                <ListItemText secondary='Participants' />
              }
              {/* TODO: Maybe use a dynamic grid instead of flexes here. Especially when there's only one list */}
              <Box display='flex'>
                {timeSlot.registrations.map((registration, registrationIndex) =>
                  <List
                    key={`registration-${registration.id}`}
                    component='div'
                    disablePadding
                    style={timeSlot.registrations.length === 1
                      ? {
                        display: 'flex',
                        flexFlow: 'wrap',
                        whiteSpace: 'nowrap',
                      }
                      : undefined}
                    subheader={
                      timeSlot.participantsPerEntry <= 1 || timeSlot.registrations.length === 1
                        ? undefined
                        : <ListItemText secondary='Participants' />
                    }
                  >
                    {registration.participants.map((participant, participantIndex) =>
                      <ListItem key={`participant-${participantIndex}`}>
                        <ListItemText
                          primary={
                            `${(timeSlot.participantsPerEntry <= 1
                              ? registrationIndex
                              : participantIndex
                            ) + 1}. ${participant}`
                          }
                        />
                      </ListItem>)}
                  </List>)}
              </Box>
            </List>
          </Paper>)
        }
      </div >
    }

  </Container >
}

export default ScheduleViewer
