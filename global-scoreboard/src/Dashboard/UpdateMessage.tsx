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
  const tableElements = allElements.slice(firstTableElement)
  console.log(topMessage)
  console.log(tableElements)

  return <>
    {topMessage}
    <table className="scoreDetailsTable">
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
    </table>
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
