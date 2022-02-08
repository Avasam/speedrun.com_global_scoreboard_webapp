import CreateNewFolder from '@mui/icons-material/CreateNewFolder'
import NoteAdd from '@mui/icons-material/NoteAdd'
import { Button, Container, Stack, Typography } from '@mui/material'
import { memo, useEffect, useState } from 'react'

import ScheduleCard from './ScheduleCard/ScheduleCard'
import ScheduleGroupCard from './ScheduleCard/ScheduleGroupCard'
import { ScheduleWizard } from './ScheduleWizard/ScheduleWizard'
import { apiDelete, apiGet, apiPost, apiPut } from 'src/fetchers/api'
import type { ScheduleDto, ScheduleGroupDto, ScheduleOrderDto } from 'src/Models/Schedule'
import { isGroup, Schedule, ScheduleGroup } from 'src/Models/Schedule'
import { TimeSlot } from 'src/Models/TimeSlot'
import type User from 'src/Models/User'
import { arrayMove } from 'src/utils/objectUtils'

const getSchedules = () =>
  apiGet<ScheduleDto[]>('schedules')
    .then(scheduleDtos => scheduleDtos.map(scheduleDto => new Schedule(scheduleDto)))

const postSchedules = (schedule: ScheduleDto) =>
  apiPost<{ id: number }>('schedules', schedule)

const putSchedule = (schedule: ScheduleDto) =>
  apiPut(`schedules/${schedule.id}`, schedule)

const deleteSchedule = (scheduleId: number) =>
  apiDelete(`schedules/${scheduleId}`)

const putScheduleGroup = (scheduleId: number, groupId: number | null) =>
  apiPut(`schedules/${scheduleId}/group_id/${groupId}`, {})

const putScheduleOrder = (scheduleOrderDtos: ScheduleOrderDto[]) =>
  apiPut('schedules/order', scheduleOrderDtos)

const getGroups = () =>
  apiGet<ScheduleGroupDto[]>('schedule_groups')
    .then(scheduleGroupDtos => scheduleGroupDtos.map(scheduleGroupDto => new ScheduleGroup(scheduleGroupDto)))

const postGroups = (scheduleGroup: ScheduleGroupDto) =>
  apiPost<{ id: number }>('schedule_groups', scheduleGroup)

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
      .then(group => setGroups([{ ...newGroup, id: group.id }, ...groups]))
  }

  const handleDeleteGroup = (groupId: number) =>
    deleteGroup(groupId)
      .then(() => {
        for (const schedule of schedules)
          if (schedule.groupId === groupId)
            schedule.groupId = null
        setSchedules(schedules)
        setGroups([...groups.filter(group => group.id !== groupId)])
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
    for (let index = 0; index < source.length; index++) source[index].order = index + 1
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

  const ScheduleCardFromGroup = memo((params: ScheduleCardFromGroupProps) =>
    <ScheduleCard
      isFirst={params.index === 0}
      isLast={params.index === params.parent.length - 1}
      key={`schedule-${params.schedule.id}`}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onMove={(moved, upDown) => handleMoveSchedule(params.parent, moved, upDown)}
      onMoveToGroup={groupId => handleMoveToGroup(params.schedule, groupId)}
      possibleGroups={[
        // Note: null represents root. This is a fake group
        { ...ScheduleGroup.createDefault(), id: null, name: 'Ungroup' } as unknown as ScheduleGroup,
        ...schedulesAndGroups,
      ].filter(group => isGroup(group) && group.id !== params.schedule.groupId) as ScheduleGroup[]}
      schedule={params.schedule}
    />)
  ScheduleCardFromGroup.displayName = 'ScheduleCardFromGroup'

  return currentSchedule
    ? <ScheduleWizard
      onCancel={() => setCurrentSchedule(undefined)}
      onSave={handleSave}
      schedule={currentSchedule}
    />
    : <Container
      component={Stack}
      spacing={2}
      sx={{ '.MuiPaper-root > .MuiCardActions-root>:not(:first-of-type)': { marginLeft: 0 } }}
    >
      <Typography>
        {`Welcome ${props.currentUser.name} ! You can manage your schedules below`}
      </Typography>

      <Stack direction='row' spacing={2}>
        <Button
          fullWidth
          onClick={handleCreateGroup}
          startIcon={<CreateNewFolder />}
          variant='contained'
        >
          Create new Group
        </Button>
        <Button
          fullWidth
          onClick={() => handleEdit(Schedule.createDefault(getDefaultOrder()))}
          startIcon={<NoteAdd />}
          variant='contained'
        >
          Create new Schedule
        </Button>
      </Stack>

      {schedulesAndGroups.map((scheduleOrGroup, index) =>
        isGroup(scheduleOrGroup)
          ? <ScheduleGroupCard
            group={scheduleOrGroup}
            isFirst={index === 0}
            isLast={index === schedulesAndGroups.length - 1}
            key={`group-${scheduleOrGroup.id}`}
            onDelete={handleDeleteGroup}
            onEdit={newName => handleEditGroup(scheduleOrGroup, newName)}
            onMove={(moved, upDown) => handleMoveSchedule(schedulesAndGroups, moved, upDown)}
          >
            {scheduleOrGroup.schedules.map((schedule, index_) =>
              <ScheduleCardFromGroup
                index={index_}
                key={`schedule-${schedule.id}`}
                parent={scheduleOrGroup.schedules}
                schedule={schedule}
              />)}
          </ScheduleGroupCard>
          : <ScheduleCardFromGroup
            index={index}
            key={`schedule-${scheduleOrGroup.id}`}
            parent={schedulesAndGroups}
            schedule={scheduleOrGroup}
          />)}
    </Container>
}

export default ScheduleManagement
