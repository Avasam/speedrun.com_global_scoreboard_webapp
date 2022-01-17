import AddToCalendar from '@culturehq/add-to-calendar'
import { Button } from '@mui/material'

import type { Schedule } from 'src/Models/Schedule'
import type { TimeSlot } from 'src/Models/TimeSlot'
import { addTime } from 'src/utils/date'
import { buildCalendarEventDescription, buildCalendarEventTitle } from 'src/utils/scheduleHelper'

type AddScheduleToCalendarProps = {
  schedule: Schedule
  timeSlot: TimeSlot
}

const AddScheduleToCalendarButton = (props: AddScheduleToCalendarProps) =>
  <Button
    // <button> cannot appear as a descendant of <button>
    color='inherit'
    component='span'
    size='small'
    sx={{
      padding: '0',
      // TODO: Make paper colored buttons
      backgroundColor: 'background.paper',
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
      },
    }}
    variant='contained'
  >
    <AddToCalendar
      event={{
        name: buildCalendarEventTitle(props.timeSlot, props.schedule),
        details: buildCalendarEventDescription(props.timeSlot, props.schedule),
        location: window.location.href,
        startsAt: props.timeSlot.dateTime.toISOString(),
        endsAt: addTime(1, 'Hours', props.timeSlot.dateTime).toISOString(),
      }}
      filename={buildCalendarEventTitle(props.timeSlot, props.schedule)}
    >
      Add to calendar
    </AddToCalendar>
  </Button>

export default AddScheduleToCalendarButton
