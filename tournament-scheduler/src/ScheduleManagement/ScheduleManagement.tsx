import React, { useState, useEffect } from 'react';

import Schedule from '../models/Schedule';
import User from '../models/User';

const getSchedules = () =>
  fetch(`${process.env.REACT_APP_BASE_URL}/api/schedules`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
  }).then(res => res.json())

type ScheduleManagementProps = {
  currentUser: User
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = (props: ScheduleManagementProps) => {
  const [schedules, setSchedules] = useState<Schedule[] | undefined>(undefined);

  useEffect(() => {
    getSchedules()
      .then((res: Schedule[] | undefined) => {
        console.log(res)
        setSchedules(res);
      })
  }, [])


  return <>
    <div>This is where the user '{props.currentUser.name}' can see and edit their schedule forms</div>
    <ul>
      {schedules && schedules.map(schedule => <li>{schedule.name}</li>)}
    </ul>
  </>
}

export default ScheduleManagement;
