import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { forwardRef, useEffect, useState } from 'react'
import { Alert, OverlayTrigger, ProgressBar, Tab, Tabs, Tooltip } from 'react-bootstrap'
import type { Variant } from 'react-bootstrap/esm/types'

import type { RunResult } from 'src/Models/UpdateRunnerResult'
import math from 'src/utils/math'

type UpdateMessageProps = {
  variant: Variant
  message: JSX.Element | string
  updateStartTime: number | null | undefined
}

const progressBarTickInterval = 16 // 60 FPS
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const minutes5 = 5 * math.MS_IN_MINUTE
const FROM_HUNDREDTHS = 100
let progressTimer: NodeJS.Timeout
let position: number

const renderRow = (rows: RunResult[]) =>
  rows.map(row =>
    <tr key={`row-${row.gameName}-${row.categoryName}-${row.levelName}`}>
      <td>
        {math.roundToDecimals(position += row.levelFraction)}
      </td>
      <td>
        {row.gameName}
        {' - '}
        {row.categoryName}
        {row.levelName ? ` (${row.levelName})` : ''}
      </td>
      <td>
        {row.points.toFixed(2)}
      </td>
    </tr>)

// Maybe this will be simplified in the future: https://github.com/FortAwesome/react-fontawesome/issues/199
const FaInfoCircle = forwardRef((props, ref) => <FontAwesomeIcon forwardedRef={ref} icon={faInfoCircle} {...props} />)
FaInfoCircle.displayName = 'FaInfoCircle'

const renderTable = (runs: RunResult[]) =>
  <table>
    <thead>
      <tr>
        <th>
          #
          <OverlayTrigger
            overlay={
              <Tooltip id='levelFractionInfo'>
                Individual Levels (IL) are weighted and scored to a fraction of a Full Game run.
                See the About page for a complete explanation.
              </Tooltip>
            }
            placement='right'
          >
            <FaInfoCircle />
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
    {topRuns.length > 0 &&
      <div className='score-details-table'>
        <Tabs defaultActiveKey='top60'>
          <Tab eventKey='top60' title='Top 60 runs'>
            {renderTable(topRuns)}
          </Tab>
          {lesserRuns.length > 0 &&
            <Tab eventKey='other' title='Other runs'>
              {renderTable(lesserRuns)}
            </Tab>}
        </Tabs>
      </div>}
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
    style={{ visibility: props.message ? 'visible' : 'hidden' }}
    variant={props.variant}
  >
    {typeof props.message === 'string'
      ? <span dangerouslySetInnerHTML={{
        __html: props.message.trim().startsWith('<')
          ? props.message.replaceAll(/(\s+|<link.*?stylesheet.*?>|<style[\S\s]*?\/style>)/g, ' ')
          : props.message.replaceAll('\n', '<br/>'),
      }}
      />
      : <span>{props.message}</span>}
    {props.updateStartTime != null &&
      <ProgressBar
        animated
        now={(1 - (currentTime - props.updateStartTime) / minutes5) * FROM_HUNDREDTHS}
        variant='info'
      />}
  </Alert>
}

export default UpdateMessage
