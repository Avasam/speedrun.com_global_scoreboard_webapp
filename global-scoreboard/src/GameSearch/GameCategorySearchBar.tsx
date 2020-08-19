import { FormControl, FormLabel } from 'react-bootstrap'
import { SearchFieldProps, SearchProps } from 'react-bootstrap-table2-toolkit'
import React from 'react'
import { apiGet } from '../fetchers/api'

type IdToNameMap = { [key: string]: string }

type GameCategorySearchProps =
  SearchProps
  & SearchFieldProps
  & {
    setGameMap: React.Dispatch<React.SetStateAction<IdToNameMap>>
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
            props.setGameMap(prevGames => {
              const newGames = { ...prevGames, ...games }
              localStorage.setItem('games', JSON.stringify(newGames))
              return newGames
            })
            props.onSearch?.(searchText)
          }),
    // Note: 500 is double the default table update
    500)

  return <FormLabel>
    <FormControl
      className={props.className}
      placeholder={props.placeholder}
      onChange={e => handleOnChange(e.currentTarget.value)}
    />
  </FormLabel>

}

export default GameCategorySearch
