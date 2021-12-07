import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { Dispatch, SetStateAction } from 'react'
import type {  ColumnFormatter } from 'react-bootstrap-table-next'

import type { GameValueRow, IdToNameMap } from 'src/Models/GameSearch'
import { fetchValueNamesForRun } from 'src/Models/GameSearch'

type FormatExtraDataProps = {
  platforms: IdToNameMap
  gameMap: IdToNameMap
  setGameMap: Dispatch<SetStateAction<IdToNameMap>>
  categoryMap: IdToNameMap
  setCategoryMap: Dispatch<SetStateAction<IdToNameMap>>
}

const runIdFormatter: ColumnFormatter<GameValueRow, FormatExtraDataProps> =
  (_cell, row, _rowIndex, formatExtraData) => {
    if (!formatExtraData) return ''
    if (!formatExtraData.gameMap[row.gameId] || !formatExtraData.categoryMap[row.categoryId]) {
      void fetchValueNamesForRun(row.runId)
        .then(results => {
          if (!results) return
          const [game, category] = results
          formatExtraData.setGameMap(previousGames => {
            const newGames = { ...previousGames, ...game }
            localStorage.setItem('games', JSON.stringify(newGames))
            return newGames
          })
          formatExtraData.setCategoryMap(previousCategories => {
            const newCategories = { ...previousCategories, ...category }
            localStorage.setItem('categories', JSON.stringify(newCategories))
            return newCategories
          })
        })
    }

    return <a href={`https://www.speedrun.com/run/${row.runId}`} target='speedruncom'>
      <FontAwesomeIcon icon={faExternalLinkAlt} />
    </a>
  }

export default runIdFormatter
