import type { Theme } from '@material-ui/core'
import { Card, CardContent, Collapse, IconButton, ListItem, ListItemText, Stack, TextField } from '@material-ui/core'
import { Clear, Event, ExpandLess, ExpandMore, FileCopy } from '@material-ui/icons'
import { MobileDateTimePicker } from '@material-ui/lab'
import type { SxProps } from '@material-ui/system'
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

const numberInputsStyle = {
  '&>div:not(style)': {
    marginTop: 1,
    '&:not(:last-of-type)': {
      marginRight: 1.5,
    },
  },
  '.MuiFormControl-root': {
    width: '64px',
    '[for^="maximum-entries-"], [for^="participants-per-entry-"]': {
      marginTop: -2,
      whiteSpace: 'unset',
      textOverflow: 'unset',
    },
  },
} as SxProps<Theme>

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

const TimeSlotRow = (props: TimeSlotRowProps) => {
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

  return <Card raised={true} className='error-as-warning'>
    <CardContent component={Stack} direction='row' sx={numberInputsStyle} flexWrap='wrap-reverse'>
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
            style={{ width: '222px', minWidth: '222px' }} // Enough to fit 'Wed Jun 22nd 2022, 22:22'
          />}
      />
      <Stack direction='row' spacing={1.5}>
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
          aria-label='duplicate time slot'
          component='button'
          onClick={() => props.onDuplicateTimeSlot()}
        ><FileCopy /></IconButton>
        {props.schedule.timeSlots.length > 1 &&
          <IconButton
            className='error'
            aria-label='remove time slot'
            component='button'
            onClick={() => props.onRemoveTimeSlot()}
          ><Clear /></IconButton>
        }
      </Stack>
    </CardContent>
    <CardContent>
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
        <Stack direction='row'>
          {props.timeSlot.registrations.length === 0
            ? <span>No one registered for this time slot yet.</span>
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
        </Stack>
      </Collapse>
    </CardContent>
  </Card>
}

export default TimeSlotRow
