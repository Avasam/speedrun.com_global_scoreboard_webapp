import { Grid, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useParams } from 'react-router-dom'

import ScheduleViewer, { TimeZoneMessage } from 'src/Components/ScheduleViewer/ScheduleViewer'
import { apiGet } from 'src/fetchers/api'
import type { ScheduleDto } from 'src/Models/Schedule'
import { Schedule } from 'src/Models/Schedule'
import type { ScheduleGroupDto } from 'src/Models/ScheduleGroup'

const getSchedules = (id: number) =>
  apiGet<ScheduleDto[]>(`schedule_groups/${id}/schedules`)

const getGroup = (id: number) =>
  apiGet<ScheduleGroupDto>(`schedule_groups/${id}`)

// Note: Skip checking for registrations since the check is already done
const hasUpcommingMatches = (schedule: ScheduleDto) =>
  schedule.timeSlots.some(timeSlot => new Date(timeSlot.dateTime) < new Date())

const compareScheduleSplitByActive = (a: ScheduleDto, b: ScheduleDto) => {
  const result = Number(hasUpcommingMatches(a)) - Number(hasUpcommingMatches(b))
  if (result !== 0) return result

  return Schedule.compareFn(a, b)
}

const ScheduleGroupViewer = () => {
  const [schedules, setSchedules] = useState<ScheduleDto[] | undefined>(undefined)
  const [groupName, setGroupName] = useState('')
  const routeParams = useParams()
  if (routeParams.groupId == null) throw new TypeError('Route param :groupId is null or undefined')
  const groupId = Number(routeParams.groupId)

  useEffect(
    () => {
      void getSchedules(groupId)
        .then(response =>
          response.filter(schedule =>
            schedule.timeSlots.some(timeSlot => timeSlot.registrations.length > 0)))
        .then(response => [...response].sort(compareScheduleSplitByActive))
        .then(setSchedules)
      void getGroup(groupId)
        .then(response => response.name)
        .then(setGroupName)
    },
    [groupId]
  )
  return <>
    <Helmet>
      <title>
        Schedule group
        {' '}
        {groupName}
        {' '}
        - Tournament Scheduler
      </title>
    </Helmet>
    <Typography variant='h3'>{groupName}</Typography>
    {TimeZoneMessage}
    {schedules && schedules.length === 0 && <p>There are no registrations for any schedule of this group.</p>}
    <Grid container rowSpacing={2} width='100%'>
      {schedules?.map(scheduleDto => <Grid item key={scheduleDto.id} xs={12} >
        <ScheduleViewer scheduleId={scheduleDto.id} shownInGroup />
      </Grid>)}
    </Grid>
  </>
}

export default ScheduleGroupViewer
