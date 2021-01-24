import type { ChangeEventHandler, FormEvent } from 'react'
import { useState } from 'react'
import { Button, Form, InputGroup } from 'react-bootstrap'

import { apiGet } from '../fetchers/Api'
import type { SrcLeaderboard, SrcRun } from '../models/SrcResponse'
import math from '../utils/Math'
import { secondsToTimeString } from '../utils/Time'

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const TIME_BONUS_DIVISOR = math.SECONDS_IN_HOUR * 12 // 12h (1/2 day) for +100%


// eslint-disable-next-line unicorn/prevent-abbreviations
const addVarToValuesKeys = (values: SrcRun['data']['values']) => {
  const newDict: SrcRun['data']['values'] = {}
  for (const key in values) {
    newDict[`var-${key}`] = values[key]
  }
  return newDict
}


const getRunDetails = (runId: string) =>
  apiGet(
    `https://www.speedrun.com/api/v1/runs/${runId}`,
    {},
    false
  )
    .then<SrcRun>(res => res.json())
    .then(res => res.data)

const getLeaderboardRuns = (gameId: string, categoryId: string, subCategories: SrcRun['data']['values']) =>
  apiGet(
    `https://www.speedrun.com/api/v1/leaderboards/${gameId}/category/${categoryId}`,
    { 'video-only': true, ...addVarToValuesKeys(subCategories) },
    false
  )
    .then<SrcLeaderboard>(res => res.json())
    .then(res => res.data.runs.map(run => run.run))

const ScoreDropCalculator = () => {
  const [runId, setRunId] = useState('')
  const [updating, setUpdating] = useState(false)
  const [requiredTime, setRequiredTime] = useState<number | null>(null)
  const [calculatedRunScore, setCalculatedRunScore] = useState(0)
  const [calculatedRunId, setCalculatedRunId] = useState('')

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = event =>
    setRunId(event.currentTarget.value)

  const onCalculate = () => {
    setRequiredTime(null)
    setUpdating(true)
    setCalculatedRunId(runId)

    getRunDetails(runId)
      .then(run =>
        getLeaderboardRuns(run.game, run.category, run.values).then(records => {
          /* eslint-disable extra-rules/no-commented-out-code */
          /* eslint-disable id-length */
          /* eslint-disable @typescript-eslint/no-magic-numbers */
          const primaryTimes = records
            .slice(0, Math.floor(records.length * 0.95))
            .map(record => record.times.primary_t)

          const m = math.mean(primaryTimes)
          const t = run.times.primary_t
          const w = primaryTimes[primaryTimes.length - 1]
          const N = primaryTimes.length

          // Original algorithm (https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/blob/master/README.md)
          // (e ^ (Min[pi, (w - t) / (w - m)] * (1 - 1 / (N - 1))) - 1) * 10 * (1 + (t / 43200)) = p; N = <population>; t = <time>; w = <worst time>; m = <mean>
          let p = (Math.exp(Math.min(Math.PI, (w - t) / (w - m)) * (1 - 1 / (N - 1))) - 1) * 10 * (1 + t / TIME_BONUS_DIVISOR)
          p = Math.floor(p)
          setCalculatedRunScore(p)

          // Looking for the mean (x) with added run when we know the score
          // (e ^ ((w - t) / (w - x) * (1 - 1 / N)) - 1) * 10 * (1 + (t / 43200)) < p; N = <original population>; t = <time>; w = <worst time>; p = <final  score>
          // when solving for x, becomes
          // -((w-t) / (Log(p / (1 + (t / 43200)) / 10 + 1) / (1-1/N)) - w) < x
          const x = -((w - t) / (Math.log(p / (1 + t / TIME_BONUS_DIVISOR) / 10 + 1) / (1 - 1 / N)) - w)

          // Find the required time (n)
          // (m * N + n) / (N + 1) = x; N = <original population>; m = <mean>; x = <targetted mean>
          // when solving for n, becomes
          // x * (N + 1) - m * N = n
          const n = x * (N + 1) - m * N

          // Round down to the nearest second
          setRequiredTime(Math.floor(n))
          setUpdating(false)
          /* eslint-enable extra-rules/no-commented-out-code */
          /* eslint-enable id-length */
          /* eslint-enable @typescript-eslint/no-magic-numbers */
        }))
      .catch(() => setRequiredTime(Number.NaN))
      .finally(() => setUpdating(false))
  }


  return <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
    <Form onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}>
      <Form.Group controlId='calculate-score-drop'>
        <Form.Label>Enter a run&apos;s ID to calculate the required time, for a new player, to drop the score value of said run:</Form.Label>
        <InputGroup>
          <Form.Control
            required
            placeholder='Run ID'
            onChange={handleOnChange}
            disabled={updating}
            aria-describedby='calculate score drop'
          />
          <InputGroup.Append>
            <Button
              type='submit'
              disabled={updating || !runId}
              onClick={onCalculate}
            >Calculate</Button>
          </InputGroup.Append>
        </InputGroup>
      </Form.Group>
    </Form>
    {requiredTime !== null && (
      Number.isFinite(requiredTime)
        ? <span>
          The run &apos;{calculatedRunId}&apos; is currently worth {calculatedRunScore} points.
          To reduce it, a new run would need a time of
          <strong> {secondsToTimeString(requiredTime)}</strong> or less.
        </span>
        : <span>
          The required time to reduce the points of the run &apos;{calculatedRunId}&apos; could not be calculated.
          Either because the leaderboard has less than 4 runners, it is an individual level, or something just went wrong.
        </span>
    )}
  </div>
}

export default ScoreDropCalculator
