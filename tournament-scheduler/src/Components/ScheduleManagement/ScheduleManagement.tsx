import { Button, Container, Stack, Typography } from '@material-ui/core'
import { CreateNewFolder, NoteAdd } from '@material-ui/icons'
import { useEffect, useState } from 'react'

import ScheduleCard from './ScheduleCard/ScheduleCard'
import ScheduleGroupCard from './ScheduleCard/ScheduleGroupCard'
import { ScheduleWizard } from './ScheduleWizard/ScheduleWizard'
import { apiDelete, apiGet, apiPost, apiPut } from 'src/fetchers/Api'
import type { ScheduleDto, ScheduleGroupDto, ScheduleOrderDto } from 'src/Models/Schedule'
import { isGroup, Schedule, ScheduleGroup } from 'src/Models/Schedule'
import { TimeSlot } from 'src/Models/TimeSlot'
import type User from 'src/Models/User'
import { arrayMove } from 'src/utils/ObjectUtils'

const getSchedules = () =>
  apiGet('schedules')
    .then(res =>
      res.json().then((scheduleDtos: ScheduleDto[] | undefined) =>
        scheduleDtos?.map(scheduleDto => new Schedule(scheduleDto)) ?? []))

const postSchedules = (schedule: ScheduleDto) =>
  apiPost('schedules', schedule)
    .then<number>(res => res.json())

const putSchedule = (schedule: ScheduleDto) =>
  apiPut(`schedules/${schedule.id}`, schedule)

const deleteSchedule = (scheduleId: number) =>
  apiDelete(`schedules/${scheduleId}`)

const putScheduleGroup = (scheduleId: number, groupId: number | null) =>
  apiPut(`schedules/${scheduleId}/group_id/${groupId}`, {})

const putScheduleOrder = (scheduleOrderDtos: ScheduleOrderDto[]) =>
  apiPut('schedules/order', scheduleOrderDtos)

const getGroups = () =>
  apiGet('schedule_groups')
    .then(res =>
      res.json().then((scheduleGroupDtos: ScheduleGroupDto[] | undefined) =>
        scheduleGroupDtos?.map(scheduleGroupDto => new ScheduleGroup(scheduleGroupDto)) ?? []))

const postGroups = (scheduleGroup: ScheduleGroupDto) =>
  apiPost('schedule_groups', scheduleGroup)
    .then<number>(res => res.json())

const putGroup = (scheduleGroup: ScheduleGroupDto) =>
  apiPut(`schedule_groups/${scheduleGroup.id}`, scheduleGroup)

const deleteGroup = (groupId: number) =>
  apiDelete(`schedule_groups/${groupId}`)

type ScheduleManagementProps = {
  currentUser: User
}

type ScheduleOrGroup = Schedule | ScheduleGroup

// TODO: Remove dependency on knowing the index? (need to assign proper order on initial get and moving to/out of gorup)
type ScheduleCardFromGroupProps = {
  schedule: Schedule
  parent: ScheduleOrGroup[]
  index: number
}

const ScheduleManagement = (props: ScheduleManagementProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | undefined>()
  const [groups, setGroups] = useState<ScheduleGroup[]>([])
  const [schedulesAndGroups, setSchedulesAndGroups] = useState<ScheduleOrGroup[]>([])
  const getDefaultOrder = () => (schedulesAndGroups.find(Boolean)?.order ?? 1) - 1

  const handleEdit = (schedule?: Schedule) =>
    setCurrentSchedule(schedule)

  const handleDelete = (scheduleId: number) =>
    deleteSchedule(scheduleId)
      .then(() => setSchedules(schedules.filter(schedule => schedule.id !== scheduleId)))
      .catch(console.error)

  // TODO: on creation, put new schedule at the very top. This may have to be done server-side
  const handleSave = (schedule: ScheduleDto) => {
    const savePromise = schedule.id <= -1
      ? postSchedules(schedule)
      : putSchedule(schedule)
    savePromise
      .then(() => {
        getSchedules()
          .then(setSchedules)
          .catch(console.error)
        setCurrentSchedule(undefined)
      })
      .catch(console.error)
  }

  const handleCreateGroup = () => {
    const newGroup = ScheduleGroup.createDefault(getDefaultOrder())
    void postGroups(newGroup)
      .then(id => setGroups([{ ...newGroup, id }, ...groups]))
  }

  const handleDeleteGroup = (groupId: number) =>
    deleteGroup(groupId)
      .then(() => {
        for (const schedule of schedules)
          if (schedule.groupId === groupId)
            schedule.groupId = null
        setSchedules(schedules)
        setGroups(groups.filter(group => group.id !== groupId))
      })

  const handleEditGroup = (group: ScheduleGroup, newGroupname: string) =>
    putGroup({ ...group, name: newGroupname })
      .then(() => {
        group.name = newGroupname
        setGroups([...groups])
      })

  const handleMoveToGroup = (schedule: Schedule, groupId: number | null) => {
    schedule.groupId = groupId

    void putScheduleGroup(schedule.id, groupId)
      .then(() => setSchedules([...schedules]))
  }

  const handleMoveSchedule = (source: ScheduleOrGroup[], schedule: ScheduleOrGroup, upDown: -1 | 1) => {
    // Physically rearrenge array, as this will properly move items around
    const currentIndex = source.indexOf(schedule)
    arrayMove(source, currentIndex, currentIndex + upDown)
    // Reassign the order property, wich will be used to render things in the right order
    for (let i = 0; i < source.length; i++) source[i].order = i + 1
    void putScheduleOrder(
      source.map(scheduleOrGroup => ({
        isGroup: isGroup(scheduleOrGroup),
        id: scheduleOrGroup.id,
        order: scheduleOrGroup.order,
      }))
    ).then(() => setSchedulesAndGroups([...schedulesAndGroups]))
  }

  useEffect(() => {
    Promise.all([getSchedules(), getGroups()])
      .then(([newSchedules, newGroups]) => {
        for (const schedule of newSchedules) schedule.timeSlots.sort(TimeSlot.compareFn)
        setSchedules(newSchedules)
        setGroups(newGroups)
      })
      .catch(console.error)
  }, [])

  useEffect(
    () => setSchedulesAndGroups([...Schedule.toScheduleAndGroups(schedules, groups)]),
    [schedules, groups]
  )

  const ScheduleCardFromGroup = (params: ScheduleCardFromGroupProps) =>
    <ScheduleCard
      key={`schedule-${params.schedule.id}`}
      onDelete={handleDelete}
      onEdit={handleEdit}
      schedule={params.schedule}
      onMove={(moved, upDown) => handleMoveSchedule(params.parent, moved, upDown)}
      isFirst={params.index === 0}
      isLast={params.index === params.parent.length - 1}
      onMoveToGroup={groupId => handleMoveToGroup(params.schedule, groupId)}
      possibleGroups={[
        // Note: null represents root. This is a fake group
        { ...ScheduleGroup.createDefault(), id: null, name: 'Ungroup' } as unknown as ScheduleGroup,
        ...schedulesAndGroups,
      ].filter(group => isGroup(group) && group.id !== params.schedule.groupId) as ScheduleGroup[]
      }
    />

  return currentSchedule
    ? <ScheduleWizard
      schedule={currentSchedule}
      onSave={handleSave}
      onCancel={() => setCurrentSchedule(undefined)}
    />
    : <Container
      component={Stack}
      spacing={2}
      sx={{ '.MuiPaper-root > .MuiCardActions-root>:not(:first-of-type)': { marginLeft: 0 } }}
    >
      <Typography>Welcome {props.currentUser.name} ! You can manage your schedules below</Typography>

      <Stack direction='row' spacing={2}>
        <Button
          fullWidth
          variant='contained'
          startIcon={<CreateNewFolder />}
          onClick={handleCreateGroup}
        >
          Create new Group
        </Button>
        <Button
          fullWidth
          variant='contained'
          startIcon={<NoteAdd />}
          onClick={() => handleEdit(Schedule.createDefault(getDefaultOrder()))}
        >
          Create new Schedule
        </Button>
      </Stack>

      {schedulesAndGroups.map((scheduleOrGroup, i) =>
        isGroup(scheduleOrGroup)
          ? <ScheduleGroupCard
            key={`group-${scheduleOrGroup.id}`}
            group={scheduleOrGroup}
            onMove={(moved, upDown) => handleMoveSchedule(schedulesAndGroups, moved, upDown)}
            isFirst={i === 0}
            isLast={i === schedulesAndGroups.length - 1}
            onDelete={handleDeleteGroup}
            onEdit={newName => handleEditGroup(scheduleOrGroup, newName)}
          >
            {scheduleOrGroup.schedules.map((schedule, index) =>
              <ScheduleCardFromGroup
                key={`schedule-${schedule.id}`}
                schedule={schedule}
                parent={scheduleOrGroup.schedules}
                index={index}
              />)}
          </ScheduleGroupCard>
          : <ScheduleCardFromGroup
            key={`schedule-${scheduleOrGroup.id}`}
            schedule={scheduleOrGroup}
            parent={schedulesAndGroups}
            index={i}
          />)}
    </Container>
}

export default ScheduleManagement
