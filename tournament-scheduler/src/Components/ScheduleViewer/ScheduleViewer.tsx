import { Box, Container, FormLabel, Grid, List, ListItem, ListItemText, Paper, Typography, useTheme } from '@material-ui/core'
import { StatusCodes } from 'http-status-codes'
import { useEffect, useState } from 'react'

import AddScheduleToCalendarButton from './AddScheduleToCalendarButton'
import { apiGet } from 'src/fetchers/Api'
import type { ScheduleDto } from 'src/Models/Schedule'
import { Schedule } from 'src/Models/Schedule'
import { TimeSlot } from 'src/Models/TimeSlot'
import { diffDays, fancyFormat } from 'src/utils/Date'
import { getDeadlineDueText } from 'src/utils/ScheduleHelper'

const embedded = typeof new URLSearchParams(window.location.search).get('embedded') == 'string'

type ScheduleViewerProps = {
  scheduleId: number
  shownInGroup?: boolean
}

const getSchedule = (id: number) =>
  apiGet(`schedules/${id}`)
    .then(res =>
      res.json().then((scheduleDto: ScheduleDto) => {
        const newSchedule = new Schedule(scheduleDto)
        newSchedule.timeSlots.sort(TimeSlot.compareFn)
        return newSchedule
      }))

export const TimeZoneMessage = <Typography>All dates and times are given in your local timezone.</Typography>

const ScheduleViewer = (props: ScheduleViewerProps) => {
  const [schedule, setSchedule] = useState<Schedule | null | undefined>()
  const theme = useTheme()

  useEffect(() => {
    getSchedule(props.scheduleId)
      .then(setSchedule)
      .catch((err: Response) => {
        if (err.status === StatusCodes.NOT_FOUND || err.status === StatusCodes.BAD_REQUEST) {
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
      : <Box textAlign='left' width={!props.shownInGroup ? 'fit-content' : '100%'} margin='auto'>
        {/* Offers a background in embedded */}
        <Paper style={{ boxShadow: 'none', background: embedded ? theme.palette.background.default : 'transparent' }}>
          <FormLabel>Schedule for: {schedule.name}</FormLabel>
          {!props.shownInGroup && TimeZoneMessage}
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
                <Paper
                  elevation={4}
                  component={ListItemText}
                  primary={fancyFormat(timeSlot.dateTime)}
                  secondaryTypographyProps={{
                    component: 'span',
                    display: 'flex',
                    direction: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                  secondary={<>
                    <span>
                      ({timeSlot.registrations.length} / {timeSlot.maximumEntries} entr{
                        timeSlot.registrations.length === 1 ? 'y' : 'ies'})
                    </span>
                    <AddScheduleToCalendarButton timeSlot={timeSlot} schedule={schedule} />
                  </>}
                />
              }
            >
              {(timeSlot.participantsPerEntry <= 1 || timeSlot.registrations.length === 1) &&
                <ListItemText secondary='Participants' />
              }
              {/* TODO: Maybe use a dynamic grid instead of flexes here. Especially when there's only one list */}
              <Grid container>
                {timeSlot.registrations.map((registration, registrationIndex) =>
                  <List
                    component={Grid}
                    item
                    key={`registration-${registration.id}`}
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
              </Grid>
            </List>
          </Paper>)
        }
      </Box >
    }

  </Container >
}

export default ScheduleViewer
