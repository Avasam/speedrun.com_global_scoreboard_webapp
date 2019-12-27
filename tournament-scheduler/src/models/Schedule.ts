export interface ScheduleDto {
  id: number
  name: string
  active: boolean
  registrationKey: string
  timeSlots: TimeSlot[]
}

export class Schedule {
  id: number
  name: string
  active: boolean
  registrationKey: string
  get registrationLink(): string {
    return `${window.location.origin}?register=${this.id}-${this.registrationKey}`
  }
  timeSlots: TimeSlot[]

  constructor(dto: ScheduleDto) {
    this.id = dto.id
    this.name = dto.name
    this.active = dto.active
    this.registrationKey = dto.registrationKey
    this.timeSlots = dto.timeSlots || []
  }
}

export const createDefaultSchedule = () =>
  new Schedule({
    id: -1,
    name: 'New Schedule',
    active: false,
    registrationKey: '',
    timeSlots: [{ dateTime: new Date() }],
  })

export interface TimeSlot {
  dateTime: Date
}