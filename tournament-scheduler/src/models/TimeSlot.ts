export interface TimeSlotDto {
  id: number
  dateTime: Date
  maximumEntries: number
}

export class TimeSlot {
  id: number
  dateTime: Date
  maximumEntries: number

  constructor(dto: TimeSlotDto) {
    this.id = dto.id
    this.dateTime = new Date(dto.dateTime)
    this.maximumEntries = dto.maximumEntries
  }
}
