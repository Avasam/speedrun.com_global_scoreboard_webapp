import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { Alert, OverlayTrigger, ProgressBar, Tooltip } from 'react-bootstrap'
import type { AlertProps } from 'react-bootstrap/Alert'

import type { RunResult } from '../models/UpdateRunnerResult'

type UpdateMessageProps = {
  variant: AlertProps['variant']
  message: JSX.Element | string
  updateStartTime: number | null | undefined
}

const progressBarTickInterval = 16 // 60 FPS
const minutes5 = 5000 * 60
let progressTimer: NodeJS.Timeout
let position: number

const renderRow = (rows: RunResult[]) =>
  rows.map((row, rowi) =>
    <tr key={`row${rowi}`}>
      <td>
        {Math.round(position += row.levelFraction * 100) / 100}
      </td>
      <td>
        {row.gameName} - {row.categoryName}{row.levelName ? ` (${row.levelName})` : ''}
      </td>
      <td>
        {row.points.toFixed(2)}
      </td>
    </tr>)

const renderTable = (runs: RunResult[]) =>
  <table className='scoreDetailsTable'>
    <thead>
      <tr>
        <th>
          #<OverlayTrigger
            placement='bottom'
            overlay={
              <Tooltip id='levelFractionInfo'>
                Individual Levels (IL) are weighted and scored to a fraction of a Full Game run.
                See the About page for a complete explanation.
              </Tooltip>
            }
          ><FontAwesomeIcon icon={faInfoCircle} />
          </OverlayTrigger>
        </th>
        <th>Game - Category (Level)</th>
        <th>Points</th>
      </tr>
    </thead>
    <tbody>
      {renderRow(runs)}
    </tbody>
  </table>

export const renderScoreTable = ([topRuns, lesserRuns]: RunResult[][], topMessage?: string) => {
  position = 0

  return <>
    <div>{topMessage}</div>
    {topRuns.length > 0 && <>
      <label>Top 60 runs:</label>
      {renderTable(topRuns)}
    </>}
    {lesserRuns.length > 0 && <>
      <br />
      <label>Other runs:</label>
      {renderTable(lesserRuns)}
    </>}
  </>
}

const UpdateMessage = (props: UpdateMessageProps) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now())

  useEffect(() => {
    if (props.updateStartTime) {
      setCurrentTime(Date.now())
      progressTimer = setInterval(
        () => setCurrentTime(Date.now()),
        progressBarTickInterval
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
        variant='info'
        now={(1 - (currentTime - props.updateStartTime) / minutes5) * 100}
      />}
  </Alert>
}

export default UpdateMessage
