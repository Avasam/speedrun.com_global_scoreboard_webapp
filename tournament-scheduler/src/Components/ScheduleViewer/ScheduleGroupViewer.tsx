import { Grid, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import ScheduleViewer, { TimeZoneMessage } from 'src/Components/ScheduleViewer/ScheduleViewer'
import { apiGet } from 'src/fetchers/api'
import type { ScheduleDto, ScheduleGroupDto } from 'src/Models/Schedule'
import { Schedule } from 'src/Models/Schedule'

type ScheduleGroupViewerProps = {
  groupId: number
}

const getSchedules = (id: number) =>
  apiGet(`schedule_groups/${id}/schedules`)
    .then<ScheduleDto[]>(response => response.json())

const getGroup = (id: number) =>
  apiGet(`schedule_groups/${id}`)
    .then<ScheduleGroupDto>(response => response.json())

const ScheduleGroupViewer = (props: ScheduleGroupViewerProps) => {
  const [schedules, setSchedules] = useState<ScheduleDto[]>([])
  const [groupName, setGroupName] = useState('')

  useEffect(
    () => {
      void getSchedules(props.groupId)
        .then(response =>
          response.filter(schedule =>
            schedule.timeSlots.some(timeSlot => timeSlot.registrations.length > 0)))
        .then(response => [...response].sort(Schedule.compareFn))
        .then(setSchedules)
      void getGroup(props.groupId)
        .then(response => response.name)
        .then(setGroupName)
    },
    [props.groupId]
  )
  return <>
    <Typography variant='h3'>{groupName}</Typography>
    {TimeZoneMessage}
    {schedules.length === 0 && <p>There are no registrations for any schedule of this group.</p>}
    <Grid container rowSpacing={2} width='100%'>
      {schedules.map(scheduleDto => <Grid item key={scheduleDto.id} xs={12} >
        <ScheduleViewer scheduleId={scheduleDto.id} shownInGroup />
      </Grid>)}
    </Grid>
  </>
}

export default ScheduleGroupViewer
