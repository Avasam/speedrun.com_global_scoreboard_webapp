import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import 'src/Components/Dashboard/Scoreboard.css'
import './GameSearch.css'

import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ChangeEventHandler, Dispatch, SetStateAction } from 'react'
import { useEffect, useState } from 'react'
import { Col, Container, Form, FormGroup, FormLabel, InputGroup, Row, Spinner } from 'react-bootstrap'
import type { Column, ColumnFormatter } from 'react-bootstrap-table-next'
import BootstrapTable from 'react-bootstrap-table-next'
import filterFactory, { Comparator, multiSelectFilter, numberFilter } from 'react-bootstrap-table2-filter'
import paginationFactory, { PaginationListStandalone, PaginationProvider, PaginationTotalStandalone, SizePerPageDropdownStandalone } from 'react-bootstrap-table2-paginator'
import type { ToolkitProviderProps } from 'react-bootstrap-table2-toolkit'
import ToolkitProvider from 'react-bootstrap-table2-toolkit'
import { Picky } from 'react-picky'

import GameCategorySearch from './GameCategorySearchBar'
import ScoreDropCalculator from './ScoreDropCalculator'
import defaultPaginationOptions from 'src/Components/Dashboard/TableElements/PaginationProps'
import sortCaret from 'src/Components/Dashboard/TableElements/SortCarret'
import { apiGet, MAX_PAGINATION } from 'src/fetchers/Api'
import type { EmbeddedSrcRun } from 'src/Models/SrcResponse'
import math from 'src/utils/Math'
import { secondsToTimeString, timeStringToSeconds } from 'src/utils/Time'

type PlatformDto = {
  id: string
  name: string
}

type IdToNameMap = Record<string, string>

type GameValue = {
  gameId: string
  categoryId: string
  platformId: string | null
  meanTime: number
  runId: string
  wrPoints: number
  wrTime: number
}

type GameValueRow = GameValue & {
  wrPointsPerSecond: number
  meanPointsPerSecond: number
}

type PlatformSelectOption = {
  id: string
  name: string
}

type FormatExtraDataProps = {
  platforms: IdToNameMap
  gameMap: IdToNameMap
  setGameMap: Dispatch<SetStateAction<IdToNameMap>>
  categoryMap: IdToNameMap
  setCategoryMap: Dispatch<SetStateAction<IdToNameMap>>
}

let platformFilter: SelectFilterFunction
let minTimeFilter: NumberFilterFunction
let maxTimeFilter: NumberFilterFunction

const runIdFormatter: ColumnFormatter<GameValueRow, FormatExtraDataProps> =
  (_cell, row, _rowIndex, formatExtraData) => {
    if (!row || !formatExtraData) return ''
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

    return <a href={`https://www.speedrun.com/run/${row.runId}`} target='src'>
      <FontAwesomeIcon icon={faExternalLinkAlt} />
    </a>
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
    formatter: ((_, row, __, formatExtraData) =>
      (row &&
        formatExtraData &&
        formatExtraData.gameMap[row.gameId]) ||
      row?.gameId
    ) as ColumnFormatter<GameValueRow, FormatExtraDataProps>,
  },
  {
    dataField: 'categoryId',
    text: 'Category',
    formatter: ((_, row, __, formatExtraData) =>
      (row &&
        formatExtraData &&
        formatExtraData.categoryMap[row.categoryId]) ||
      row?.categoryId
    ) as ColumnFormatter<GameValueRow, FormatExtraDataProps>,
  },
  {
    dataField: 'platformId',
    text: 'Platform',
    formatter: ((_, row, __, formatExtraData) =>
      (row?.platformId &&
        formatExtraData &&
        formatExtraData.platforms[row.platformId]) ||
      '-'
    ) as ColumnFormatter<GameValueRow, FormatExtraDataProps>,
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
    formatter: ((_, row) =>
      row &&
      secondsToTimeString(row.wrTime)
    ) as ColumnFormatter<GameValueRow, void>,
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
    formatter: ((_, row) =>
      row &&
      `${math.perSecondToPerMinute(row.wrPointsPerSecond)} pt/m`
    ) as ColumnFormatter<GameValueRow, void>,
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
    formatter: ((_, row) =>
      row &&
      `${math.perSecondToPerMinute(row.meanPointsPerSecond)} pt/m`
    ) as ColumnFormatter<GameValueRow, void>,
  },
  {
    dataField: 'meanTime',
    text: 'Avg Time',
    searchable: false,
    sort: true,
    formatter: ((_, row) =>
      row &&
      secondsToTimeString(row.meanTime)
    ) as ColumnFormatter<GameValueRow, FormatExtraDataProps>,
    filter: numberFilter({
      getFilter: filter => minTimeFilter = filter,
      style: { 'display': 'none' },
    }),
  },
]

const getAllGameValues = () =>
  apiGet('game-values')
    .then<GameValue[]>(res => res.json())
    .then<GameValueRow[]>(gameValues => gameValues.map(gameValue => ({
      ...gameValue,
      wrPointsPerSecond: gameValue.wrPoints / gameValue.wrTime,
      meanPointsPerSecond: gameValue.wrPoints / gameValue.meanTime,
    })))

const getAllPlatforms = () => apiGet('https://www.speedrun.com/api/v1/platforms', { max: MAX_PAGINATION }, false)
  .then<{ data: PlatformDto[] }>(res => res.json())
  .then<PlatformDto[]>(res => res.data)
  .then<IdToNameMap>(platforms => Object.fromEntries(platforms.map(platform => [platform.id, platform.name])))

const requestsStartedForRun = new Map<string, boolean>()
const fetchValueNamesForRun = async (runId: string) => {
  if (requestsStartedForRun.get(runId)) return
  requestsStartedForRun.set(runId, true)
  return apiGet(`https://www.speedrun.com/api/v1/runs/${runId}?embed=game,category`, undefined, false)
    .then<EmbeddedSrcRun>(res => res.json())
    .then<[IdToNameMap, IdToNameMap]>(res => [
      { [res.data.game.data.id]: res.data.game.data.names.international },
      { [res.data.category.data.id]: res.data.category.data.name },
    ])
    .catch(() => {
      requestsStartedForRun.delete(runId)
    })
}

type LocalStorageItem = Record<string, unknown> | unknown[] | string

const getLocalStorageItem = function <T extends LocalStorageItem>(key: string, fallback: T) {
  const item = localStorage.getItem(key)
  if (item != null && item.constructor === fallback.constructor) return JSON.parse(item) as T
  return fallback
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
    setGameMap(getLocalStorageItem('games', {}))
    setCategoryMap(getLocalStorageItem('categories', {}))
    doPlatformSelection(getLocalStorageItem('selectedPlatforms', []))
    doMinTimeChange(getLocalStorageItem('selectedMinTime', ''))
    doMaxTimeChange(getLocalStorageItem('selectedMaxTime', ''))
    void getAllGameValues().then(setGameValues)
    void getAllPlatforms().then(setPlatforms)
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
  const handleMinTimeChange: ChangeEventHandler<HTMLInputElement> = event => {
    if (!(/^[1-9]?[\d:]{0,7}\d?$/).test(event.currentTarget.value)) return
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
  const handleMaxTimeChange: ChangeEventHandler<HTMLInputElement> = event => {
    if (!(/^[1-9]?[\d:]{0,7}\d?$/).test(event.currentTarget.value)) return
    doMaxTimeChange(event.currentTarget.value)
    localStorage.setItem('selectedMaxTime', JSON.stringify(event.currentTarget.value))
  }

  const buildPlatformsOptions = () =>
    Object
      .entries(platforms ?? {})
      .filter(([id]) => gameValues.some(gameValue => gameValue.platformId === id))
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
            ...defaultPaginationOptions,
            totalSize: gameValues.length,
          })}
        >
          {(({ paginationProps, paginationTableProps }) =>
            <>
              <Row className='gx-0' noGutters>
                <Col xs='auto'>
                  <GameCategorySearch
                    {...toolkitprops.searchProps}
                    placeholder='Game / Category search'
                    setGameMap={setGameMap}
                  />
                </Col>
                <Col xs='auto' className='mb-2 me-2'>
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
                </Col>
                <FormGroup as={Col} xs='auto' className='mb-2 me-auto time-between'>
                  <FormLabel>Time between</FormLabel>
                  <InputGroup>
                    <Form.Control
                      name='min-time'
                      placeholder='Min Avg'
                      value={minTimeText}
                      onChange={handleMinTimeChange} />
                    <InputGroup.Text>-</InputGroup.Text>
                    <Form.Control
                      name='max-time'
                      placeholder='Max WR'
                      value={maxTimeText}
                      onChange={handleMaxTimeChange} />
                  </InputGroup>
                </FormGroup>
                <Col xs='auto' className='mb-2'>
                  <SizePerPageDropdownStandalone {...paginationProps} />
                </Col>
              </Row>

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
            </>
          )}
        </PaginationProvider>
      }
    </ToolkitProvider>
    <ScoreDropCalculator />
  </Container >
}

export default GameSearch
