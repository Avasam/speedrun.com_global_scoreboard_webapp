import './ScheduleWizard.css'
import { Button, ButtonGroup, Card, CardActions, CardContent, Checkbox, Collapse, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormGroup, IconButton, Input, InputAdornment, InputBaseComponentProps, InputLabel, List, ListItem, ListItemText, TextField } from '@material-ui/core'
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import { FC, useState } from 'react'
import { TimeSlot, createDefaultTimeSlot, minutesStep } from '../models/TimeSlot'
import { apiDelete, apiPut } from '../fetchers/Api'
import DateFnsUtils from '@date-io/moment'
import DeleteForever from '@material-ui/icons/DeleteForever'
import Event from '@material-ui/icons/Event'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import FileCopy from '@material-ui/icons/FileCopy'
import MaskedInput from 'react-text-mask'
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date'
import { Moment } from 'moment'
import Registration from '../models/Registration'
import { Schedule } from '../models/Schedule'

// TODO: Extract TimeSlot / RegistrationList

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
    schedule.timeSlots.splice(index, 0, { ...schedule.timeSlots[index], id: -1, registrations: [] })
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
          onClick={() => props.onSave(schedule)}
        >
          Save
        </Button>
      </CardActions>
    </Card>
  </Container>

}

const putRegistration = (registration: Registration) =>
  apiPut(`registrations/${registration.id}`, registration)

const deleteRegistration = (registrationId: number) =>
  apiDelete(`registrations/${registrationId}`)

interface RegistrationProxy extends Registration {
  hasChanged?: boolean
}

const TimeSlotRow: FC<TimeSlotRowProps> = (props: TimeSlotRowProps) => {
  const [open, setOpen] = useState(false)
  const [registrationsProxy, setRegistrationsProxy] = useState<RegistrationProxy[]>(
    JSON.parse(JSON.stringify(props.timeSlot.registrations))
  )

  const handleParticipantNameChange = (registration: RegistrationProxy, participantIndex: number, name: string) => {
    registration.hasChanged = true
    registration.participants[participantIndex] = name
    setRegistrationsProxy([...registrationsProxy])
  }

  const handleSaveRegistrations = (registrationProxy: RegistrationProxy) =>
    putRegistration(registrationProxy)
      .then(() => {
        const updatedRegistration = props.timeSlot.registrations.find(registration =>
          registration.id === registrationProxy.id)
        if (updatedRegistration) {
          updatedRegistration.participants = [...registrationProxy.participants]
        }
        registrationProxy.hasChanged = false

        setRegistrationsProxy(JSON.parse(JSON.stringify(registrationsProxy)))
      })
      .catch(console.error)

  const handleResetRegistrations = (registrationIndex: number) => {
    registrationsProxy[registrationIndex] = {
      ...props.timeSlot.registrations[registrationIndex],
      hasChanged: false,
    }
    setRegistrationsProxy(JSON.parse(JSON.stringify(registrationsProxy)))
  }

  const handleRemoveRegistrations = (registrationIndex: number) =>
    deleteRegistration(props.timeSlot.registrations[registrationIndex].id)
      .then(() => {
        props.timeSlot.registrations.splice(registrationIndex, 1)
        registrationsProxy.splice(registrationIndex, 1)
        setRegistrationsProxy(JSON.parse(JSON.stringify(registrationsProxy)))
      })
      .catch(console.error)

  return <Card raised={true} className='time-slot-row'>
    <CardContent>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <DateTimePicker
          id={`time-slot-date-${props.id}`}
          label='Date and time'
          value={props.timeSlot.dateTime}
          onChange={date => props.onEditTimeSlotDateTime(date)}
          minDate={new Date(2020, 0)}
          disablePast={props.timeSlot.id <= -1}
          ampm={false}
          minutesStep={minutesStep}
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
      <div className='number-input-container'>
        <FormControl>
          <InputLabel htmlFor={`maximum-entries-${props.id}`}>Maximum entries</InputLabel>
          <Input
            id={`maximum-entries-${props.id}`}
            type='tel'
            inputProps={{ min: '1' }}
            onFocus={event => event.target.select()}
            value={props.timeSlot.maximumEntries}
            onChange={event => props.onEditTimeSlotMaximumEntries(Number.parseInt(event.target.value, 10) || 1)}
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
            onChange={event => props.onEditTimeSlotparticipantsPerEntry(Number.parseInt(event.target.value, 10) || 1)}
            inputComponent={NonZeroNumberInput as FC<InputBaseComponentProps>}
          />
        </FormControl>
        <IconButton
          color='primary'
          aria-label='duplicate time slot'
          component='button'
          onClick={() => props.onDuplicateTimeSlot()}
        >
          <FileCopy />
        </IconButton>
        {props.schedule.timeSlots.length > 1 &&
          <IconButton
            style={{ color: 'red' }}
            color='secondary'
            aria-label='remove time slot'
            component='button'
            onClick={() => props.onRemoveTimeSlot()}
          >&times;</IconButton>
        }
      </div>
      <div style={{ width: '100%' }}>
        <ListItem button onClick={() => setOpen(!open)}>
          <ListItemText
            primary={
              <span style={{
                color: props.timeSlot.registrations.length > props.timeSlot.maximumEntries
                  ? 'red'
                  : undefined
              }}>
                ({props.timeSlot.registrations.length} / {props.timeSlot.maximumEntries}
                &nbsp;entr{props.timeSlot.registrations.length === 1 ? 'y' : 'ies'})
              </span>
            }
          />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={open} timeout='auto' unmountOnExit style={{ paddingLeft: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {props.timeSlot.registrations.length === 0
              ? <div>No one registered for this time slot yet.</div>
              : registrationsProxy.map((registrationProxy, index) =>
                <RegistrationList
                  key={`registration-${registrationProxy.id}`}
                  registration={registrationProxy}
                  index={index}
                  participantsPerEntry={props.timeSlot.participantsPerEntry}
                  onDelete={handleRemoveRegistrations}
                  onSave={handleSaveRegistrations}
                  onReset={handleResetRegistrations}
                  onParticipantNameChange={handleParticipantNameChange}
                />)}
          </div>
        </Collapse>
      </div>
    </CardContent>
  </Card>
}

type RegistrationListProps = {
  registration: RegistrationProxy
  index: number
  participantsPerEntry: number
  onDelete: (index: number) => void
  onSave: (registration: Registration) => void
  onReset: (index: number) => void
  onParticipantNameChange: (registration: RegistrationProxy, participantIndex: number, name: string) => void
}

const RegistrationList: FC<RegistrationListProps> = (props: RegistrationListProps) => {
  const [open, setOpen] = useState(false)

  const handleClose = (confirmed: boolean) => {
    confirmed && props.onDelete(props.index)
    setOpen(false)
  }

  return <List
    component='div'
    dense={true}
    disablePadding
    subheader={
      <div>
        <ListItemText
          style={{ marginTop: 0, textAlign: 'left', display: 'inline-block' }}
          secondary={
            <span>
              Entry #{props.index + 1}
            </span>
          }
        />
        <ButtonGroup
          style={{ marginLeft: '16px' }}
          color='primary'
          size='small'
          disabled={!props.registration.hasChanged}
        >
          <Button color='primary' onClick={() => props.onSave(props.registration)}>Save</Button>
          <Button color='secondary' onClick={() => props.onReset(props.index)}>Reset</Button>
        </ButtonGroup>
        <IconButton
          style={{ color: 'red' }}
          color='secondary'
          aria-label='remove time slot'
          component='button'
          onClick={() => setOpen(true)}
        ><DeleteForever /></IconButton>

        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>Permanently delete this entry?</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Are you sure that you want to delete entry #{props.index + 1} of this time slot forever?
              This action will take effect immediatly and is irreversible.
              <strong><i> Make sure you have noticed the participants as you will not be able to retrieve this entry after this point!</i></strong>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleClose(false)} autoFocus>
              Cancel
            </Button>
            <Button
              onClick={() => handleClose(true)}
              variant='outlined'
              color='secondary'
              style={{ color: 'red' }}
            >
              <strong>Yes, delete this entry</strong>
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    }
  >
    {props.registration
      .participants
      .concat(
        new Array(Math.max(0, props.participantsPerEntry - props.registration.participants.length))
          .fill('')
      )
      .map((participant: string, index) =>
        <ListItem
          key={`participant-${index}`}
          style={{
            alignItems: 'baseline',
            padding: '0 16px',
            color: index >= props.participantsPerEntry ? 'red' : undefined
          }}>
          <span>{index + 1}.&nbsp;</span>
          <TextField
            error={index >= props.participantsPerEntry}
            style={{ marginTop: 0 }}
            value={participant}
            onChange={event => props.onParticipantNameChange(
              props.registration,
              index,
              event.target.value,
            )}
          />
        </ListItem>)}
  </List>
}
