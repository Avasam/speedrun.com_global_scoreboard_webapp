import Clear from '@mui/icons-material/Clear'
import Event  from '@mui/icons-material/Event'
import  ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore  from '@mui/icons-material/ExpandMore'
import  FileCopy from '@mui/icons-material/FileCopy'
import { MobileDateTimePicker } from '@mui/lab'
import type { Theme } from '@mui/material'
import { Card, CardContent, Collapse, IconButton, ListItem, ListItemText, Stack, TextField, Typography } from '@mui/material'
import type { SxProps } from '@mui/system'
import dayjs from 'dayjs'
import type { MouseEventHandler } from 'react'
import { useState } from 'react'

import NonZeroNumberInput from './NonZeroNumberInput'
import RegistrationList from './RegistrationList'
import { apiDelete, apiPut } from 'src/fetchers/api'
import type { RegistrationProxy } from 'src/Models/Registration'
import type Registration from 'src/Models/Registration'
import type { Schedule } from 'src/Models/Schedule'
import type { TimeSlot } from 'src/Models/TimeSlot'
import { minutesStep } from 'src/Models/TimeSlot'
import { TIMESLOT_FORMAT } from 'src/utils/date'
import type { NonFunctionProperties } from 'src/utils/objectUtils'
import { createProxy } from 'src/utils/objectUtils'

const MIN_YEAR = 2000
export const FOCUS_CLASS = 'time-slot-focus'

const putRegistration = (registration: Registration) =>
  apiPut(`registrations/${registration.id}`, registration)

const deleteRegistration = (registrationId: number) =>
  apiDelete(`registrations/${registrationId}`)

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
  schedule: NonFunctionProperties<Schedule>
  timeSlot: TimeSlot
  id: string
  onEditTimeSlotDateTime: (date: Date | null | undefined) => void
  onDuplicateTimeSlot: () => void
  onRemoveTimeSlot: () => void
  onEditTimeSlotMaximumEntries: (maximumEntries: number) => void
  onEditTimeSlotparticipantsPerEntry: (participantsPerEntry: number) => void
  isCurrentFocus: boolean
  onFocus: MouseEventHandler<HTMLDivElement>
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

  const handleDelete: MouseEventHandler<HTMLButtonElement> = event => {
    // Prevent loosing current focus
    event.stopPropagation()
    props.onRemoveTimeSlot()
  }

  return <Card
    onClick={props.onFocus}
    raised
    sx={{ borderStyle: props.isCurrentFocus ? 'groove' : 'none' }}
  >
    <CardContent component={Stack} direction='row' flexWrap='wrap-reverse' sx={numberInputsStyle}>
      <MobileDateTimePicker
        InputProps={{ endAdornment: <Event /> }}
        ampm={false}
        disableCloseOnSelect
        disablePast={props.timeSlot.id <= -1}
        inputFormat={TIMESLOT_FORMAT}
        label='Date and time'
        minDate={dayjs().set('year', MIN_YEAR)}
        minutesStep={minutesStep}
        onChange={date => props.onEditTimeSlotDateTime(date?.toDate())}
        renderInput={params =>
          <TextField
            {...params}
            error={!!props.schedule.deadline && props.timeSlot.dateTime < props.schedule.deadline}
            id={`time-slot-date-${props.id}`}
            style={{ width: '222px', minWidth: '222px' }} // Enough to fit 'Wed Jun 22nd 2022, 22:22'
          />}
        showTodayButton
        value={props.timeSlot.dateTime}
      />
      <Stack alignItems='center' direction='row' spacing={1.5}>
        <TextField
          id={`maximum-entries-${props.id}`}
          inputProps={{ min: '1', inputComponent: { NonZeroNumberInput } }}
          label='Maximum entries'
          onChange={event => props.onEditTimeSlotMaximumEntries(Number.parseInt(event.target.value, 10) || 1)}
          onFocus={event => event.target.select()}
          type='tel'
          value={props.timeSlot.maximumEntries}
        />
        <TextField
          id={`participants-per-entry-${props.id}`}
          inputProps={{ min: '1', inputComponent: { NonZeroNumberInput } }}
          label='Participants per entry'
          onChange={event => props.onEditTimeSlotparticipantsPerEntry(Number.parseInt(event.target.value, 10) || 1)}
          onFocus={event => event.target.select()}
          type='tel'
          value={props.timeSlot.participantsPerEntry}
        />
        <IconButton
          aria-label='duplicate time slot'
          component='button'
          onClick={() => props.onDuplicateTimeSlot()}
          size='large'
        >
          <FileCopy />
        </IconButton>
        {props.schedule.timeSlots.length > 1 &&
        <IconButton
          aria-label='remove time slot'
          color='error'
          component='button'
          onClick={handleDelete}
          size='large'
        >
          <Clear />
        </IconButton>}
      </Stack>
    </CardContent>
    <CardContent>
      <ListItem button onClick={() => setOpen(!open)}>
        <ListItemText
          primary={
            <Typography
              color={props.timeSlot.registrations.length > props.timeSlot.maximumEntries
                ? 'error'
                : undefined}
            >
              (
              {props.timeSlot.registrations.length}
              {' / '}
              {props.timeSlot.maximumEntries}
              {' entr'}
              {props.timeSlot.registrations.length === 1 ? 'y' : 'ies'}
              )
            </Typography>
          }
        />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} style={{ paddingLeft: '16px' }} timeout='auto' unmountOnExit>
        <Stack direction='row' flexWrap='wrap'>
          {props.timeSlot.registrations.length === 0
            ? <span>No one registered for this time slot yet.</span>
            : registrationsProxy.map((registrationProxy, index) =>
              <RegistrationList
                index={index}
                key={`registration-${registrationProxy.id}`}
                onDelete={handleRemoveRegistrations}
                onParticipantNameChange={handleParticipantNameChange}
                onReset={handleResetRegistrations}
                onSave={handleSaveRegistrations}
                participantsPerEntry={props.timeSlot.participantsPerEntry}
                registration={registrationProxy}
              />)}
        </Stack>
      </Collapse>
    </CardContent>
  </Card >
}

export default TimeSlotRow
