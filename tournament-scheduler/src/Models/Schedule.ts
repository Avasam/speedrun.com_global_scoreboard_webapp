import type IOrderable from './IOrderable'
import type { TimeSlotDto } from './TimeSlot'
import { createDefaultTimeSlot, TimeSlot } from './TimeSlot'
import { nextDayFlat } from 'src/utils/Date'
import { createProxy } from 'src/utils/ObjectUtils'

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
  get registrationLink(): string {
    return `${window.location.origin}${process.env.PUBLIC_URL}/register/${this.id}-${this.registrationKey}`
  }
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

  static compareFn = (a: ScheduleCompareProps, b: ScheduleCompareProps) => {
    const result = a.order - b.order

    return result !== 0 ? result : a.id - b.id
  }

  static toScheduleAndGroups = (schedules: Schedule[], groups: ScheduleGroup[]) => {
    for (const group of groups) {
      group.schedules = schedules.filter(schedule => schedule.groupId === group.id).sort(Schedule.compareFn)
    }

    return [...schedules.filter(schedule => schedule.groupId == null), ...groups].sort(Schedule.compareFn)
  }

  static createDefault = () =>
    new Schedule({
      id: -1,
      name: 'New Schedule',
      active: false,
      registrationKey: '',
      deadline: nextDayFlat(),
      timeSlots: [createDefaultTimeSlot()],
      order: -1,
    })

  clone: (properties?: Partial<Schedule>) => Schedule = properties => {
    const copy = createProxy(this)
    for (const timeSlot of copy.timeSlots) {
      timeSlot.dateTime = new Date(timeSlot.dateTime)
    }

    return {
      ...this,
      ...copy,
      deadline: this.deadline == null ? null : new Date(this.deadline),
      ...properties,
    }
  }
}

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

  static createDefault = (order = -1) =>
    new ScheduleGroup({
      id: -1,
      name: 'New Group',
      order,
    })
}

export const isGroup = (scheduleOrGroup: Schedule | ScheduleGroup): scheduleOrGroup is ScheduleGroup =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  (scheduleOrGroup as ScheduleGroup).schedules != null

export type ScheduleOrderDto = IOrderable & {
  isGroup: boolean
  id: number
}
