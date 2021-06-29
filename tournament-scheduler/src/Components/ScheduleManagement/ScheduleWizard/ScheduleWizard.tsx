import type { Theme } from '@material-ui/core'
import { Button, Card, CardActions, CardContent, Checkbox, Container, FormControlLabel, Stack, TextField, Typography } from '@material-ui/core'
import { Event } from '@material-ui/icons'
import { MobileDatePicker } from '@material-ui/lab'
import type { SxProps } from '@material-ui/system'
import { useState } from 'react'

import TimeSlotRow from './TimeSlotRow'
import type { Schedule, ScheduleDto } from 'src/Models/Schedule'
import { createDefaultTimeSlot, TimeSlot } from 'src/Models/TimeSlot'
import { DEADLINE_FORMAT, diffDays, startOfDay } from 'src/utils/Date'
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
  const [schedule, setSchedule] = useState(props.schedule)

  schedule.timeSlots.sort(TimeSlot.compareFn)

  const editTimeSlotDateTime = (date: Date | null, index: number) => {
    if (!date) return
    schedule.timeSlots[index].dateTime = date
    schedule.timeSlots.sort(TimeSlot.compareFn)
    setSchedule({
      ...schedule,
      registrationLink: schedule.registrationLink,
    })
    Array.prototype.forEach.call(
      document.getElementsByClassName('Mui-focused'),
      (element: HTMLElement) => element.classList.remove('Mui-focused')
    )
  }

  const editTimeSlotMaximumEntries = (maximumEntries: number, index: number) => {
    schedule.timeSlots[index].maximumEntries = maximumEntries
    setSchedule({
      ...schedule,
      registrationLink: schedule.registrationLink,
    })
  }

  const editTimeSlotparticipantsPerEntry = (participantsPerEntry: number, index: number) => {
    schedule.timeSlots[index].participantsPerEntry = participantsPerEntry
    setSchedule({
      ...schedule,
      registrationLink: schedule.registrationLink,
    })
  }
  const addNewTimeSlot = () => {
    schedule.timeSlots.unshift(createDefaultTimeSlot())
    schedule.timeSlots.sort(TimeSlot.compareFn)
    setSchedule({
      ...schedule,
      registrationLink: schedule.registrationLink,
    })
  }

  const removeTimeSlot = (index: number) => {
    schedule.timeSlots.splice(index, 1)
    setSchedule({
      ...schedule,
      registrationLink: schedule.registrationLink,
    })
  }

  const duplicateTimeSlot = (index: number) => {
    schedule.timeSlots.splice(index, 0, { ...schedule.timeSlots[index], id: -1, registrations: [] })
    setSchedule({
      ...schedule,
      registrationLink: schedule.registrationLink,
    })
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
    <Card>
      <CardContent>
        <Stack spacing={1.5} sx={calendarIconStyle}>
          <TextField
            required
            error={!schedule.name}
            label={`Name (${props.schedule.name})`}
            value={schedule.name}
            onChange={event => setSchedule({
              ...schedule,
              registrationLink: schedule.registrationLink,
              name: event.target.value,
            })}
          />
          <Stack direction='row' flexWrap='wrap'>
            <FormControlLabel
              label='Active'
              control={
                <Checkbox
                  checked={schedule.active}
                  onChange={event => setSchedule({
                    ...schedule,
                    registrationLink: schedule.registrationLink,
                    active: event.target.checked,
                  })}
                />
              }
            />

            <MobileDatePicker
              label={`${!schedule.deadline ? 'No r' : 'R'}egistration deadline`}
              inputFormat={DEADLINE_FORMAT}
              value={schedule.deadline}
              onChange={date => setSchedule({
                ...schedule,
                registrationLink: schedule.registrationLink,
                deadline: date == null ? null : startOfDay(date),
              })}
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
                      // TODO: No max-content at 493 and less
                      // Fits perfectly longest error below
                      width: 'max-content',
                    },
                  }}
                  // Note: Overkill as we shouldn't have twose two messages at once,
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

          {schedule.timeSlots.map((timeSlot: TimeSlot, index) =>
            <TimeSlotRow
              key={`time-slot-${index}-${timeSlot.id}`}
              id={index}
              schedule={schedule}
              timeSlot={timeSlot}
              onEditTimeSlotDateTime={date => editTimeSlotDateTime(date, index)}
              onDuplicateTimeSlot={() => duplicateTimeSlot(index)}
              onRemoveTimeSlot={() => removeTimeSlot(index)}
              onEditTimeSlotMaximumEntries={maximumEntries => editTimeSlotMaximumEntries(maximumEntries, index)}
              onEditTimeSlotparticipantsPerEntry={participantsPerEntry =>
                editTimeSlotparticipantsPerEntry(participantsPerEntry, index)}
            />)}
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          size='small'
          onClick={props.onCancel}
        >
          Cancel
        </Button>
        <Button
          size='small'
          disabled={!validateForm()}
          onClick={() => props.onSave({
            ...schedule,
            deadline: startOfDay(schedule.deadline),
          })}
        >
          Save
        </Button>
      </CardActions>
    </Card>
  </Container>
}
