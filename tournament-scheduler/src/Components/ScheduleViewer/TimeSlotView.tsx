import { Grid, List, ListItem, ListItemText, Paper } from '@mui/material'

import AddScheduleToCalendarButton from 'src/Components/ScheduleViewer/AddScheduleToCalendarButton'
import type { Schedule } from 'src/Models/Schedule'
import type { TimeSlot } from 'src/Models/TimeSlot'
import { fancyFormat } from 'src/utils/date'

type Props = {
  timeSlot: TimeSlot
  schedule: Schedule
}

const TimeSlotView = (props: Props) =>
  <Paper elevation={24} key={`timeslot-${props.timeSlot.id}`}>
    <List
      subheader={
        <Paper
          component={ListItemText}
          elevation={4}
          primary={fancyFormat(props.timeSlot.dateTime)}
          secondary={<>
            <span>
              (
              {props.timeSlot.registrations.length}
              {' / '}
              {props.timeSlot.maximumEntries}
              {' '}
              entr
              {
                props.timeSlot.registrations.length === 1 ? 'y' : 'ies'
              }
              )
            </span>
            <AddScheduleToCalendarButton schedule={props.schedule} timeSlot={props.timeSlot} />
          </>}
          secondaryTypographyProps={{
            component: 'span',
            display: 'flex',
            direction: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        />
      }
    >
      {(props.timeSlot.participantsPerEntry <= 1 || props.timeSlot.registrations.length === 1) &&
        <ListItemText secondary='Participants' />}
      {/* TODO: Maybe use a dynamic grid instead of flexes here. Especially when there's only one list */}
      <Grid container>
        {props.timeSlot.registrations.map((registration, registrationIndex) =>
          <List
            component={Grid}
            disablePadding
            item
            key={`registration-${registration.id}`}
            style={props.timeSlot.registrations.length === 1
              ? {
                display: 'flex',
                flexFlow: 'wrap',
                whiteSpace: 'nowrap',
              }
              : undefined}
            subheader={
              props.timeSlot.participantsPerEntry <= 1 || props.timeSlot.registrations.length === 1
                ? undefined
                : <ListItemText secondary='Participants' />
            }
          >
            {registration.participants.map((participant, participantIndex) =>
              <ListItem key={`participant-${participant}`}>
                <ListItemText
                  primary={
                    `${(props.timeSlot.participantsPerEntry <= 1
                      ? registrationIndex
                      : participantIndex
                    ) + 1}. ${participant}`
                  }
                />
              </ListItem>)}
          </List>)}
      </Grid>
    </List>
  </Paper>

export default TimeSlotView
