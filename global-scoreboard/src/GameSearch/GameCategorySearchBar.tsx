import type { Dispatch, SetStateAction } from 'react'
import { FormControl, FormLabel } from 'react-bootstrap'
import type { SearchFieldProps, SearchProps } from 'react-bootstrap-table2-toolkit'

import { apiGet, MAX_PAGINATION } from '../fetchers/Api'
import type { DataArray, SrcGame } from '../models/SrcResponse'
import math from '../utils/Math'

type IdToNameMap = Record<string, string>

type GameCategorySearchProps =
  SearchFieldProps & SearchProps & {
    setGameMap: Dispatch<SetStateAction<IdToNameMap>>
  }

function debounce<T>(fn: (...args: T[]) => void, time: number) {
  let timeout: NodeJS.Timeout | undefined
  return wrapper
  function wrapper(...args: T[]) {
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

const GameCategorySearch = (props: GameCategorySearchProps) => {
  const handleOnChange = debounce(
    (searchText: string) =>
      !searchText
        ? props.onClear?.()
        : apiGet('https://www.speedrun.com/api/v1/games', { name: searchText, max: MAX_PAGINATION }, false)
          .then<DataArray<SrcGame>>(res => res.json())
          .then(res => res.data)
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

  return <FormLabel>
    <FormControl
      className={props.className}
      placeholder={props.placeholder}
      onChange={event => handleOnChange(event.currentTarget.value)}
    />
  </FormLabel>

}

export default GameCategorySearch
