import { Alert, ProgressBar } from 'react-bootstrap'
import React, { useEffect, useState } from 'react'
import { AlertProps } from 'react-bootstrap/Alert'

type UpdateMessageProps = {
  variant: AlertProps['variant']
  message: JSX.Element | string
  updateStartTime: number | null | undefined
}

const progressBarTickInterval = 16 // 60 FPS
const minutes5 = 5_000 * 60
let progressTimer: NodeJS.Timeout

const UpdateMessage = (props: UpdateMessageProps) => {
  const [currentTime, setCurrentTime] = useState<number>(new Date().getTime())

  useEffect(() => {
    if (props.updateStartTime) {
      setCurrentTime(new Date().getTime())
      progressTimer = setInterval(
        () => setCurrentTime(new Date().getTime()),
        progressBarTickInterval,
      )
    } else {
      clearInterval(progressTimer)
    }

    // Clear timer to prevent leaks
    return () => clearInterval(progressTimer)

    // Note: I don't actually care about players dependency and don't want to rerun this code on players change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.updateStartTime])

  return <Alert
    variant={props.variant}
    style={{ visibility: props.message ? 'visible' : 'hidden' }}
  >
    {props.message || '&nbsp;'}
    {props.updateStartTime != null &&
      <ProgressBar
        animated
        variant="info"
        now={(1 - (currentTime - props.updateStartTime) / minutes5) * 100}
      />}
  </Alert>
}

export default UpdateMessage
