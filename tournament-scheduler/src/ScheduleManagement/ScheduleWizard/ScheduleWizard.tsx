import './ScheduleWizard.css'

import { Button, Card, CardActions, CardContent, Checkbox, Container, FormControlLabel, FormGroup, TextField, Typography } from '@material-ui/core'
import { Event } from '@material-ui/icons'
import { LocalizationProvider, MobileDatePicker } from '@material-ui/lab'
import AdapterDateFns from '@material-ui/lab/AdapterDayjs'
import type { FC } from 'react'
import { useState } from 'react'

import type { Schedule, ScheduleDto } from '../../models/Schedule'
import { createDefaultTimeSlot, TimeSlot } from '../../models/TimeSlot'
import { DEADLINE_FORMAT, diffDays, startOfDay } from '../../utils/Date'
import { getDeadlineDueText } from '../../utils/ScheduleHelper'
import TimeSlotRow from './TimeSlotRow'

type ScheduleWizardProps = {
  schedule: Schedule
  onSave: (schedule: ScheduleDto) => void
  onCancel: () => void
}

export const ScheduleWizard: FC<ScheduleWizardProps> = (props: ScheduleWizardProps) => {
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
        <FormGroup>
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
          <div style={{ display: 'flex', margin: '12px 0' }}>
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

            <LocalizationProvider dateAdapter={AdapterDateFns} locale='fr'>
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
                    // Note: Overkill as we shouldn't have twose two messages at once, but good idea for form validation
                    helperText={[
                      !validateDeadlineTooEarly() && 'Deadline should not be before today',
                      !validateDeadline() && 'Warning: Your registrations close after the earliest time slot',
                    ].filter(x => x).join('\n')}
                  />}
              />
            </LocalizationProvider>
            {schedule.deadline &&
              <Typography
                component={'label'}
                color={deadlineDaysLeft > 0 ? 'yellow' : undefined}
                style={{ alignSelf: 'center' }}
              >
                &nbsp;Closes {getDeadlineDueText(deadlineDaysLeft)}
              </Typography>}
          </div>

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
        </FormGroup>
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
