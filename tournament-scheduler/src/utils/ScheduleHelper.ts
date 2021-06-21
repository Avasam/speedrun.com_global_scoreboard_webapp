import type { Schedule } from 'src/Models/Schedule'
import type { TimeSlot } from 'src/Models/TimeSlot'

export const buildCalendarEventTitle = (timeSlot: TimeSlot, schedule: Schedule) =>
  `${timeSlot
    .registrations
    .flatMap(registration => registration.participants)
    .join(', ')} (${schedule.name})`

export const buildCalendarEventDescription = (timeSlot: TimeSlot, schedule: Schedule) => {
  const url = window.location.href
  const title = schedule.name
  const players = timeSlot.registrations.length <= 1
    ? `Participants:<br/>${timeSlot
      .registrations
      .flatMap(registration => registration.participants)
      .map((participant, index) => `${index + 1}. ${participant}<br/>`)
      .join('')}`
    : timeSlot
      .registrations
      .map(registration => registration.participants)
      .map((participants, entryIndex) =>
        `Participants for entry #${entryIndex + 1}:<br/>${participants
          .map((participant, index) =>
            `${index + 1}. ${participant}`)
          .join('<br/>')}`)
      .join('<br/><br/>')

  return `${title}<br/>${url}<br/><br/>${players}`
}

export const getDeadlineDueText = (deadlineDaysLeft: number) => {
  switch (deadlineDaysLeft) {
    case -1:
      return 'yesterday'
    case 0:
      return 'today'
    case 1:
      return 'tomorow'
    default:
      return deadlineDaysLeft > 0 ? `in ${deadlineDaysLeft} days` : `${-deadlineDaysLeft} days ago`
  }
}
