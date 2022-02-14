import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Collapse, Container, FormLabel, List, ListItemButton, ListItemText, Paper, Typography, useTheme } from '@mui/material'
import { StatusCodes } from 'http-status-codes'
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useParams } from 'react-router-dom'

import TimeSlotView from 'src/Components/ScheduleViewer/TimeSlotView'
import { apiGet } from 'src/fetchers/api'
import type { ScheduleDto } from 'src/Models/Schedule'
import { Schedule } from 'src/Models/Schedule'
import { TimeSlot } from 'src/Models/TimeSlot'
import { diffDays } from 'src/utils/date'
import { getDeadlineDueText } from 'src/utils/scheduleHelper'

const embedded = typeof new URLSearchParams(window.location.search).get('embedded') == 'string'

type ScheduleViewerProps = {
  scheduleId: number
  shownInGroup: boolean
} | {
  scheduleId?: undefined
  shownInGroup?: undefined
}

const getSchedule = (id: number) =>
  apiGet<ScheduleDto>(`schedules/${id}`)
    .then(scheduleDto => {
      const newSchedule = new Schedule(scheduleDto)
      newSchedule.timeSlots.sort(TimeSlot.compareFn)
      return newSchedule
    })

export const TimeZoneMessage = <Typography>All dates and times are given in your local timezone.</Typography>

const ScheduleViewer = (props: ScheduleViewerProps) => {
  const [schedule, setSchedule] = useState<Schedule | null | undefined>()
  const [pastTimeSlotsShown, setPastTimeSlotsShown] = useState(false)
  const theme = useTheme()
  const routeParams = useParams()

  const scheduleId = props.shownInGroup ? props.scheduleId : Number(routeParams.scheduleId)

  useEffect(() => {
    getSchedule(scheduleId)
      .then(setSchedule)
      .catch((error: Response) => {
        if (error.status === StatusCodes.NOT_FOUND || error.status === StatusCodes.BAD_REQUEST) {
          setSchedule(null)
        } else {
          console.error(error)
        }
      })
  }, [scheduleId])

  const deadlineDaysLeft = diffDays(schedule?.deadline)

  const upcomingTimeSlots = schedule?.timeSlots.filter(timeSlot =>
    timeSlot.registrations.length > 0 &&
    timeSlot.dateTime > new Date()) ?? []
  const pastTimeSlots = schedule?.timeSlots.filter(timeSlot =>
    timeSlot.registrations.length > 0 &&
    timeSlot.dateTime <= new Date()) ?? []

  return <Container maxWidth='md'>
    {!schedule
      ? schedule === null && <div>
        Sorry. `
        {/**/}
        <code>{scheduleId}</code>
        {/**/}
        ` is not a valid schedule id.
      </div>
      : <Box margin='auto' textAlign='left' width={!props.shownInGroup ? 'fit-content' : '100%'}>
        {/* Offers a background in embedded */}
        <Paper style={{ boxShadow: 'none', background: embedded ? theme.palette.background.default : 'transparent' }}>
          <FormLabel>
            Schedule for:
            {' '}
            {schedule.name}
          </FormLabel>
          {!props.shownInGroup && <>
            <Helmet>
              <title>
                Schedule
                {' '}
                {schedule.name}
                {' '}
                - Tournament Scheduler
              </title>
            </Helmet>
            {TimeZoneMessage}
          </> }
          {schedule.active
            ? schedule.deadline && <p>
              Registrations
              {deadlineDaysLeft > 0 ? ' are closing ' : ' closed '}
              {getDeadlineDueText(deadlineDaysLeft)}
              .
            </p>
            : <p>This schedule is currently inactive and registration is closed.</p>}
          {upcomingTimeSlots.length === 0 &&
          pastTimeSlots.length === 0 &&
          <p>There are no registrations for this schedule.</p>}
        </Paper>

        {upcomingTimeSlots.map(timeSlot => <TimeSlotView key={timeSlot.id} schedule={schedule} timeSlot={timeSlot} />)}
        {pastTimeSlots.length > 0 && <List>
          <ListItemButton onClick={() => setPastTimeSlotsShown(!pastTimeSlotsShown)}>
            <ListItemText primary={`${pastTimeSlotsShown
              ? 'Hide'
              : 'Show'} past registrations (${pastTimeSlots.length})`}
            />
            {pastTimeSlotsShown ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
          <Collapse in={pastTimeSlotsShown}>
            {pastTimeSlots.map(timeSlot => <TimeSlotView key={timeSlot.id} schedule={schedule} timeSlot={timeSlot} />)}
          </Collapse>
        </List>}
      </Box >}

  </Container >
}

export default ScheduleViewer
