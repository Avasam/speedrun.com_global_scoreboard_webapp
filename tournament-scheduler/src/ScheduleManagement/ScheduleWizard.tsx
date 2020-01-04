import React, { useState } from 'react'
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/moment'

import { Schedule } from '../models/Schedule'
import './ScheduleWizard.css'
import { Card, CardContent, CardActions, Button, Checkbox, TextField, FormGroup, FormControlLabel, IconButton, Container, FormControl, InputLabel, Input } from '@material-ui/core'
import { Moment } from 'moment'
import MaskedInput from 'react-text-mask'

type ScheduleWizardProps = {
  schedule: Schedule
  onSave: (schedule: Schedule) => void
  onCancel: () => void
}

type NonZeroNumberInputProps = {
  value: number | string
  inputRef: (ref: HTMLInputElement | null) => void;
}

const NonZeroNumberInput = (props: NonZeroNumberInputProps) => {
  const { inputRef, ...other } = props;

  return (
    <MaskedInput
      {...other}
      ref={(ref: any) => {
        inputRef(ref ? ref.inputElement : null);
      }}
      mask={[/[1-9]/, /\d/,]}
      guide={false}
    />
  );
}

export const ScheduleWizard: React.FC<ScheduleWizardProps> = (props: ScheduleWizardProps) => {
  const [schedule, setSchedule] = useState(props.schedule)

  const editTimeSlotDateTime = (date: Moment | null, index: number) => {
    if (!date) return
    schedule.timeSlots[index].dateTime = date.toDate()
    setSchedule({
      ...schedule,
      registrationLink: schedule.registrationLink,
    })
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
    schedule.timeSlots.push({
      id: -1,
      dateTime: new Date(),
      maximumEntries: 1,
      participantsPerEntry: 1,
    })
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

  return <Container>
    <Card>
      <CardContent>
        <FormGroup>
          <TextField
            label={`Name (${props.schedule.name})`}
            value={schedule.name}
            onChange={event => setSchedule({
              ...schedule,
              registrationLink: schedule.registrationLink,
              name: event.target.value,
            })}
          />
          <FormControlLabel
            label="Active"
            control={
              <Checkbox
                checked={schedule.active}
                onChange={event => setSchedule({
                  ...schedule,
                  registrationLink: schedule.registrationLink,
                  active: event.target.checked,
                })}
                color="primary" />
            }
          />

          <Button style={{ width: 'fit-content' }} variant="contained" color='primary' onClick={addNewTimeSlot}>
            Add a time slot
          </Button>
          {schedule.timeSlots.map((timeSlot, index) =>
            <div className="time-slot-row" key={`time-slot-${index}`}>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <DateTimePicker
                  label="Date and time"
                  value={timeSlot.dateTime}
                  onChange={date => editTimeSlotDateTime(date, index)}
                />
              </MuiPickersUtilsProvider>
              <div>
                <FormControl>
                  <InputLabel htmlFor={`maximum-entries-${index}`}>Maximum entries</InputLabel>
                  <Input
                    id={`maximum-entries-${index}`}
                    type='tel'
                    inputProps={{ min: "1" }}
                    onFocus={event => event.target.select()}
                    value={timeSlot.maximumEntries}
                    onChange={event => editTimeSlotMaximumEntries(parseInt(event.target.value, 10) || 1, index)}
                    inputComponent={NonZeroNumberInput as any}
                  />
                </FormControl>
                <FormControl>
                  <InputLabel htmlFor={`participants-per-entry-${index}`}>Participants per entry</InputLabel>
                  <Input
                    id={`participants-per-entry-${index}`}
                    type='tel'
                    inputProps={{ min: "1" }}
                    onFocus={event => event.target.select()}
                    value={timeSlot.participantsPerEntry}
                    onChange={event => editTimeSlotparticipantsPerEntry(parseInt(event.target.value, 10) || 1, index)}
                    inputComponent={NonZeroNumberInput as any}
                  />
                </FormControl>
                {schedule.timeSlots.length > 1 &&
                  <IconButton
                    style={{ color: 'red' }}
                    color="secondary"
                    aria-label="remove time slot"
                    component="button"
                    onClick={() => removeTimeSlot(index)}
                  >
                    &times;
                  </IconButton>
                }
              </div>
            </div>
          )}
        </FormGroup>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          onClick={props.onCancel}
        >
          Cancel
        </Button>
        <Button
          size="small"
          onClick={() => props.onSave(schedule)}
        >
          Save
      </Button>
      </CardActions>
    </Card>
  </Container>

}
