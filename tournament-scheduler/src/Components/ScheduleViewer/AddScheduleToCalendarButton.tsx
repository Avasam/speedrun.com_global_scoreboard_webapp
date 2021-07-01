import AddToCalendar from '@culturehq/add-to-calendar'
import { Button } from '@material-ui/core'

import type { Schedule } from 'src/Models/Schedule'
import type { TimeSlot } from 'src/Models/TimeSlot'
import { addTime } from 'src/utils/Date'
import { buildCalendarEventDescription, buildCalendarEventTitle } from 'src/utils/ScheduleHelper'

type AddScheduleToCalendarProps = {
  schedule: Schedule
  timeSlot: TimeSlot
}

const AddScheduleToCalendarButton = (props: AddScheduleToCalendarProps) =>
  <Button
    // <button> cannot appear as a descendant of <button>
    component='span'
    sx={{
      padding: '0',
      // TODO: Make paper colored buttons
      backgroundColor: 'background.paper',
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
      filename={buildCalendarEventTitle(props.timeSlot, props.schedule)}
      event={{
        name: buildCalendarEventTitle(props.timeSlot, props.schedule),
        details: buildCalendarEventDescription(props.timeSlot, props.schedule),
        location: window.location.href,
        startsAt: props.timeSlot.dateTime.toISOString(),
        endsAt: addTime(1, 'Hours', props.timeSlot.dateTime).toISOString(),
      }}
    >Add to calendar</AddToCalendar>
  </Button>
export default AddScheduleToCalendarButton
