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

export const renderScoreTable = (baseString: string) => {
  const allElements = baseString
    .split('\n')
    .map(row =>
      row.split('|')
        .map(rowItem =>
          rowItem.trim()))
  const firstTableElement = allElements.findIndex(element => element.length === 2)
  const topMessage = allElements
    .slice(0, firstTableElement)
    .reduce((prev, curr) => prev + `${curr[0]}\n`, '')
    .trim()

  // Note: TableElements is used for rendering old string formatted table
  const tableElements = allElements.slice(firstTableElement)

  let topRuns: any[] = []
  let lesserRuns: any[] = []

  if (tableElements.length === 1 && tableElements[0].length === 1) {
    try {
      const scoreDetails = JSON.parse(tableElements[0][0])
      topRuns = scoreDetails[0]
      lesserRuns = scoreDetails[1]
    } catch {
      // suppress
    }
  }
  console.log('topMessage:', topMessage)
  console.log('tableElements:', tableElements)
  console.log('topRuns:', topRuns)
  console.log('lesserRuns:', lesserRuns)

  return <>
    {topMessage}
    {/* {topRuns.length > 0 && <label>Top 100 runs:</label>} */}
    <table className="scoreDetailsTable">
      {topRuns.length > 0
        ? <tbody>
          {topRuns.map((row, rowi) =>
            <tr key={`row${rowi}`}>
              <td>
                {row.game_name} - {row.category_name}{row.level_name ? ` (${row.level_name})` : ''}
              </td>
              <td>
                {(row.points as number).toFixed(2)}
              </td>
            </tr>
          )}
        </tbody>
        : <tbody>
          <tr>
            <th>{tableElements[0][0]}</th>
            <th>{tableElements[0][1]}</th>
          </tr>
          {tableElements.slice(2).map((row, rowi) =>
            <tr key={`row${rowi}`}>
              {row.map((element, elementi) =>
                <td key={`element${elementi}`}>
                  {element}
                </td>
              )}
            </tr>
          )}
        </tbody>
      }
    </table>
    {lesserRuns.length > 0 && <>
      <br />
      <label>Other runs:</label>
      <table>
        <tbody>
          {lesserRuns.map((row, rowi) =>
            <tr key={`row${rowi}`}>
              <td>
                {row.game_name} - {row.category_name}{row.level_name ? ` (${row.level_name})` : ''}
              </td>
              <td>
                {(row.points as number).toFixed(2)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>}
  </>
}

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
