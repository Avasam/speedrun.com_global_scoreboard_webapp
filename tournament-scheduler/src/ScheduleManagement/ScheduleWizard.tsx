import './ScheduleWizard.css'
import { Button, ButtonGroup, Card, CardActions, CardContent, Checkbox, Collapse, Container, FormControl, FormControlLabel, FormGroup, IconButton, Input, InputAdornment, InputBaseComponentProps, InputLabel, List, ListItem, ListItemText, TextField } from '@material-ui/core'
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import React, { FC, useState } from 'react'
import { TimeSlot, createDefaultTimeSlot, minutesStep } from '../models/TimeSlot'
import DateFnsUtils from '@date-io/moment'
import Event from '@material-ui/icons/Event'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import FileCopy from '@material-ui/icons/FileCopy'
import MaskedInput from 'react-text-mask'
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date'
import { Moment } from 'moment'
import { Schedule } from '../models/Schedule'

type ScheduleWizardProps = {
  schedule: Schedule
  onSave: (schedule: Schedule) => void
  onCancel: () => void
}

type TimeSlotRowProps = {
  schedule: Schedule
  timeSlot: TimeSlot
  id: number
  onEditTimeSlotDateTime: (date: MaterialUiPickersDate) => void
  onDuplicateTimeSlot: () => void
  onRemoveTimeSlot: () => void
  onEditTimeSlotMaximumEntries: (maximumEntries: number) => void
  onEditTimeSlotparticipantsPerEntry: (participantsPerEntry: number) => void
}

type NonZeroNumberInputProps = {
  value: number | string
  inputRef: (ref: HTMLElement | null) => void
}

const NonZeroNumberInput = (props: NonZeroNumberInputProps) => {
  const { inputRef, ...other } = props

  return (
    <MaskedInput
      {...other}
      ref={ref => {
        inputRef(ref ? ref.inputElement : null)
      }}
      mask={[/[1-9]/, /\d/,]}
      guide={false}
    />
  )
}

export const ScheduleWizard: FC<ScheduleWizardProps> = (props: ScheduleWizardProps) => {
  const [schedule, setSchedule] = useState(props.schedule)

  const editTimeSlotDateTime = (moment: Moment | null, index: number) => {
    if (!moment) return
    const date = moment.toDate()
    schedule.timeSlots[index].dateTime = date
    schedule.timeSlots.sort(TimeSlot.compareFn)
    setSchedule({
      ...schedule,
      registrationLink: schedule.registrationLink,
    })
    Array.prototype.forEach.call(
      document.getElementsByClassName('Mui-focused'),
      element => element.classList.remove('Mui-focused'),
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
    schedule.timeSlots.splice(index, 0, { ...schedule.timeSlots[index], id: -1 })
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
          {schedule.timeSlots.map((timeSlot: TimeSlot, index) =>
            <TimeSlotRow
              key={`time-slot-${index}`}
              id={index}
              schedule={schedule}
              timeSlot={timeSlot}
              onEditTimeSlotDateTime={date => editTimeSlotDateTime(date, index)}
              onDuplicateTimeSlot={() => duplicateTimeSlot(index)}
              onRemoveTimeSlot={() => removeTimeSlot(index)}
              onEditTimeSlotMaximumEntries={(maximumEntries) => editTimeSlotMaximumEntries(maximumEntries, index)}
              onEditTimeSlotparticipantsPerEntry={participantsPerEntry => editTimeSlotparticipantsPerEntry(participantsPerEntry, index)}
            />
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

const TimeSlotRow: FC<TimeSlotRowProps> = (props: TimeSlotRowProps) => {
  const [open, setOpen] = useState(false)
  return <Card raised={true} className="time-slot-row">
    <CardContent>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <DateTimePicker
          id={`time-slot-date-${props.id}`}
          label="Date and time"
          value={props.timeSlot.dateTime}
          onChange={date => props.onEditTimeSlotDateTime(date)}
          minDate={new Date(2020, 0)}
          ampm={false}
          minutesStep={minutesStep}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <Event />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </MuiPickersUtilsProvider>
      <div className="number-input-container">
        <FormControl>
          <InputLabel htmlFor={`maximum-entries-${props.id}`}>Maximum entries</InputLabel>
          <Input
            id={`maximum-entries-${props.id}`}
            type='tel'
            inputProps={{ min: '1' }}
            onFocus={event => event.target.select()}
            value={props.timeSlot.maximumEntries}
            onChange={event => props.onEditTimeSlotMaximumEntries(parseInt(event.target.value, 10) || 1)}
            inputComponent={NonZeroNumberInput as FC<InputBaseComponentProps>}
          />
        </FormControl>
        <FormControl>
          <InputLabel htmlFor={`participants-per-entry-${props.id}`}>Participants per entry</InputLabel>
          <Input
            id={`participants-per-entry-${props.id}`}
            type='tel'
            inputProps={{ min: '1' }}
            onFocus={event => event.target.select()}
            value={props.timeSlot.participantsPerEntry}
            onChange={event => props.onEditTimeSlotparticipantsPerEntry(parseInt(event.target.value, 10) || 1)}
            inputComponent={NonZeroNumberInput as FC<InputBaseComponentProps>}
          />
        </FormControl>
        <IconButton
          color="primary"
          aria-label="duplicate time slot"
          component="button"
          onClick={() => props.onDuplicateTimeSlot()}
        >
          <FileCopy />
        </IconButton>
        {props.schedule.timeSlots.length > 1 &&
          <IconButton
            style={{ color: 'red' }}
            color="secondary"
            aria-label="remove time slot"
            component="button"
            onClick={() => props.onRemoveTimeSlot()}
          >
            &times;
      </IconButton>
        }
      </div>
      <div style={{ width: '100%' }}>
        <ListItem button onClick={() => setOpen(!open)}>
          <ListItemText
            primary={
              `(${props.timeSlot.registrations.length} / ${props.timeSlot.maximumEntries}` +
              ` entr${props.timeSlot.registrations.length === 1 ? 'y' : 'ies'})`
            }
          />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={open} timeout="auto" unmountOnExit style={{ paddingLeft: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {props.timeSlot.registrations.length === 0
              ? <div>No one registered for this time slot yet.</div>
              : props.timeSlot.registrations.map((registration, index) =>
                <List
                  key={`registration-${registration.id}`}
                  component="div"
                  dense={true}
                  disablePadding
                  subheader={
                    <ListItemText
                      style={{ marginTop: 0, textAlign: 'left' }}
                      secondary={
                        <span>
                          Entry #{index + 1}
                          <ButtonGroup
                            style={{ marginLeft: '16px' }}
                            color="primary"
                            size="small"
                            disabled={index !== 0}
                          >
                            <Button color="primary">Save</Button>
                            <Button color="secondary">Reset</Button>
                          </ButtonGroup>
                        </span>
                      }
                    />
                  }
                >
                  {registration.participants.map((participant, index) =>
                    <ListItem key={`participant-${index}`} style={{ alignItems: 'baseline', padding: '0 16px' }}>
                      <span>{index + 1}.&nbsp;</span>
                      <TextField
                        style={{ marginTop: 0 }}
                        value={participant}
                        onChange={event => { console.log(event) }}
                      />
                    </ListItem>
                  )}
                </List>
              )}
          </div>
        </Collapse>
      </div>
    </CardContent>
  </Card>
}
