export interface ScheduleDto {
  id: number,
  name: string,
  active: boolean,
  registrationKey: string,
}

export class Schedule {
  id: number
  name: string
  active: boolean
  registrationKey: string
  get registrationLink(): string {
    return `${window.location.origin}?register=${this.id}-${this.registrationKey}`
  }

  constructor(dto: ScheduleDto) {
    this.id = dto.id
    this.name = dto.name
    this.active = dto.active
    this.registrationKey = dto.registrationKey
  }
}
