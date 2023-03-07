import type { Schedule } from 'src/Models/Schedule'
import type { ScheduleGroup } from 'src/Models/ScheduleGroup'
import type { TimeSlot } from 'src/Models/TimeSlot'

export const buildCalendarEventTitle = (timeSlot: TimeSlot, schedule: Schedule) =>
  `${timeSlot
    .registrations
    .flatMap(registration => registration.participants)
    .join(', ')} (${schedule.name})`

const buildParticipantsList = (participants: string[]) => participants
  .map((participant, index) => `${index + 1}. ${participant}`)
  .join('<br/>')

export const buildCalendarEventDescription = (timeSlot: TimeSlot, schedule: Schedule) => {
  const url = window.location.href
  const title = schedule.name
  const players = timeSlot.registrations.length <= 1
    ? `Participants:<br/>${buildParticipantsList(
      timeSlot
        .registrations
        .flatMap(registration => registration.participants),
    )}`
    : timeSlot
      .registrations
      .map(registration => registration.participants)
      .map((participants, entryIndex) =>
        `Participants for entry #${entryIndex + 1}:<br/>${buildParticipantsList(participants)}`)
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
      return 'tomorrow'
    default:
      return deadlineDaysLeft > 0 ? `in ${deadlineDaysLeft} days` : `${-deadlineDaysLeft} days ago`
  }
}

export const isGroup = (scheduleOrGroup: Schedule | ScheduleGroup): scheduleOrGroup is ScheduleGroup =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  (scheduleOrGroup as ScheduleGroup).schedules != null
