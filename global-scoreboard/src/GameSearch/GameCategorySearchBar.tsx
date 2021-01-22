import { Dispatch, SetStateAction } from 'react'
import { FormControl, FormLabel } from 'react-bootstrap'
import { SearchFieldProps, SearchProps } from 'react-bootstrap-table2-toolkit'

import { apiGet } from '../fetchers/Api'

type IdToNameMap = { [key: string]: string }

type GameCategorySearchProps =
  SearchProps
  & SearchFieldProps
  & {
    setGameMap: Dispatch<SetStateAction<IdToNameMap>>
  }

function debounce<T>(fn: (...args: T[]) => void, time: number) {
  let timeout: NodeJS.Timeout | null
  return wrapper
  function wrapper(...args: T[]) {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      timeout = null
      fn(...args)
    }, time)
  }
}

const GameCategorySearch = (props: GameCategorySearchProps) => {
  const handleOnChange = debounce(
    (searchText: string) =>
      !searchText
        ? props.onClear?.()
        : apiGet('https://www.speedrun.com/api/v1/games', { name: searchText, max: 200 }, false)
          .then(res => res.json())
          .then<{ id: string, names: { international: string } }[]>(res => res.data)
          .then<IdToNameMap>(games => Object.fromEntries(games.map(game => [game.id, game.names.international])))
          .then(games => {
            props.setGameMap(previousGames => {
              const newGames = { ...previousGames, ...games }
              localStorage.setItem('games', JSON.stringify(newGames))
              return newGames
            })
            props.onSearch?.(searchText)
          }),
    // Note: 500 is double the default table update
    500
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
