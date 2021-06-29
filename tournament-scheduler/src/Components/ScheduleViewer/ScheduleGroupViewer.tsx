import '@culturehq/add-to-calendar/dist/styles.css'

import { Grid, Typography } from '@material-ui/core'
import { useEffect, useState } from 'react'

import ScheduleViewer, { TimeZoneMessage } from 'src/Components/ScheduleViewer/ScheduleViewer'
import { apiGet } from 'src/fetchers/Api'
import type { ScheduleDto, ScheduleGroupDto } from 'src/Models/Schedule'
import { Schedule } from 'src/Models/Schedule'

type ScheduleGroupViewerProps = {
  groupId: number
}

const getSchedules = (id: number) =>
  apiGet(`schedule_groups/${id}/schedules`)
    .then<ScheduleDto[]>(res => res.json())

const getGroup = (id: number) =>
  apiGet(`schedule_groups/${id}`)
    .then<ScheduleGroupDto>(res => res.json())

const ScheduleGroupViewer = (props: ScheduleGroupViewerProps) => {
  const [schedules, setSchedules] = useState<ScheduleDto[]>([])
  const [groupName, setGroupName] = useState('')

  useEffect(
    () => {
      void getSchedules(props.groupId)
        .then(res => res.filter(schedule => schedule.timeSlots.some(timeSlot => timeSlot.registrations.length > 0)))
        .then(res => res.sort(Schedule.compareFn))
        .then(setSchedules)
      void getGroup(props.groupId)
        .then(res => res.name)
        .then(setGroupName)
    },
    [props.groupId]
  )
  return <>
    <Typography variant='h3'>{groupName}</Typography>
    {TimeZoneMessage}
    {schedules.length === 0 && <p>There are no registrations any schedule of this group.</p>}
    <Grid container width='100%' rowSpacing={2}>
      {schedules.map(scheduleDto => <Grid item sm={12} md={6} lg={4} key={scheduleDto.id} >
        <ScheduleViewer scheduleId={scheduleDto.id} shownInGroup />
      </Grid>)}
    </Grid>
  </>
}

export default ScheduleGroupViewer
