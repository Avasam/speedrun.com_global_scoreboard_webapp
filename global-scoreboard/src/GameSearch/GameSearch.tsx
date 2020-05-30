/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import '../Dashboard/Scoreboard.css'
import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import BootstrapTable, { Column } from 'react-bootstrap-table-next'
import { Container, Dropdown, DropdownButton, Spinner } from 'react-bootstrap'
import React, { Component, useEffect, useRef, useState } from 'react'
import ToolkitProvider, { Search, SearchProps, ToolkitProviderProps } from 'react-bootstrap-table2-toolkit'
import paginationFactory, { PaginationListStandalone, PaginationProvider, PaginationTotalStandalone, SizePerPageDropdownStandalone } from 'react-bootstrap-table2-paginator'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { apiGet } from '../fetchers/api'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { faLongArrowAltDown } from '@fortawesome/free-solid-svg-icons'
import { faLongArrowAltUp } from '@fortawesome/free-solid-svg-icons'
const { SearchBar } = Search

interface PlatformDto {
  id: string
  name: string
}

type IdToNameMap = { [key: string]: string }

interface GameValue {
  gameId: string
  categoryId: string
  platformId: string | null
  meanTime: number
  runId: string
  wrPoints: number
  wrTime: number
}

interface GameValueRow extends GameValue {
  wrPointsPerSecond: number
  meanPointsPerSecond: number
}

const sortCaret: Column['sortCaret'] = (order) =>
  <>
    {' '}
    <span className="sortCarrets">
      <FontAwesomeIcon className={order === 'asc' ? 'active' : ''} icon={faLongArrowAltDown} />
      <FontAwesomeIcon className={order === 'desc' ? 'active' : ''} icon={faLongArrowAltUp} />
    </span>
  </>

type FormatExtraDataProps = {
  platforms: IdToNameMap
}

const formatTime = (totalSeconds: number) => {
  const hours = totalSeconds / 3600 | 0
  totalSeconds %= 3600
  const minutes = totalSeconds / 60 | 0
  const seconds = totalSeconds % 60 | 0
  return hours.toString().padStart(2, '0') +
    ':' +
    minutes.toString().padStart(2, '0') +
    ':' +
    seconds.toString().padStart(2, '0')
}

const columns: Column[] = [
  {
    dataField: 'runId',
    text: '',
    searchable: false,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      <a href={`https://www.speedrun.com/run/${row.runId}`} target="src"><FontAwesomeIcon icon={faExternalLinkAlt} /></a>
  },
  {
    dataField: 'gameId',
    text: 'Game',
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      getNameForGameId(row.gameId)
  },
  {
    dataField: 'categoryId',
    text: 'Category',
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      getNameForCategoryId(row.categoryId)
  },
  {
    dataField: 'platformId',
    text: 'Platform',
    formatter: (_, row: GameValueRow | undefined, __, formatExtraData?: FormatExtraDataProps) =>
      row &&
      formatExtraData &&
      (row.platformId
        ? formatExtraData.platforms[row.platformId]
        : '-')
  },
  {
    dataField: 'wrTime',
    text: 'WR Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      formatTime(row.wrTime),
  },
  {
    dataField: 'wrPointsPerSecond',
    text: 'WR Points/Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      `${(row.wrPointsPerSecond * 600 | 0) / 10} pt/m`,
  },
  {
    dataField: 'wrPoints',
    text: 'WR Points',
    searchable: false,
    sort: true,
  },
  {
    dataField: 'meanPointsPerSecond',
    text: 'WR Points/Avg Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      `${(row.meanPointsPerSecond * 600 | 0) / 10} pt/m`,
  },
  {
    dataField: 'meanTime',
    text: 'Avg Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      formatTime(row.meanTime),
  },
]

const sizePerPageRenderer: PaginationProps['sizePerPageRenderer'] = ({
  options,
  currSizePerPage,
  onSizePerPageChange,
}) => (
    <span className="react-bs-table-sizePerPage-dropdown float-right">
      {'Show '}
      <DropdownButton
        id="pageDropDown"
        variant="outline-primary"
        alignRight
        title={currSizePerPage}
        style={{ display: 'inline-block' }}
      >
        {
          options.map(option => {
            return <Dropdown.Item
              key={`data-page-${option.page}`}
              href="#"
              active={currSizePerPage === `${option.page}`}
              onClick={() => onSizePerPageChange(option.page)}
            >
              {option.text}
            </Dropdown.Item>
          })
        }
      </DropdownButton>
      {' entries'}
    </span>
  )

const paginationOptions: PaginationProps = {
  custom: true,
  showTotal: true,
  totalSize: -1,
  prePageTitle: 'hidden',
  nextPageTitle: 'hidden',
  alwaysShowAllBtns: true,
  sizePerPageList: [10, 25, 50, 100],
  sizePerPageRenderer,
}

const getAllGameValues = () => apiGet('game-values')
  .then<GameValue[]>(res => res.json())
  .then<GameValueRow[]>(gameValues => gameValues.map(gameValue => ({
    ...gameValue,
    wrPointsPerSecond: gameValue.wrPoints / gameValue.wrTime,
    meanPointsPerSecond: gameValue.wrPoints / gameValue.meanTime,
  })))

const getAllPlatforms = () => apiGet('https://www.speedrun.com/api/v1/platforms', { max: 200 }, false)
  .then<{ data: PlatformDto[] }>(res => res.json())
  .then<PlatformDto[]>(res => res.data)
  .then<IdToNameMap>(platforms => Object.fromEntries(platforms.map(platform => [platform.id, platform.name])))

const getNameForGameId = (gameId: string) => {
  let games: IdToNameMap = JSON.parse(localStorage.getItem('games') || '{}')
  const gameName = games[gameId]
  if (gameName) return gameName
  apiGet(`https://www.speedrun.com/api/v1/games/${gameId}`, undefined, false)
    .then(res => res.json())
    .then<string>(res => res.data.names.international)
    .then(gameName => {
      games = JSON.parse(localStorage.getItem('games') || '{}')
      games[gameId] = gameName
      localStorage.setItem('games', JSON.stringify(games))
    })
  return gameId
}

const getNameForCategoryId = (categoryId: string) => {
  let categories: IdToNameMap = JSON.parse(localStorage.getItem('categories') || '{}')
  const gameName = categories[categoryId]
  if (gameName) return gameName
  apiGet(`https://www.speedrun.com/api/v1/categories/${categoryId}`, undefined, false)
    .then(res => res.json())
    .then<string>(res => res.data.name)
    .then(gameName => {
      categories = JSON.parse(localStorage.getItem('categories') || '{}')
      categories[categoryId] = gameName
      localStorage.setItem('categories', JSON.stringify(categories))
    })
  return categoryId
}

const GameSearch = () => {
  const searchBarRef = useRef<Component<SearchProps>>(null)
  const boostrapTableRef = useRef<BootstrapTable>(null)
  const [gameValues, setGameValues] = useState<GameValueRow[]>([])
  const [platforms, setPlatforms] = useState<IdToNameMap>()

  useEffect(() => {
    getAllGameValues().then(setGameValues)
    getAllPlatforms().then(setPlatforms)
  }, [])

  return <Container>
    <label>Game search:</label>
    <ToolkitProvider
      keyField='runId'
      data={gameValues}
      columns={columns.map(column => {
        if (!platforms) return { ...column }
        const formatExtraData: FormatExtraDataProps = { platforms }
        return { ...column, formatExtraData, sortCaret }
      })}
      search={{
        searchFormatted: true
      }}
      bootstrap4
    >
      {(toolkitprops: ToolkitProviderProps) =>
        <PaginationProvider
          pagination={paginationFactory({
            ...paginationOptions,
            totalSize: gameValues.length,
          })}
        >
          {(({ paginationProps, paginationTableProps }) =>
            <div>
              <SearchBar ref={searchBarRef} {...toolkitprops.searchProps} />
              <SizePerPageDropdownStandalone {...paginationProps} />
              <BootstrapTable
                ref={boostrapTableRef}
                wrapperClasses="table-responsive"
                striped
                {...toolkitprops.baseProps}
                {...paginationTableProps}
                noDataIndication={() =>
                  (gameValues.length === 0 || !platforms)
                    ? <Spinner animation="border" role="scoreboard">
                      <span className="sr-only">Building the GameSearch. Please wait...</span>
                    </Spinner>
                    : <span>No matching records found</span>
                }
                defaultSorted={[{
                  dataField: 'wrPoints',
                  order: 'desc',
                }]}
              />
              <div>
                <PaginationTotalStandalone {...paginationProps} />
                <PaginationListStandalone {...paginationProps} />
              </div>
            </div>
          )}
        </PaginationProvider>
      }
    </ToolkitProvider>
  </Container >
}

export default GameSearch
