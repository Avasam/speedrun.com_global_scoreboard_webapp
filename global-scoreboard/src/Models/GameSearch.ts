import { apiGet, MAX_PAGINATION } from 'src/fetchers/api'
import type { EmbeddedSpeedruncomRun } from 'src/Models/SpeedruncomResponse'

export type PlatformDto = {
  id: string
  name: string
}

export type IdToNameMap = Record<string, string>

export type GameValue = {
  gameId: string
  categoryId: string
  platformId: string | null
  meanTime: number
  runId: string
  wrPoints: number
  wrTime: number
}

export type GameValueRow = GameValue & {
  wrPointsPerSecond: number
  meanPointsPerSecond: number
}

export type PlatformSelectOption = {
  id: string
  name: string
}

export const getAllGameValues = () =>
  apiGet('game-values')
    .then<GameValue[]>(response => response.json())
    .then<GameValueRow[]>(gameValues => gameValues.map(gameValue => ({
      ...gameValue,
      wrPointsPerSecond: gameValue.wrPoints / gameValue.wrTime,
      meanPointsPerSecond: gameValue.wrPoints / gameValue.meanTime,
    })))

export const getAllPlatforms = () => apiGet('https://www.speedrun.com/api/v1/platforms', { max: MAX_PAGINATION }, false)
  .then<{ data: PlatformDto[] }>(response => response.json())
  .then<PlatformDto[]>(response => response.data)
  .then<IdToNameMap>(platforms => Object.fromEntries(platforms.map(platform => [platform.id, platform.name])))

const requestsStartedForRun = new Map<string, boolean>()
export const fetchValueNamesForRun = async (runId: string) => {
  if (requestsStartedForRun.get(runId)) return
  requestsStartedForRun.set(runId, true)
  return apiGet(`https://www.speedrun.com/api/v1/runs/${runId}?embed=game,category`, undefined, false)
    .then<EmbeddedSpeedruncomRun>(response => response.json())
    .then<[IdToNameMap, IdToNameMap]>(response => [
      { [response.data.game.data.id]: response.data.game.data.names.international },
      { [response.data.category.data.id]: response.data.category.data.name },
    ])
    .catch(() => {
      requestsStartedForRun.delete(runId)
    })
}
