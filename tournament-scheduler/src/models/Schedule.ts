import { TimeSlot, TimeSlotDto } from './TimeSlot'

export interface ScheduleDto {
  id: number;
  name: string;
  active: boolean;
  registrationKey: string;
  timeSlots: TimeSlotDto[];
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
    this.timeSlots = (dto.timeSlots || []).map(timeSlotDto => new TimeSlot(timeSlotDto))
  }
}

export const createDefaultSchedule = () =>
  new Schedule({
    id: -1,
    name: 'New Schedule',
    active: false,
    registrationKey: '',
    timeSlots: [{
      id: -1,
      dateTime: new Date(),
      maximumEntries: 1,
      participantsPerEntry: 1,
    }],
  })
