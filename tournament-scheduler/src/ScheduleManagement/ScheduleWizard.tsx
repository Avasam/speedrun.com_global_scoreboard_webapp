import React, { useState } from 'react';
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/moment';

import { Schedule } from '../models/Schedule';
import './ScheduleWizard.css'
import { Card, CardContent, CardActions, Button, Checkbox, TextField, FormGroup, FormControlLabel, IconButton, Container } from '@material-ui/core';
import { Moment } from 'moment';

type ScheduleManagementProps = {
  schedule: Schedule
  onSave: (schedule: Schedule) => void
  onCancel: () => void
}

export const ScheduleWizard: React.FC<ScheduleManagementProps> = (props: ScheduleManagementProps) => {
  const [schedule, setSchedule] = useState(props.schedule)

  const editTimeSlot = (date: Moment | null, index: number) => {
    if (!date) return
    schedule.timeSlots[index].dateTime = date.toDate()
    setSchedule({
      ...schedule,
      registrationLink: schedule.registrationLink,
    })
  }

  const addNewTimeSlot = () => {
    schedule.timeSlots.push({ dateTime: new Date() })
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
            <div className="timeslot-row" key={`date-time-picker${index}`}>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <DateTimePicker value={timeSlot.dateTime} onChange={date => editTimeSlot(date, index)} />
              </MuiPickersUtilsProvider>
              {schedule.timeSlots.length > 1 &&
                <IconButton
                  color="secondary"
                  aria-label="remove timeslot"
                  component="button"
                  onClick={() => removeTimeSlot(index)}
                >
                  &times;
                </IconButton>
              }
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
