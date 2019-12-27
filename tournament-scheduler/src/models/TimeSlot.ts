export interface TimeSlotDto {
  id: number
  dateTime: Date
  availableSpots: number
}

export class TimeSlot {
  id: number
  dateTime: Date
  availableSpots: number

  constructor(dto: TimeSlotDto) {
    this.id = dto.id
    this.dateTime = new Date(dto.dateTime)
    this.availableSpots = dto.availableSpots
  }
}
