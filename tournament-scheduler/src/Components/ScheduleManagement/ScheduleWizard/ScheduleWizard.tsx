import './ScheduleWizard.css'

import DateFnsUtils from '@date-io/moment'
import { Button, Card, CardActions, CardContent, Checkbox, Container, FormControlLabel, FormGroup, IconButton, InputAdornment, TextField } from '@material-ui/core'
import Event from '@material-ui/icons/Event'
import { DatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import type { Moment } from 'moment'
import moment from 'moment'
import type { FC } from 'react'
import { useState } from 'react'

import TimeSlotRow from './TimeSlotRow'
import type { Schedule, ScheduleDto } from 'src/Models/Schedule'
import { createDefaultTimeSlot, TimeSlot } from 'src/Models/TimeSlot'
import { DEADLINE_FORMAT, diffDays, startOfDay } from 'src/utils/Date'
import { getDeadlineDueText } from 'src/utils/ScheduleHelper'

type ScheduleWizardProps = {
  schedule: Schedule
  onSave: (schedule: ScheduleDto) => void
  onCancel: () => void
}

export const ScheduleWizard: FC<ScheduleWizardProps> = (props: ScheduleWizardProps) => {
  const [schedule, setSchedule] = useState(props.schedule)

  const editTimeSlotDateTime = (momentDate: Moment | null, index: number) => {
    if (!momentDate) return
    const date = momentDate.toDate()
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
                  color='primary' />
              }
            />

            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DatePicker
                id='schedule-deadline'
                label={`${!schedule.deadline ? 'No r' : 'R'}egistration deadline`}
                value={schedule.deadline}
                onChange={momentDate => setSchedule({
                  ...schedule,
                  registrationLink: schedule.registrationLink,
                  deadline: momentDate?.startOf('day').toDate() ?? null,
                })}
                error={!validateDeadline()}
                helperText={!validateDeadline() && 'Warning: Your registrations close after the earliest time slot'}
                disablePast={earliestTimeslotDate > new Date()}
                minDateMessage='Deadline should not be before today'
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
              />
            </MuiPickersUtilsProvider>
          </div>

          <Button style={{ width: 'fit-content' }} variant='contained' color='primary' onClick={addNewTimeSlot}>
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
