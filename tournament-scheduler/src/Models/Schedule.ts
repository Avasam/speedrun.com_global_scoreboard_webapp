// eslint-disable-next-line max-classes-per-file
import type IOrderable from './IOrderable'
import type { TimeSlotDto } from './TimeSlot'
import { TimeSlot } from './TimeSlot'
import type { ScheduleGroup } from 'src/Models/ScheduleGroup'
import { nextDayFlat } from 'src/utils/date'
import type { NonFunctionProperties } from 'src/utils/objectUtils'
import { createProxy } from 'src/utils/objectUtils'

export type ScheduleOrderDto = IOrderable & {
  isGroup: boolean
  id: number
}

export type ScheduleDto = IOrderable & {
  id: number
  name: string
  active: boolean
  registrationKey: string
  deadline?: Date | string | null
  timeSlots: TimeSlotDto[]
  groupId?: number | null
}

type ScheduleCompareProps = {
  order: number
  id: number
}

export class Schedule implements IOrderable {
  id: number
  name: string
  active: boolean
  registrationKey: string
  deadline: Date | null
  timeSlots: TimeSlot[]
  order: number
  groupId: number | null

  constructor(dto: ScheduleDto) {
    this.id = dto.id
    this.name = dto.name
    this.active = dto.active
    this.registrationKey = dto.registrationKey
    this.deadline = dto.deadline != null ? new Date(dto.deadline) : null
    this.timeSlots = dto.timeSlots.map(timeSlotDto => new TimeSlot(timeSlotDto))
    this.order = dto.order
    this.groupId = dto.groupId ?? null
  }

  get registrationLink(): string {
    return `${window.location.origin}${process.env.PUBLIC_URL}/register/${this.id}-${this.registrationKey}`
  }

  static compareFn = (a: ScheduleCompareProps, b: ScheduleCompareProps) => {
    // Sort by the same order set in the Management page
    const result = a.order - b.order
    if (result !== 0) return result

    // Fallback to id (order of creation) if all else equal
    return b.id - a.id
  }

  static toScheduleAndGroups = (schedules: Schedule[], groups: ScheduleGroup[]) => {
    for (const group of groups) {
      group.schedules = schedules.filter(schedule => schedule.groupId === group.id).sort(Schedule.compareFn)
    }

    return [...schedules.filter(schedule => schedule.groupId == null), ...groups].sort(Schedule.compareFn)
  }

  static createDefault = (order = Date.now()) =>
    new Schedule({
      id: -Date.now(),
      name: 'New Schedule',
      active: false,
      registrationKey: '',
      deadline: nextDayFlat(),
      timeSlots: [TimeSlot.createDefault()],
      order,
    })

  deepCopy: (properties?: Partial<Schedule>) => NonFunctionProperties<Schedule> = properties => {
    const copy = createProxy(this)
    for (const timeSlot of copy.timeSlots) {
      timeSlot.dateTime = new Date(timeSlot.dateTime)
    }

    return {
      ...copy,
      deadline: this.deadline == null ? null : new Date(this.deadline),
      ...properties,
    }
  }
}
