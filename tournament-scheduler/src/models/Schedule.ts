import { tomorrow } from '../utils/Date'
import { createDefaultTimeSlot, TimeSlot, TimeSlotDto } from './TimeSlot'

export interface ScheduleDto {
  id: number
  name: string
  active: boolean
  registrationKey: string
  deadline: Date | null
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
  deadline: Date
  timeSlots: TimeSlot[]

  constructor(dto: ScheduleDto) {
    this.id = dto.id
    this.name = dto.name
    this.active = dto.active
    this.registrationKey = dto.registrationKey
    this.deadline = dto.deadline != null ? new Date(dto.deadline) : tomorrow()
    this.timeSlots = (dto.timeSlots || []).map(timeSlotDto => new TimeSlot(timeSlotDto))
  }
}

export const createDefaultSchedule = () =>
  new Schedule({
    id: -1,
    name: 'New Schedule',
    active: false,
    registrationKey: '',
    deadline: tomorrow(),
    timeSlots: [createDefaultTimeSlot()],
  })
