import './ScheduleWizard.css'

import { Button, Card, CardActions, CardContent, Checkbox, Container, FormControlLabel, FormGroup, IconButton, InputAdornment, TextField } from '@material-ui/core'
import Event from '@material-ui/icons/Event'
import { DatePicker, LocalizationProvider } from '@material-ui/lab'
import AdapterDateFns from '@material-ui/lab/AdapterMoment'
import moment from 'moment'
import type { FC } from 'react'
import { useState } from 'react'

import type { Schedule, ScheduleDto } from '../../models/Schedule'
import { createDefaultTimeSlot, TimeSlot } from '../../models/TimeSlot'
import { todayFlat } from '../../utils/Date'
import TimeSlotRow from './TimeSlotRow'

// TODO MUI5: move all 'moment' references to date utils?

type ScheduleWizardProps = {
  schedule: Schedule
  onSave: (schedule: ScheduleDto) => void
  onCancel: () => void
}

export const ScheduleWizard: FC<ScheduleWizardProps> = (props: ScheduleWizardProps) => {
  const [schedule, setSchedule] = useState(props.schedule)

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

  const earliestTimeslotDate = schedule.timeSlots.map(timeSlot => timeSlot.dateTime)[0]

  const validateDeadline = () =>
    !schedule.deadline ||
    (schedule.deadline <= earliestTimeslotDate &&
      (earliestTimeslotDate <= new Date() || schedule.deadline >= todayFlat()))

  return <Container>
    <Card>
      <CardContent>
        <FormGroup className='error-as-warning'>
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

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label={`${!schedule.deadline ? 'No r' : 'R'}egistration deadline`}
                value={schedule.deadline}
                onChange={date => setSchedule({
                  ...schedule,
                  registrationLink: schedule.registrationLink,
                  deadline: date == null ? null : moment(date).startOf('day').toDate(),
                })}
                disablePast={earliestTimeslotDate > new Date()}
                clearable
                InputProps={{
                  endAdornment:
                    <InputAdornment position='end'>
                      <IconButton>
                        <Event />
                      </IconButton>
                    </InputAdornment>
                  ,
                }}
                renderInput={params =>
                  <TextField
                    {...params}
                    id='schedule-deadline'
                    error={!validateDeadline()}
                    // TODO MUI5: Reimplement the following error message
                    // minDateMessage='Deadline should not be before today'
                    helperText={!validateDeadline() && 'Warning: Your registrations close after the earliest time slot'}
                  />}
              />
            </LocalizationProvider>
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
          disabled={!schedule.name}
          onClick={() => props.onSave({
            ...schedule,
            deadline: moment(schedule.deadline).startOf('day').toDate(),
          })}
        >
          Save
        </Button>
      </CardActions>
    </Card>
  </Container>
}
