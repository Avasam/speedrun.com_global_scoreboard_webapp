import Event from '@mui/icons-material/Event'
import { MobileDatePicker } from '@mui/lab'
import type { TextFieldProps, Theme } from '@mui/material'
import { Button, Card, CardActions, CardContent, Checkbox, Container, FormControlLabel, Stack, TextField, Typography } from '@mui/material'
import type { SxProps } from '@mui/system'
import { useState } from 'react'

import TimeSlotRow from './TimeSlotRow'
import DisableDashlane from 'src/Components/DisableDashlane'
import type { Schedule, ScheduleDto } from 'src/Models/Schedule'
import { TimeSlot } from 'src/Models/TimeSlot'
import { DEADLINE_FORMAT, diffDays, startOfDay } from 'src/utils/date'
import type { NonFunctionProperties } from 'src/utils/objectUtils'
import { getDeadlineDueText } from 'src/utils/scheduleHelper'

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

  const editTimeSlotDateTime = (date: Date | null | undefined, timeSlot: TimeSlot) => {
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
            error={!schedule.name}
            label={`Name (${props.schedule.name})`}
            onChange={event => setSchedule({ ...schedule, name: event.target.value })}
            required
            value={schedule.name}
          />
          <Stack direction='row' flexWrap='wrap'>
            <FormControlLabel
              control={
                <Checkbox
                  checked={schedule.active}
                  onChange={event => setSchedule({ ...schedule, active: event.target.checked })}
                />
              }
              label='Active'
            />

            <MobileDatePicker
              InputProps={{ endAdornment: <Event /> }}
              clearable
              disableCloseOnSelect
              disablePast={earliestTimeslotDate > new Date()}
              inputFormat={DEADLINE_FORMAT}
              label={`${!schedule.deadline ? 'No r' : 'R'}egistration deadline`}
              onChange={(date: Date | null) => setSchedule({
                ...schedule,
                deadline: date == null ? null : startOfDay(date),
              })}
              renderInput={(params: TextFieldProps) =>
                <TextField
                  {...params}
                  // eslint-disable-next-line react/forbid-component-props
                  className={validateDeadlineTooEarly() ? 'error-as-warning' : undefined}
                  error={!(validateDeadline() && validateDeadlineTooEarly())}
                  helperText={[
                    !validateDeadlineTooEarly() && 'Deadline should not be before today',
                    !validateDeadline() && 'Warning: Your registrations close after the earliest time slot',
                  ].filter(a => a).join('\n')}
                  id='schedule-deadline'
                  // Note: Overkill as we shouldn't have those two messages at once,
                  // but good idea for form validation
                  sx={{
                    // Enough to fit 'No registration deadline'
                    width: '198px',
                    minWidth: '198px',
                    '#schedule-deadline-helper-text': {
                      // Fits perfectly longest error below
                      width: 'max-content',
                    },
                  }}
                />}
              showTodayButton
              value={schedule.deadline}
            />
            {schedule.deadline
              ? <Typography
                color={deadlineDaysLeft > 0 ? 'warn' : undefined}
                component='label'
                marginTop={2.5}
                whiteSpace='nowrap'
              >
                {` Close${deadlineDaysLeft > 0 ? 's' : 'd'} ${getDeadlineDueText(deadlineDaysLeft)}`}
              </Typography>
              : null}
          </Stack>

          <Button onClick={addNewTimeSlot} style={{ width: 'fit-content' }} variant='contained'>
            Add a time slot
          </Button>

          {schedule.timeSlots.map((timeSlot, index) =>
            <TimeSlotRow
              id={`${index}-${timeSlot.id}`}
              isCurrentFocus={currentFocus === timeSlot}
              key={`time-slot-${timeSlot.id}`}
              onDuplicateTimeSlot={() => duplicateTimeSlot(timeSlot, index + 1)}
              onEditTimeSlotDateTime={date => editTimeSlotDateTime(date, timeSlot)}
              onEditTimeSlotMaximumEntries={maximumEntries => editTimeSlotMaximumEntries(maximumEntries, timeSlot)}
              onEditTimeSlotparticipantsPerEntry={participantsPerEntry =>
                editTimeSlotparticipantsPerEntry(participantsPerEntry, timeSlot)}
              onFocus={() => setCurrentFocus(timeSlot)}
              onRemoveTimeSlot={() => removeTimeSlot(index)}
              schedule={schedule}
              timeSlot={timeSlot}
            />)}
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          onClick={handleCancel}
          size='small'
        >
          Cancel
        </Button>
        <Button
          disabled={!validateForm()}
          onClick={() => props.onSave(schedule)}
          size='small'
        >
          Save
        </Button>
      </CardActions>
    </Card>
  </Container>
}
