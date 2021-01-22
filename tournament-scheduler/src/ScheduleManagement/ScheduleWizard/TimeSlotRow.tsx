import DateFnsUtils from '@date-io/moment'
import { Card, CardContent, Collapse, FormControl, IconButton, Input, InputAdornment, InputBaseComponentProps, InputLabel, ListItem, ListItemText } from '@material-ui/core'
import Event from '@material-ui/icons/Event'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import FileCopy from '@material-ui/icons/FileCopy'
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date'
import { FC, useState } from 'react'

import { apiDelete, apiPut } from '../../fetchers/Api'
import Registration, { RegistrationProxy } from '../../models/Registration'
import { Schedule } from '../../models/Schedule'
import { minutesStep, TimeSlot } from '../../models/TimeSlot'
import NonZeroNumberInput from './NonZeroNumberInput'
import RegistrationList from './RegistrationList'

const putRegistration = (registration: Registration) =>
  apiPut(`registrations/${registration.id}`, registration)

const deleteRegistration = (registrationId: number) =>
  apiDelete(`registrations/${registrationId}`)

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
          error={props.timeSlot.dateTime < props.schedule.deadline}
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

export default TimeSlotRow
