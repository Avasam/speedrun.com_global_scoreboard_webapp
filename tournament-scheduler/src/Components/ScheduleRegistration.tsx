import { Button, Card, CardActions, CardContent, Container, FormControl, FormGroup, FormLabel, InputLabel, Link, MenuItem, Select, TextField, Typography } from '@material-ui/core'
import type { SelectInputProps } from '@material-ui/core/Select/SelectInput'
import { StatusCodes } from 'http-status-codes'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useHistory } from 'react-router-dom'

import DisableDashlane from 'src/Components/DisableDashlane'
import { apiGet, apiPost } from 'src/fetchers/Api'
import type { ScheduleDto } from 'src/Models/Schedule'
import { Schedule } from 'src/Models/Schedule'
import { TimeSlot } from 'src/Models/TimeSlot'
import { addTime, diffDays, fancyFormat } from 'src/utils/Date'
import { getDeadlineDueText } from 'src/utils/ScheduleHelper'

type ScheduleRegistrationProps = {
  registrationId?: string
}

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
    .then(res => res.json().then((scheduleDto: ScheduleDto) => new Schedule(scheduleDto)))

const postRegistration = (timeSlotId: number, participants: string[], registrationKey: string) =>
  apiPost(`time-slots/${timeSlotId}/registrations`, { participants, registrationKey })
    .then(res => res.json())

const ScheduleRegistration = (props: ScheduleRegistrationProps) => {
  const [scheduleState, setScheduleState] = useState<Schedule | null | undefined>()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>()
  const [participants, setParticipants] = useState<string[]>([])
  const [formValidity, setFormValidity] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const history = useHistory()

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
    if (props.registrationId) return
    console.info('Current registrationId:', registrationId)

    getSchedule(...splitIdFromRegistrationKey())
      .then((schedule: Schedule) => {
        schedule.timeSlots.sort(TimeSlot.compareFn)
        setScheduleState(schedule)
      })
      .catch((err: Response) => {
        if (err.status === StatusCodes.NOT_FOUND) {
          setScheduleState(null)
        } else {
          console.error(err)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.registrationId])

  // Keep the registrationLink in localStorage so we can then hide it from the URL
  if (props.registrationId) {
    console.info('New registrationId:', props.registrationId)
    localStorage.setItem('registrationId', props.registrationId)
    history.push('/register')
    return <></>
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
      .then(() => history.push(`/view/${scheduleState?.id}`))
      .catch((err: Response) => {
        if (err.status === StatusCodes.INSUFFICIENT_STORAGE) {
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
          void err.json().then((response: { message: string, authenticated: boolean }) =>
            setErrorMessage(response.message))
        } else {
          console.error(err)
        }
      })
  }

  const deadlineDaysLeft = diffDays(scheduleState?.deadline)

  return <Container>
    <DisableDashlane />
    {!scheduleState
      ? scheduleState === null && <div>
        Sorry. `<code>{props.registrationId}</code>` does not lead to an existing registration form.
      </div>
      : <Card>
        <CardContent style={{ textAlign: 'left' }}>
          <FormLabel>Schedule for: {scheduleState.name}</FormLabel>
          <br />
          <Link component={RouterLink} to={`/view/${scheduleState.id}`}>
            Click here to view the current registrations
          </Link>
          <span style={{ display: 'block' }}>All dates and times are given in your local timezone.</span>

          {!scheduleState.active
            ? <div><br />Sorry. This schedule is currently inactive and registration is closed.</div>
            : scheduleState.deadline && scheduleState.deadline < new Date()
              ? <div>
                <br />Sorry. Registrations for this schedule are over (Deadline:
                {` ${fancyFormat(addTime(-1, 'Seconds', scheduleState.deadline))}`}).
              </div>
              : <FormGroup>
                {scheduleState.deadline && <div><br />{
                  `Registration deadline: ${fancyFormat(addTime(-1, 'Seconds', scheduleState.deadline))
                  } (${getDeadlineDueText(deadlineDaysLeft)})`}
                </div>}
                <FormControl variant='outlined' style={{ margin: '16px 0' }}>
                  <InputLabel
                    id='time-slot-select-label'
                    style={{ paddingRight: `${timeSlotLabelPaddingRight}px` }}
                  >
                    Choose your time slot amongst the following
                  </InputLabel>
                  <Select
                    labelId='time-slot-select-label'
                    id='time-slot-select'
                    value={selectedTimeSlot?.id ?? ''}
                    onChange={selectTimeSlot}
                    label='Choose your time slot amongst the following'
                  >
                    {scheduleState.timeSlots.map(timeSlot =>
                      <MenuItem
                        key={`timeslot-${timeSlot.id}`}
                        value={timeSlot.id}
                        disabled={entriesLeft(timeSlot) <= 0 || timeSlot.dateTime <= new Date()}
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
              </FormGroup>
          }
        </CardContent>
        <CardActions>
          <Button
            size='small'
            variant='contained'
            disabled={
              !formValidity ||
              !selectedTimeSlot ||
              entriesLeft(selectedTimeSlot) <= 0
            }
            onClick={() =>
              formValidity &&
              selectedTimeSlot &&
              entriesLeft(selectedTimeSlot) > 0 &&
              sendRegistrationForm()
            }
          >
            Sign {selectedTimeSlot?.participantsPerEntry === 1 ? 'me' : 'us'} up!
          </Button>
          <Typography color='error'>{errorMessage}</Typography>
        </CardActions>
      </Card>
    }

  </Container>
}

export default ScheduleRegistration
