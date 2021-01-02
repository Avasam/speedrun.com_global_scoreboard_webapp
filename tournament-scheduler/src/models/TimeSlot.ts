import Registration from './Registration'

export interface TimeSlotDto {
  id: number
  dateTime: Date
  maximumEntries: number
  participantsPerEntry: number
  registrations: Registration[]
}

export class TimeSlot {
  id: number
  dateTime: Date
  maximumEntries: number
  participantsPerEntry: number
  registrations: Registration[]
  static compareFn = (a: TimeSlot, b: TimeSlot) => a.dateTime.valueOf() - b.dateTime.valueOf()

  constructor(dto: TimeSlotDto) {
    this.id = dto.id
    this.dateTime = new Date(dto.dateTime)
    this.maximumEntries = dto.maximumEntries
    this.participantsPerEntry = dto.participantsPerEntry
    this.registrations = dto.registrations
  }
}

export const minutesStep = 5
const coefficient = 1000 * 60 * minutesStep
export const createDefaultTimeSlot = () =>
  new TimeSlot({
    id: -1,
    dateTime: new Date(Math.ceil(Date.now() / coefficient) * coefficient),
    maximumEntries: 1,
    participantsPerEntry: 1,
    registrations: [],
  })
