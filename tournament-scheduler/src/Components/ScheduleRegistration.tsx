import { Button, Card, CardActions, CardContent, Container, FormControl, FormGroup, FormLabel, InputLabel, Link, MenuItem, Select, TextField, Typography } from '@mui/material'
import type { SelectInputProps } from '@mui/material/Select/SelectInput'
import { StatusCodes } from 'http-status-codes'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import DisableDashlane from 'src/Components/DisableDashlane'
import { apiGet, apiPost } from 'src/fetchers/api'
import type { ScheduleDto } from 'src/Models/Schedule'
import { Schedule } from 'src/Models/Schedule'
import { TimeSlot } from 'src/Models/TimeSlot'
import { addTime, diffDays, fancyFormat } from 'src/utils/date'
import { getDeadlineDueText } from 'src/utils/scheduleHelper'

const timeSlotLabelPaddingRight = 40

const entriesLeft = (timeSlot: TimeSlot) => timeSlot.maximumEntries - timeSlot.registrations.length

const entriesLeftText = (timeSlot: TimeSlot) => {
  if (timeSlot.dateTime <= new Date()) return 'past deadline'
  if (entriesLeft(timeSlot) <= 0) return 'full'
  const left = entriesLeft(timeSlot)

  return `${left} / ${timeSlot.maximumEntries} entr${left === 1 ? 'y' : 'ies'} left`
}

const getSchedule = (id: number, registrationKey: string) =>
  apiGet(`schedules/${id}`, { registrationKey })
    .then(response => response.json().then((scheduleDto: ScheduleDto) => new Schedule(scheduleDto)))

const postRegistration = (timeSlotId: number, participants: string[], registrationKey: string) =>
  apiPost(`time-slots/${timeSlotId}/registrations`, { participants, registrationKey })
    .then(response => response.json())

const ScheduleRegistration = () => {
  const [scheduleState, setScheduleState] = useState<Schedule | null | undefined>()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>()
  const [participants, setParticipants] = useState<string[]>([])
  const [formValidity, setFormValidity] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const routeParams = useParams()
  const navigate = useNavigate()

  // Take registrationLink from the localStorage
  const registrationId = localStorage.getItem('registrationId') ?? ''

  useEffect(() => {
    const participantCount = selectedTimeSlot?.participantsPerEntry
    const actualParticipants = participants.slice(0, participantCount)
    const valid = actualParticipants.length === participantCount &&
      actualParticipants.every(participant => !!participant)
    setFormValidity(valid)
  }, [selectedTimeSlot, participants])

  const splitIdFromRegistrationKey = () => {
    const splitIndex = registrationId.indexOf('-')
    const id = Number.parseInt(registrationId.slice(0, Math.max(0, splitIndex)))
    const registrationKey = registrationId.slice(splitIndex + 1)

    return [id, registrationKey] as [number, string]
  }

  useEffect(() => {
    if (routeParams.registrationId) return
    console.info('Current registrationId:', registrationId)

    getSchedule(...splitIdFromRegistrationKey())
      .then((schedule: Schedule) => {
        schedule.timeSlots.sort(TimeSlot.compareFn)
        setScheduleState(schedule)
      })
      .catch((error: Response) => {
        if (error.status === StatusCodes.NOT_FOUND) {
          setScheduleState(null)
        } else {
          console.error(error)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeParams.registrationId])

  // Keep the registrationLink in localStorage so we can then hide it from the URL
  if (routeParams.registrationId) {
    console.info('New registrationId:', routeParams.registrationId)
    localStorage.setItem('registrationId', routeParams.registrationId)
    navigate('/register')
    return <>{undefined}</>
  }

  const selectTimeSlot: SelectInputProps['onChange'] = event => {
    const eventValue = Number.parseInt(event.target.value as string)
    setSelectedTimeSlot(scheduleState?.timeSlots.find(timeSlot => timeSlot.id === eventValue))
    setErrorMessage('')
  }

  const handleParticipantChange = (index: number, name: string) => {
    participants[index] = name
    setParticipants([...participants])
  }

  const sendRegistrationForm = () => {
    if (!selectedTimeSlot) return
    postRegistration(
      selectedTimeSlot.id,
      participants.slice(0, selectedTimeSlot.participantsPerEntry),
      splitIdFromRegistrationKey()[1]
    )
      .then(() => navigate(`/view/${scheduleState?.id}`))
      .catch((error: Response) => {
        if (error.status === StatusCodes.INSUFFICIENT_STORAGE) {
          if (!scheduleState) {
            return
          }
          const index = scheduleState.timeSlots.findIndex(timeSlot => timeSlot.id === selectedTimeSlot.id)
          scheduleState.timeSlots[index].maximumEntries = 0
          setScheduleState({
            ...scheduleState,
            registrationLink: scheduleState.registrationLink,
          })
          setSelectedTimeSlot(scheduleState.timeSlots[index])
          void error
            .json()
            .then((response: { message: string, authenticated: boolean }) => setErrorMessage(response.message))
        } else {
          console.error(error)
        }
      })
  }

  const deadlineDaysLeft = diffDays(scheduleState?.deadline)

  return <Container>
    <DisableDashlane />
    {!scheduleState
      ? scheduleState === null && <div>
        Sorry. `
        {/**/}
        <code>{routeParams.registrationId}</code>
        {/**/}
        ` does not lead to an existing registration form.
      </div>
      : <Card>
        <CardContent style={{ textAlign: 'left' }}>
          <FormLabel>
            Schedule for:
            {' '}
            {scheduleState.name}
          </FormLabel>
          <br />
          <Link component={RouterLink} to={`/view/${scheduleState.id}`}>
            Click here to view the current registrations
          </Link>
          <span style={{ display: 'block' }}>All dates and times are given in your local timezone.</span>

          {!scheduleState.active
            ? <div>
              <br />
              Sorry. This schedule is currently inactive and registration is closed.
            </div>
            : scheduleState.deadline && scheduleState.deadline < new Date()
              ? <div>
                <br />
                Sorry. Registrations for this schedule are over (Deadline:
                {` ${fancyFormat(addTime(-1, 'Seconds', scheduleState.deadline))}`}
                ).
              </div>
              : <FormGroup>
                {scheduleState.deadline && <div>
                  <br />
                  {
                    `Registration deadline: ${fancyFormat(addTime(-1, 'Seconds', scheduleState.deadline))
                    } (${getDeadlineDueText(deadlineDaysLeft)})`
                  }
                </div>}
                <FormControl style={{ margin: '16px 0' }} variant='outlined'>
                  <InputLabel
                    id='time-slot-select-label'
                    style={{ paddingRight: `${timeSlotLabelPaddingRight}px` }}
                  >
                    Choose your time slot amongst the following
                  </InputLabel>
                  <Select
                    id='time-slot-select'
                    label='Choose your time slot amongst the following'
                    labelId='time-slot-select-label'
                    onChange={selectTimeSlot}
                    value={selectedTimeSlot?.id ?? ''}
                  >
                    {scheduleState.timeSlots.map(timeSlot =>
                      <MenuItem
                        disabled={entriesLeft(timeSlot) <= 0 || timeSlot.dateTime <= new Date()}
                        key={`timeslot-${timeSlot.id}`}
                        value={timeSlot.id}
                      >
                        {`${fancyFormat(timeSlot.dateTime)} (${entriesLeftText(timeSlot)})`}
                      </MenuItem>)}
                  </Select>
                </FormControl>
                {selectedTimeSlot && entriesLeft(selectedTimeSlot) > 0 &&
                  <>
                    <FormLabel>
                      Please write down your name
                      {selectedTimeSlot.participantsPerEntry > 1 &&
                        ' as well as all other participants playing with or against you in the same match'}
                    </FormLabel>
                    {Array.from(
                      { length: selectedTimeSlot.participantsPerEntry },
                      (_, index) => {
                        const participantNumber = selectedTimeSlot.participantsPerEntry > 1 ? ` ${index + 1}` : ''

                        return <TextField
                          key={`participant-${index}`}
                          label={`Participant${participantNumber}'s name`}
                          onChange={event => handleParticipantChange(index, event.target.value)}
                        />
                      }
                    )}
                  </>}
              </FormGroup>}
        </CardContent>
        <CardActions>
          <Button
            disabled={
              !formValidity ||
              !selectedTimeSlot ||
              entriesLeft(selectedTimeSlot) <= 0
            }
            onClick={() =>
              formValidity &&
              selectedTimeSlot &&
              entriesLeft(selectedTimeSlot) > 0 &&
              sendRegistrationForm()}
            size='small'
            variant='contained'
          >
            Sign
            {selectedTimeSlot?.participantsPerEntry === 1 ? ' me ' : ' us '}
            up!
          </Button>
          <Typography color='error'>{errorMessage}</Typography>
        </CardActions>
      </Card>}

  </Container>
}

export default ScheduleRegistration
