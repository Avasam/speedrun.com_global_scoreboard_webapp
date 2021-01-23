import { floorToMinutesStep, tomorrow } from '../utils/Date'
import type Registration from './Registration'

export interface TimeSlotDto {
  id: number
  dateTime: Date | string
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
export const createDefaultTimeSlot = () =>
  new TimeSlot({
    id: -1,
    dateTime: floorToMinutesStep(tomorrow(), minutesStep),
    maximumEntries: 1,
    participantsPerEntry: 1,
    registrations: [],
  })
