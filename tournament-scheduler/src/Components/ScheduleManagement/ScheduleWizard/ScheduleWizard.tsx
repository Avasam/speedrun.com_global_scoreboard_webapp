import type { Theme } from '@material-ui/core'
import { Button, Card, CardActions, CardContent, Checkbox, Container, FormControlLabel, Stack, TextField, Typography } from '@material-ui/core'
import { Event } from '@material-ui/icons'
import { MobileDatePicker } from '@material-ui/lab'
import type { SxProps } from '@material-ui/system'
import { useState } from 'react'

import TimeSlotRow from './TimeSlotRow'
import DisableDashlane from 'src/Components/DisableDashlane'
import type { Schedule, ScheduleDto } from 'src/Models/Schedule'
import { TimeSlot } from 'src/Models/TimeSlot'
import { DEADLINE_FORMAT, diffDays, startOfDay } from 'src/utils/Date'
import type { NonFunctionProperties } from 'src/utils/ObjectUtils'
import { getDeadlineDueText } from 'src/utils/ScheduleHelper'

const calendarIconStyle: SxProps<Theme> = {
  '.MuiInput-root > .MuiSvgIcon-root': {
    display: 'inline',
    position: 'absolute',
    top: '4px',
    right: 0,
    pointerEvents: 'none',
  },
}

type ScheduleWizardProps = {
  schedule: Schedule
  onSave: (schedule: ScheduleDto) => void
  onCancel: () => void
}

export const ScheduleWizard = (props: ScheduleWizardProps) => {
  const [currentFocus, setCurrentFocus] = useState<TimeSlot>()
  const [schedule, setSchedule] = useState<NonFunctionProperties<Schedule>>(props.schedule.deepCopy())
  const refreshTimeSlots = () => setSchedule({ ...schedule })

  const handleCancel = () => {
    setSchedule(props.schedule.deepCopy())
    props.onCancel()
  }

  const editTimeSlotDateTime = (date: Date | null, timeSlot: TimeSlot) => {
    if (!date) return
    timeSlot.dateTime = date
    schedule.timeSlots.sort(TimeSlot.compareFn)
    refreshTimeSlots()
  }

  const editTimeSlotMaximumEntries = (maximumEntries: number, timeSlot: TimeSlot) => {
    timeSlot.maximumEntries = maximumEntries
    refreshTimeSlots()
  }

  const editTimeSlotparticipantsPerEntry = (participantsPerEntry: number, timeSlot: TimeSlot) => {
    timeSlot.participantsPerEntry = participantsPerEntry
    refreshTimeSlots()
  }

  const addNewTimeSlot = () => {
    const newTimeSlot = TimeSlot.createDefault()
    schedule.timeSlots.unshift(newTimeSlot)
    setCurrentFocus(newTimeSlot)
    schedule.timeSlots.sort(TimeSlot.compareFn)
    refreshTimeSlots()
  }

  const removeTimeSlot = (index: number) => {
    schedule.timeSlots.splice(index, 1)
    refreshTimeSlots()
  }

  const duplicateTimeSlot = (timeSlot: TimeSlot, position: number) => {
    schedule.timeSlots.splice(position, 0, { ...timeSlot, id: -Date.now(), registrations: [] })
    refreshTimeSlots()
  }

  const deadlineDaysLeft = diffDays(schedule.deadline)
  const earliestTimeslotDate = schedule.timeSlots.map(timeSlot => timeSlot.dateTime)[0]

  const validateDeadline = () =>
    !schedule.deadline || schedule.deadline <= earliestTimeslotDate

  const validateDeadlineTooEarly = () =>
    !schedule.deadline || schedule.deadline >= startOfDay() ||
    // If earliest timeslot is older than today, then this is anold schedule we're editing
    // and we should allow the user to keep their old deadline
    earliestTimeslotDate <= new Date()

  const validateForm = () => schedule.name && validateDeadlineTooEarly()

  return <Container>
    <DisableDashlane />
    <Card>
      <CardContent>
        <Stack spacing={1.5} sx={calendarIconStyle}>
          <TextField
            required
            error={!schedule.name}
            label={`Name (${props.schedule.name})`}
            value={schedule.name}
            onChange={event => setSchedule({ ...schedule, name: event.target.value })}
          />
          <Stack direction='row' flexWrap='wrap'>
            <FormControlLabel
              label='Active'
              control={
                <Checkbox
                  checked={schedule.active}
                  onChange={event => setSchedule({ ...schedule, active: event.target.checked })}
                />
              }
            />

            <MobileDatePicker
              label={`${!schedule.deadline ? 'No r' : 'R'}egistration deadline`}
              inputFormat={DEADLINE_FORMAT}
              value={schedule.deadline}
              disableCloseOnSelect
              onChange={date => setSchedule({ ...schedule, deadline: date == null ? null : startOfDay(date) })}
              disablePast={earliestTimeslotDate > new Date()}
              showTodayButton
              clearable
              InputProps={{ endAdornment: <Event /> }}
              renderInput={params =>
                <TextField
                  {...params}
                  id='schedule-deadline'
                  error={!(validateDeadline() && validateDeadlineTooEarly())}
                  className={validateDeadlineTooEarly() ? 'error-as-warning' : undefined}
                  sx={{
                    // Enough to fit 'No registration deadline'
                    width: '198px',
                    minWidth: '198px',
                    '#schedule-deadline-helper-text': {
                      // Fits perfectly longest error below
                      width: 'max-content',
                    },
                  }}
                  // Note: Overkill as we shouldn't have those two messages at once,
                  // but good idea for form validation
                  helperText={[
                    !validateDeadlineTooEarly() && 'Deadline should not be before today',
                    !validateDeadline() && 'Warning: Your registrations close after the earliest time slot',
                  ].filter(a => a).join('\n')}
                />}
            />
            {schedule.deadline &&
              <Typography
                component={'label'}
                whiteSpace='nowrap'
                marginTop={2.5}
                color={deadlineDaysLeft > 0 ? 'warn' : undefined}
              >
                &nbsp;Close{deadlineDaysLeft > 0 ? 's' : 'd'} {getDeadlineDueText(deadlineDaysLeft)}
              </Typography>}
          </Stack>

          <Button style={{ width: 'fit-content' }} variant='contained' onClick={addNewTimeSlot}>
            Add a time slot
          </Button>

          {schedule.timeSlots.map((timeSlot, index) =>
            <TimeSlotRow
              key={`time-slot-${timeSlot.id}`}
              id={`${index}-${timeSlot.id}`}
              schedule={schedule}
              timeSlot={timeSlot}
              onEditTimeSlotDateTime={date => editTimeSlotDateTime(date, timeSlot)}
              onDuplicateTimeSlot={() => duplicateTimeSlot(timeSlot, index + 1)}
              onRemoveTimeSlot={() => removeTimeSlot(index)}
              onEditTimeSlotMaximumEntries={maximumEntries => editTimeSlotMaximumEntries(maximumEntries, timeSlot)}
              onEditTimeSlotparticipantsPerEntry={participantsPerEntry =>
                editTimeSlotparticipantsPerEntry(participantsPerEntry, timeSlot)}
              isCurrentFocus={currentFocus === timeSlot}
              onFocus={() => setCurrentFocus(timeSlot)}
            />)}
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          size='small'
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          size='small'
          disabled={!validateForm()}
          onClick={() => props.onSave(schedule)}
        >
          Save
        </Button>
      </CardActions>
    </Card>
  </Container>
}
