import React from 'react';
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/moment';

import { Schedule } from '../models/Schedule';
import { Card, CardContent, CardActions, Button, Checkbox, TextField, FormGroup, FormControlLabel } from '@material-ui/core';

type ScheduleManagementProps = {
  schedule: Schedule
  onSave: (schedule: Schedule) => void
  onCancel: () => void
}

export const ScheduleWizard: React.FC<ScheduleManagementProps> = (props: ScheduleManagementProps) => {
  return <Card>
    <CardContent>
      <FormGroup>
        <TextField label="Name" value={props.schedule.name} />
        <FormControlLabel
          control={
            <Checkbox
              checked={props.schedule.active}
              value="active"
              color="primary" />
          }
          label="Active"

        />
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <DateTimePicker value={new Date()} onChange={() => { }} />
        </MuiPickersUtilsProvider>
      </FormGroup>
    </CardContent>
    <CardActions>
      <Button
        size="small"
        onClick={props.onCancel}>
        Cancel
    </Button>
      <Button
        size="small"
        onClick={() => props.onSave(props.schedule)}
      >
        Save
    </Button>
    </CardActions>
  </Card>
}
