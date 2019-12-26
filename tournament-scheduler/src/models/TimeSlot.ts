export interface TimeSlotDto {
  id: number
  dateTime: Date
}

export class TimeSlot {
  id: number
  dateTime: Date

  constructor(dto: TimeSlotDto) {
    this.id = dto.id
    this.dateTime = new Date(dto.dateTime)
  }
}
