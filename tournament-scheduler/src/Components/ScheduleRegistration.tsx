import DateFnsUtils from '@date-io/moment'
import { Button, Card, CardActions, CardContent, Container, FormControl, FormGroup, FormLabel, InputLabel, Link, MenuItem, Select, TextField } from '@material-ui/core'
import type { SelectInputProps } from '@material-ui/core/Select/SelectInput'
import { StatusCodes } from 'http-status-codes'
import moment from 'moment'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useHistory } from 'react-router-dom'

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

const fancyFormat = (date: Date) =>
  moment(date).format(`ddd ${new DateFnsUtils().dateTime24hFormat}`)

const entriesLeft = (timeSlot: TimeSlot) => timeSlot.maximumEntries - timeSlot.registrations.length

const getSchedule = (id: number, registrationKey: string) =>
  apiGet(`schedules/${id}`, { registrationKey })
    .then(res => res.json().then((scheduleDto: ScheduleDto) => new Schedule(scheduleDto)))

const postRegistration = (timeSlotId: number, participants: string[], registrationKey: string) =>
  apiPost(`time-slots/${timeSlotId}/registrations`, { participants, registrationKey })
    .then(res => res.json())

const ScheduleRegistration: FC<ScheduleRegistrationProps> = (props: ScheduleRegistrationProps) => {
  const [scheduleState, setScheduleState] = useState<Schedule | null | undefined>()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>()
  const [timeSlotLabelWidth, setTimeSlotLabelWidth] = useState(0)
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

  useEffect(() => {
    if (props.registrationId) return

    console.info('Current registrationId:', registrationId)
    const splitIndex = registrationId.indexOf('-')
    const id = Number.parseInt(registrationId.slice(0, Math.max(0, splitIndex)))
    const registrationKey = registrationId.slice(splitIndex + 1)
    getSchedule(id, registrationKey)
      .then((schedule: Schedule) => {
        schedule.timeSlots.sort(TimeSlot.compareFn)
        setScheduleState(schedule)
        setTimeSlotLabelWidth((timeSlotInputLabel.current?.offsetWidth ?? 0) - timeSlotLabelPaddingRight)
      })
      .catch((err: Response) => {
        if (err.status === StatusCodes.NOT_FOUND) {
          setScheduleState(null)
        } else {
          console.error(err)
        }
      })
  }, [props.registrationId, registrationId])

  // Keep the registrationLink in localStorage so we can then hide it from the URL
  if (props.registrationId) {
    console.info('New registrationId:', props.registrationId)
    localStorage.setItem('registrationId', props.registrationId)
    history.push('/register')
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
      registrationId
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
    {!scheduleState
      ? scheduleState === null && <div>
        Sorry. `<code>{props.registrationId}</code>` does not lead to an existing registration form.
      </div>
      : <Card>
        <CardContent style={{ textAlign: 'left' }}>
          <label>Schedule for: {scheduleState.name}</label>
          <br />
          <Link component={RouterLink} to={`/view/${scheduleState.id}`}>
            Click here to view the current registrations
          </Link>
          <span style={{ display: 'block' }}>All dates and times are given in your local timezone.</span>

          {!scheduleState.active
            ? <div><br />Sorry. This schedule is currently inactive and registration is closed.</div>
            : scheduleState.deadline && scheduleState.deadline < new Date()
              ? <div>
                <br />Sorry. Registrations for this schedule are over (Deadline: {fancyFormat(scheduleState.deadline)}).
              </div>
              : <FormGroup>
                {scheduleState.deadline && <div><br />{
                  `Registration deadline: ${fancyFormat(scheduleState.deadline)
                  } (${deadlineDaysLeft} day${deadlineDaysLeft === 1 ? '' : 's'
                  } left)`}
                </div>}
                <FormControl variant='outlined' style={{ margin: '16px 0' }}>
                  <InputLabel
                    ref={timeSlotInputLabel}
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
                    labelWidth={timeSlotLabelWidth}
                  >
                    {scheduleState.timeSlots.map(timeSlot =>
                      <MenuItem
                        key={`timeslot-${timeSlot.id}`}
                        value={timeSlot.id}
                        disabled={entriesLeft(timeSlot) <= 0 || timeSlot.dateTime <= new Date()}
                      >{
                          `${fancyFormat(timeSlot.dateTime)
                          } (${timeSlot.dateTime <= new Date()
                            ? 'past deadline'
                            : entriesLeft(timeSlot) <= 0
                              ? 'full'
                              : `${entriesLeft(timeSlot)} / ${timeSlot.maximumEntries}` +
                              ` entr${entriesLeft(timeSlot) === 1 ? 'y' : 'ies'} left`
                          })`
                        }</MenuItem>)}
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
                      (_, index) =>
                        <TextField
                          key={`participant-${index}`}
                          label={
                            `Participant${selectedTimeSlot.participantsPerEntry > 1 ? ` ${index + 1}` : ''}'s name`
                          }
                          onChange={event => handleParticipantChange(index, event.target.value)}
                        />
                    )}
                  </>}
              </FormGroup>
          }
        </CardContent>
        <CardActions>
          <Button
            size='small'
            variant='contained'
            color='primary'
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
          <span style={{ color: 'red' }}>{errorMessage}</span>
        </CardActions>
      </Card>
    }

  </Container>
}

export default ScheduleRegistration
