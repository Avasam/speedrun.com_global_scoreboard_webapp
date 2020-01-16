import { Button, Card, CardActions, CardContent, Container, FormControl, FormGroup, FormLabel, InputLabel, MenuItem, Select, TextField } from '@material-ui/core'
import React, { ChangeEvent, FC, useEffect, useRef, useState } from 'react'
import { Schedule, ScheduleDto } from '../models/Schedule'
import DateFnsUtils from '@date-io/moment'
import { TimeSlot } from '../models/TimeSlot'
import moment from 'moment'

interface ScheduleRegistrationProps {
  registrationLink: string
}

const entriesLeft = (timeSlot: TimeSlot) => timeSlot.maximumEntries - timeSlot.registrations.length

const timeSlotLabelPaddingRight = 40

const getSchedule = (id: number, registrationKey: string) =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/schedules/${id}?registrationKey=${registrationKey}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
  })
    .then(res => res.status >= 400 && res.status < 600
      ? Promise.reject(res)
      : res)
    .then(res => res.json().then((scheduleDto: ScheduleDto) => new Schedule(scheduleDto)))

const postRegistration = (timeSlotId: number, participants: string[], registrationKey: string) =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/time-slots/${timeSlotId}/registrations`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
    body: JSON.stringify({ participants, registrationKey }),
  })
    .then(res => res.status >= 400 && res.status < 600
      ? Promise.reject(res)
      : res)
    .then(res => res.json())

const ScheduleRegistration: FC<ScheduleRegistrationProps> = (props: ScheduleRegistrationProps) => {
  const [schedule, setSchedule] = useState<Schedule | undefined | null>(undefined)
  const [registrationKey, setRegistrationKey] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>()
  const [timeSlotLabelWidth, setTimeSlotLabelWidth] = useState(0)
  const [participants, setParticipants] = useState<string[]>([])
  const [formValidity, setFormValidity] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const timeSlotInputLabel = useRef<HTMLLabelElement>(null)

  useEffect(() => {
    const splitIndex = props.registrationLink.indexOf('-')
    const id = parseInt(props.registrationLink.substr(0, splitIndex))
    const registrationKey = props.registrationLink.substr(splitIndex + 1)
    setRegistrationKey(registrationKey)
    getSchedule(id, registrationKey)
      .then((schedule: Schedule) => {
        schedule.timeSlots.sort(TimeSlot.compareFn)
        setSchedule(schedule)
        setTimeSlotLabelWidth((timeSlotInputLabel.current?.offsetWidth || 0) - timeSlotLabelPaddingRight)
        setParticipants(
          Array.apply('', Array(
            Math.max(
              schedule
                .timeSlots
                .map(timeSlot => timeSlot.maximumEntries)
                .reduce((a, b) => Math.max(a, b), 0)
            )
          )) as string[]
        )
      })
      .catch(err => {
        if (err.status === 404) {
          setSchedule(null)
        } else {
          console.error(err)
        }
      })
  }, [props.registrationLink])

  const selectTimeSlot = (event: ChangeEvent<{ value: unknown }>) => {
    setSelectedTimeSlot(schedule?.timeSlots.find(timeSlot => timeSlot.id === parseInt(event.target.value as string)))
    setErrorMessage('')
  }

  const handleParticipantChange = (index: number, name: string) => {
    participants[index] = name
    setParticipants([...participants])
    checkFormValidity()
  }

  const checkFormValidity = () =>
    setFormValidity(
      !!selectedTimeSlot &&
      participants
        .slice(0, selectedTimeSlot.participantsPerEntry)
        .every(participant => !!participant))

  const sendRegistrationForm = () => {
    if (!selectedTimeSlot) return
    postRegistration(selectedTimeSlot.id, participants.slice(0, selectedTimeSlot.participantsPerEntry), registrationKey)
      .then(() => {
        localStorage.removeItem('register')
        window.location.href = `${window.location.pathname}?view=${schedule?.id}`
      })
      .catch(err => {
        if (err.status === 507) {
          if (!schedule) { return }
          const index = schedule.timeSlots.findIndex(timeSlot => timeSlot.id === selectedTimeSlot.id)
          schedule.timeSlots[index].maximumEntries = 0
          setSchedule({
            ...schedule,
            registrationLink: schedule.registrationLink,
          })
          setSelectedTimeSlot(schedule.timeSlots[index])
          err.json().then((response: { message: string, authenticated: boolean }) => setErrorMessage(response.message))
        } else {
          console.error(err)
        }
      })
  }

  return <Container>
    {schedule !== undefined && (!schedule
      ? <div>Sorry. `<code>{props.registrationLink}</code>` does not lead to an existing registration form.</div>
      : <Card>
        <CardContent style={{ textAlign: 'left' }}>
          <label>Schedule for: {schedule.name}</label>
          {!schedule.active
            ? <div><br />Sorry. This schedule is currently inactive and registration is closed.</div>
            : <FormGroup>
              <FormControl variant="outlined" style={{ margin: '16px 0' }}>
                <InputLabel
                  ref={timeSlotInputLabel}
                  id="time-slot-select-label"
                  style={{ paddingRight: `${timeSlotLabelPaddingRight}px` }}
                >
                  Choose your time slot amongst the following
                </InputLabel>
                <Select
                  labelId="time-slot-select-label"
                  id="time-slot-select"
                  value={selectedTimeSlot?.id || ''}
                  onChange={selectTimeSlot}
                  labelWidth={timeSlotLabelWidth}
                >
                  {schedule.timeSlots.map(timeSlot =>
                    <MenuItem
                      key={`timeslot-${timeSlot.id}`}
                      value={timeSlot.id}
                      disabled={entriesLeft(timeSlot) <= 0}
                    >{
                        moment(timeSlot.dateTime).format(new DateFnsUtils().dateTime24hFormat) +
                        (entriesLeft(timeSlot) <= 0
                          ? ' (full)'
                          : ` (${entriesLeft(timeSlot)} / ${timeSlot.maximumEntries}` +
                          ` entr${entriesLeft(timeSlot) === 1 ? 'y' : 'ies'} left)`)
                      }</MenuItem>
                  )}
                </Select>
              </FormControl>
              {selectedTimeSlot && entriesLeft(selectedTimeSlot) > 0 &&
                <>
                  <FormLabel>
                    Please write down your name as well as all other participants playing with or against you in the same match
                </FormLabel>
                  {(Array(...Array(selectedTimeSlot.participantsPerEntry))).map((_, index) =>
                    <TextField
                      key={`participant-${index}`}
                      label={`Participant ${index + 1}'s name`}
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
    )}

  </Container>
}

export default ScheduleRegistration
