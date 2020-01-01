import React, { useState } from 'react'

interface ScheduleRegistrationProps {
  registrationLink: string
}

const ScheduleRegistration: React.FC<ScheduleRegistrationProps> = (props: ScheduleRegistrationProps) => {
  return <div>This is the page where you can register for '{props.registrationLink}'</div >
}

export default ScheduleRegistration;
