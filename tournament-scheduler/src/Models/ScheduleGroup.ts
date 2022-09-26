import type IOrderable from 'src/Models/IOrderable'
import type { Schedule } from 'src/Models/Schedule'

export type ScheduleGroupDto = {
  id: number
  name: string
  order: number
}

export class ScheduleGroup implements IOrderable {
  id: number
  name: string
  schedules: Schedule[]
  order: number

  constructor(dto: ScheduleGroupDto) {
    this.id = dto.id
    this.name = dto.name
    this.schedules = []
    this.order = dto.order
  }

  static createDefault = (order = Date.now()) =>
    new ScheduleGroup({
      id: -Date.now(),
      name: 'New Group',
      order,
    })
}
