import '../Dashboard/Scoreboard.css'
import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import './GameSearch.css'
import BootstrapTable, { Column } from 'react-bootstrap-table-next'
import { Container, Dropdown, DropdownButton, FormControl, InputGroup, Spinner } from 'react-bootstrap'
import React, { useEffect, useState } from 'react'
import ToolkitProvider, { ToolkitProviderProps } from 'react-bootstrap-table2-toolkit'
import filterFactory, { Comparator, multiSelectFilter, numberFilter } from 'react-bootstrap-table2-filter'
import paginationFactory, { PaginationListStandalone, PaginationProvider, PaginationTotalStandalone, SizePerPageDropdownStandalone } from 'react-bootstrap-table2-paginator'
import { secondsToTimeString, timeStringToSeconds } from '../utils/Time'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import GameCategorySearch from './GameCategorySearchBar'
import { Picky } from 'react-picky'
import ScoreDropCalculator from './ScoreDropCalculator'
import { apiGet } from '../fetchers/Api'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import sortCaret from '../Dashboard/TableElements/SortCarret'

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

interface PlatformSelectOption {
  id: string
  name: string
}

type FormatExtraDataProps = {
  platforms: IdToNameMap
  gameMap: IdToNameMap
  setGameMap: React.Dispatch<React.SetStateAction<IdToNameMap>>
  categoryMap: IdToNameMap
  setCategoryMap: React.Dispatch<React.SetStateAction<IdToNameMap>>
}

let platformFilter: FilterFunction<string[]>
let minTimeFilter: NumberFilterFunction
let maxTimeFilter: NumberFilterFunction

const runIdFormatter = (_cell: unknown, row: GameValueRow | undefined, _rowIndex: number, formatExtraData?: FormatExtraDataProps) => {
  if (!row || !formatExtraData) return ''
  if (!formatExtraData.gameMap[row.gameId] || !formatExtraData.categoryMap[row.categoryId]) {
    fetchValueNamesForRun(row.runId)
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
  return <a href={`https://www.speedrun.com/run/${row.runId}`} target='src'><FontAwesomeIcon icon={faExternalLinkAlt} /></a>
}

const columns: Column[] = [
  {
    dataField: 'runId',
    text: '',
    searchable: false,
    formatter: runIdFormatter,
  },
  {
    dataField: 'gameId',
    text: 'Game',
    formatter: (_, row: GameValueRow | undefined, __, formatExtraData?: FormatExtraDataProps) =>
      (row &&
        formatExtraData &&
        formatExtraData.gameMap[row.gameId]) ||
      row?.gameId
  },
  {
    dataField: 'categoryId',
    text: 'Category',
    formatter: (_, row: GameValueRow | undefined, __, formatExtraData?: FormatExtraDataProps) =>
      (row &&
        formatExtraData &&
        formatExtraData.categoryMap[row.categoryId]) ||
      row?.categoryId
  },
  {
    dataField: 'platformId',
    text: 'Platform',
    formatter: (_, row: GameValueRow | undefined, __, formatExtraData?: FormatExtraDataProps) =>
      (row &&
        row.platformId &&
        formatExtraData &&
        formatExtraData.platforms[row.platformId]) ||
      '-',
    filter: multiSelectFilter({
      options: {},
      getFilter: filter => platformFilter = filter,
      style: { 'display': 'none' },
    }),
  },
  {
    dataField: 'wrTime',
    text: 'WR Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      secondsToTimeString(row.wrTime),
    filter: numberFilter({
      getFilter: filter => maxTimeFilter = filter,
      style: { 'display': 'none' },
    }),
  },
  {
    dataField: 'wrPointsPerSecond',
    text: 'WR Points/Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      `${Math.trunc(row.wrPointsPerSecond * 600) / 10} pt/m`,
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
      `${Math.trunc(row.meanPointsPerSecond * 600) / 10} pt/m`,
  },
  {
    dataField: 'meanTime',
    text: 'Avg Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      secondsToTimeString(row.meanTime),
    filter: numberFilter({
      getFilter: filter => minTimeFilter = filter,
      style: { 'display': 'none' },
    }),
  },
]

const sizePerPageRenderer: PaginationProps['sizePerPageRenderer'] = ({
  options,
  currSizePerPage,
  onSizePerPageChange,
}) =>
  <span className='react-bs-table-sizePerPage-dropdown float-right'>
    {'Show '}
    <DropdownButton
      id='pageDropDown'
      variant='outline-primary'
      alignRight
      title={currSizePerPage}
      style={{ display: 'inline-block' }}
    >
      {
        options.map(option =>
          <Dropdown.Item
            key={`data-page-${option.page}`}
            href='#'
            active={currSizePerPage === `${option.page}`}
            onClick={() => onSizePerPageChange(option.page)}
          >
            {option.text}
          </Dropdown.Item>)
      }
    </DropdownButton>
    {' entries'}
  </span>

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

const requestsStartedForRun = new Map<string, boolean>()
const fetchValueNamesForRun = async (runId: string) => {
  if (requestsStartedForRun.get(runId)) return
  requestsStartedForRun.set(runId, true)
  return apiGet(`https://www.speedrun.com/api/v1/runs/${runId}?embed=game,category`, undefined, false)
    .then(res => res.json())
    .then<[IdToNameMap, IdToNameMap]>(res => [
      { [res.data.game.data.id]: res.data.game.data.names.international },
      { [res.data.category.data.id]: res.data.category.data.name },
    ])
    .catch(() => { requestsStartedForRun.delete(runId) })
}

const GameSearch = () => {
  const [gameValues, setGameValues] = useState<GameValueRow[]>([])
  const [platforms, setPlatforms] = useState<IdToNameMap>()
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformSelectOption[]>([])
  const [gameMap, setGameMap] = useState<IdToNameMap>({})
  const [categoryMap, setCategoryMap] = useState<IdToNameMap>({})
  const [minTimeText, setMinTimeText] = useState('')
  const [maxTimeText, setMaxTimeText] = useState('')

  useEffect(() => {
    setGameMap(JSON.parse(localStorage.getItem('games') || '{}'))
    setCategoryMap(JSON.parse(localStorage.getItem('categories') || '{}'))
    doPlatformSelection(JSON.parse(localStorage.getItem('selectedPlatforms') || '[]'))
    doMinTimeChange(JSON.parse(localStorage.getItem('selectedMinTime') || '""'))
    doMaxTimeChange(JSON.parse(localStorage.getItem('selectedMaxTime') || '""'))
    getAllGameValues().then(setGameValues)
    getAllPlatforms().then(setPlatforms)
  }, [])

  const doPlatformSelection = (selectedPlatformOptions: PlatformSelectOption[]) => {
    platformFilter(selectedPlatformOptions.map(platform => platform.id))
    setSelectedPlatforms(selectedPlatformOptions)
  }
  const handlePlatformSelection = (selectedPlatformOptions: PlatformSelectOption[]) => {
    doPlatformSelection(selectedPlatformOptions)
    localStorage.setItem('selectedPlatforms', JSON.stringify(selectedPlatformOptions))
  }

  const doMinTimeChange = (minTime: string) => {
    setMinTimeText(minTime)
    minTimeFilter({
      number: timeStringToSeconds(minTime),
      comparator: Comparator.GE,
    })
  }
  const handleMinTimeChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    if (!event.currentTarget.value.match(/^[1-9]?[\d:]{0,7}\d?$/)) return
    doMinTimeChange(event.currentTarget.value)
    localStorage.setItem('selectedMinTime', JSON.stringify(event.currentTarget.value))
  }

  const doMaxTimeChange = (maxTime: string) => {
    setMaxTimeText(maxTime)
    maxTimeFilter({
      number: timeStringToSeconds(maxTime),
      comparator: Comparator.LE,
    })
  }
  const handleMaxTimeChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    if (!event.currentTarget.value.match(/^[1-9]?[\d:]{0,7}\d?$/)) return
    doMaxTimeChange(event.currentTarget.value)
    localStorage.setItem('selectedMaxTime', JSON.stringify(event.currentTarget.value))
  }

  const buildPlatformsOptions = () =>
    Object
      .entries(platforms || {})
      .filter(([id, name]) => gameValues.some(gameValue => gameValue.platformId === id))
      .map(([id, name]) => ({ id, name } as PlatformSelectOption))

  return <Container>
    <br />
    <ToolkitProvider
      keyField='runId'
      data={gameValues}
      columns={columns.map(column => {
        if (!platforms) return column
        const formatExtraData: FormatExtraDataProps = { platforms, gameMap, setGameMap, categoryMap, setCategoryMap }
        return { ...column, formatExtraData, sortCaret }
      })}
      search={{
        searchFormatted: true,
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
              <GameCategorySearch
                {...toolkitprops.searchProps}
                placeholder='Game / Category search'
                setGameMap={setGameMap}
              />
              <Picky
                id='platform-multiselect'
                valueKey='id'
                labelKey='name'
                buttonProps={{ 'className': 'form-control' }}
                placeholder='Filter by platforms'
                manySelectedPlaceholder='%s platforms selected'
                allSelectedPlaceholder='All platforms selected'
                numberDisplayed={1}
                options={buildPlatformsOptions()}
                value={selectedPlatforms}
                multiple={true}
                includeSelectAll={true}
                includeFilter={true}
                onChange={values => handlePlatformSelection(values as PlatformSelectOption[])}
              />
              <div className='time-between'>
                <label>Time between</label>
                <InputGroup>
                  <FormControl
                    name='min-time'
                    placeholder='Min Avg'
                    value={minTimeText}
                    onChange={handleMinTimeChange} />
                  <InputGroup.Append className='input-group-prepend'>
                    <InputGroup.Text>-</InputGroup.Text>
                  </InputGroup.Append>
                  <FormControl
                    name='max-time'
                    placeholder='Max WR'
                    value={maxTimeText}
                    onChange={handleMaxTimeChange} />
                </InputGroup>
              </div>
              <SizePerPageDropdownStandalone {...paginationProps} />
              <BootstrapTable
                wrapperClasses='table-responsive'
                striped
                {...toolkitprops.baseProps}
                {...paginationTableProps}
                noDataIndication={() =>
                  gameValues.length === 0 || !platforms
                    ? <Spinner animation='border' role='scoreboard'>
                      <span className='sr-only'>Building the GameSearch. Please wait...</span>
                    </Spinner>
                    : <span>No matching records found</span>
                }
                defaultSorted={[{
                  dataField: 'wrPoints',
                  order: 'desc',
                }]}
                filter={filterFactory()}
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
    <ScoreDropCalculator />
  </Container >
}

export default GameSearch
