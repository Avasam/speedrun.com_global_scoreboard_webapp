import { nextDayFlat } from '../utils/Date'
import type { TimeSlotDto } from './TimeSlot'
import { createDefaultTimeSlot, TimeSlot } from './TimeSlot'

export type ScheduleDto = {
  id: number
  name: string
  active: boolean
  registrationKey: string
  deadline: Date | string | null
  timeSlots: TimeSlotDto[]
}

export class Schedule {
  id: number
  name: string
  active: boolean
  registrationKey: string
  get registrationLink(): string {
    return `${window.location.origin}${window.location.pathname}?register=${this.id}-${this.registrationKey}`
  }
  deadline: Date | null
  timeSlots: TimeSlot[]

  constructor(dto: ScheduleDto) {
    this.id = dto.id
    this.name = dto.name
    this.active = dto.active
    this.registrationKey = dto.registrationKey
    this.deadline = dto.deadline != null ? new Date(dto.deadline) : null
    this.timeSlots = dto.timeSlots.map(timeSlotDto => new TimeSlot(timeSlotDto))
  }
}

export const createDefaultSchedule = () =>
  new Schedule({
    id: -1,
    name: 'New Schedule',
    active: false,
    registrationKey: '',
    deadline: nextDayFlat(),
    timeSlots: [createDefaultTimeSlot()],
  })
