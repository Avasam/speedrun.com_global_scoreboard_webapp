import { Card, CardContent, Collapse, IconButton, ListItem, ListItemText, TextField } from '@material-ui/core'
import { Event, ExpandLess, ExpandMore, FileCopy } from '@material-ui/icons'
import { LocalizationProvider, MobileDateTimePicker } from '@material-ui/lab'
import AdapterDateFns from '@material-ui/lab/AdapterDayjs'
import type { FC } from 'react'
import { useState } from 'react'

import NonZeroNumberInput from './NonZeroNumberInput'
import RegistrationList from './RegistrationList'
import { apiDelete, apiPut } from 'src/fetchers/Api'
import type { RegistrationProxy } from 'src/Models/Registration'
import type Registration from 'src/Models/Registration'
import type { Schedule } from 'src/Models/Schedule'
import type { TimeSlot } from 'src/Models/TimeSlot'
import { minutesStep } from 'src/Models/TimeSlot'
import { TIMESLOT_FORMAT } from 'src/utils/Date'

const MIN_YEAR = 2000

const putRegistration = (registration: Registration) =>
  apiPut(`registrations/${registration.id}`, registration)

const deleteRegistration = (registrationId: number) =>
  apiDelete(`registrations/${registrationId}`)

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
const createProxy = function <T>(registrations: T) {
  return JSON.parse(JSON.stringify(registrations)) as T
}

type TimeSlotRowProps = {
  schedule: Schedule
  timeSlot: TimeSlot
  id: number
  onEditTimeSlotDateTime: (date: Date | null) => void
  onDuplicateTimeSlot: () => void
  onRemoveTimeSlot: () => void
  onEditTimeSlotMaximumEntries: (maximumEntries: number) => void
  onEditTimeSlotparticipantsPerEntry: (participantsPerEntry: number) => void
}

const TimeSlotRow: FC<TimeSlotRowProps> = (props: TimeSlotRowProps) => {
  const [open, setOpen] = useState(false)
  const [registrationsProxy, setRegistrationsProxy] = useState<RegistrationProxy[]>(
    createProxy(props.timeSlot.registrations)
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

        setRegistrationsProxy(createProxy(registrationsProxy))
      })
      .catch(console.error)

  const handleResetRegistrations = (registrationIndex: number) => {
    registrationsProxy[registrationIndex] = {
      ...props.timeSlot.registrations[registrationIndex],
      hasChanged: false,
    }
    setRegistrationsProxy(createProxy(registrationsProxy))
  }

  const handleRemoveRegistrations = (registrationIndex: number) =>
    deleteRegistration(props.timeSlot.registrations[registrationIndex].id)
      .then(() => {
        props.timeSlot.registrations.splice(registrationIndex, 1)
        registrationsProxy.splice(registrationIndex, 1)
        setRegistrationsProxy(createProxy(registrationsProxy))
      })
      .catch(console.error)

  return <Card raised={true} className='time-slot-row error-as-warning'>
    <CardContent>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MobileDateTimePicker
          label='Date and time'
          inputFormat={TIMESLOT_FORMAT}
          value={props.timeSlot.dateTime}
          onChange={date => props.onEditTimeSlotDateTime(date)}
          minDate={new Date(MIN_YEAR, 0)}
          disablePast={props.timeSlot.id <= -1}
          ampm={false}
          minutesStep={minutesStep}
          InputProps={{ endAdornment: <Event /> }}
          renderInput={params =>
            <TextField
              {...params}
              id={`time-slot-date-${props.id}`}
              error={!!props.schedule.deadline && props.timeSlot.dateTime < props.schedule.deadline}
            />}
        />
      </LocalizationProvider>
      <div className='number-input-container'>
        <TextField
          id={`maximum-entries-${props.id}`}
          label='Maximum entries'
          type='tel'
          inputProps={{ min: '1', inputComponent: { NonZeroNumberInput } }}
          onFocus={event => event.target.select()}
          value={props.timeSlot.maximumEntries}
          onChange={event => props.onEditTimeSlotMaximumEntries(Number.parseInt(event.target.value, 10) || 1)}
        />
        <TextField
          id={`participants-per-entry-${props.id}`}
          label='Participants per entry'
          type='tel'
          inputProps={{ min: '1', inputComponent: { NonZeroNumberInput } }}
          onFocus={event => event.target.select()}
          value={props.timeSlot.participantsPerEntry}
          onChange={event => props.onEditTimeSlotparticipantsPerEntry(Number.parseInt(event.target.value, 10) || 1)}
        />
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
            className='error'
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
                  : undefined,
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
