import type { Dispatch, SetStateAction } from 'react'
import { Form } from 'react-bootstrap'
import type { SearchBarProps } from 'react-bootstrap-table2-toolkit'

import { apiGet, MAX_PAGINATION } from 'src/fetchers/api'
import type { DataArray, SpeedruncomGame } from 'src/Models/SpeedruncomResponse'
import math from 'src/utils/math'

type IdToNameMap = Record<string, string>

type GameCategorySearchProps =
  SearchBarProps & {
    setGameMap: Dispatch<SetStateAction<IdToNameMap>>
  }

const debounce = <T,>(
  fn: (...params: T[]) => void,
  time: number
) => {
  let timeout: NodeJS.Timeout | undefined

  return (...args: T[]) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      timeout = undefined
      fn(...args)
    }, time)
  }
}

// Note: 500 is double the default table update
const DEBOUNCE_TIME = math.MS_IN_SECOND * math.HALF

const GameCategorySearchBar = (props: GameCategorySearchProps) => {
  const handleOnChange = debounce(
    (searchText: string) =>
      !searchText
        ? props.onClear?.()
        : apiGet<DataArray<SpeedruncomGame>>('https://www.speedrun.com/api/v1/games', { name: searchText, max: MAX_PAGINATION }, false)
          .then(response => response.data)
          .then<IdToNameMap>(games => Object.fromEntries(games.map(game => [game.id, game.names.international])))
          .then(games => {
            props.setGameMap(previousGames => {
              const newGames = { ...previousGames, ...games }
              localStorage.setItem('games', JSON.stringify(newGames))
              return newGames
            })
            props.onSearch?.(searchText)
          }),
    DEBOUNCE_TIME
  )

  return <Form.Label>
    <Form.Control
      className={props.className}
      onChange={event => handleOnChange(event.currentTarget.value)}
      placeholder={props.placeholder}
    />
  </Form.Label>
}

export default GameCategorySearchBar
