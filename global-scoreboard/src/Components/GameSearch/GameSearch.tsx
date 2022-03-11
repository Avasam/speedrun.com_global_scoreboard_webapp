import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import 'src/Components/Dashboard/Scoreboard.css'
import './GameSearch.css'

import type { ChangeEventHandler } from 'react'
import { useEffect, useState } from 'react'
import { Col, Container, Form, FormGroup, FormLabel, InputGroup, Row, Spinner } from 'react-bootstrap'
import type { ColumnDescription } from 'react-bootstrap-table-next'
import BootstrapTable from 'react-bootstrap-table-next'
import filterFactory, { Comparator, multiSelectFilter, numberFilter } from 'react-bootstrap-table2-filter'
import paginationFactory, { PaginationListStandalone, PaginationProvider, PaginationTotalStandalone, SizePerPageDropdownStandalone } from 'react-bootstrap-table2-paginator'
import ToolkitProvider from 'react-bootstrap-table2-toolkit'
import { Helmet } from 'react-helmet'
import { Picky } from 'react-picky'

import GameCategorySearchBar from './GameCategorySearchBar'
import type { FormatExtraDataProps } from './RunIdFormatter'
import runIdFormatter from './RunIdFormatter'
import ScoreDropCalculator from './ScoreDropCalculator'
import defaultPaginationOptions from 'src/Components/Dashboard/TableElements/PaginationProps'
import sortCaret from 'src/Components/Dashboard/TableElements/SortCarret'
import type { GameValueRow, IdToNameMap, PlatformSelectOption } from 'src/Models/GameSearch'
import { getAllGameValues, getAllPlatforms } from 'src/Models/GameSearch'
import { getLocalStorageItem, setLocalStorageItem } from 'src/utils/localStorage'
import math from 'src/utils/math'
import { secondsToTimeString, timeStringToSeconds } from 'src/utils/time'

type NumberFilter = (value: { number: number | '', comparator: Comparator }) => void

let platformFilter: (value: string[]) => void
let minTimeFilter: NumberFilter
let maxTimeFilter: NumberFilter
const columns: ColumnDescription<GameValueRow, FormatExtraDataProps>[] = [
  {
    dataField: 'runId',
    text: '',
    searchable: false,
    formatter: runIdFormatter,
  },
  {
    dataField: 'gameId',
    text: 'Game',
    formatter: (_, row, __, formatExtraData) => formatExtraData?.gameMap[row.gameId] ?? row.gameId,
  },
  {
    dataField: 'categoryId',
    text: 'Category',
    formatter: (_, row, __, formatExtraData) => formatExtraData?.categoryMap[row.categoryId] ?? row.categoryId,
  },
  {
    dataField: 'platforms',
    text: 'Platform',
    formatter: (_, row, __, formatExtraData) =>
      row.platforms.length > 0
        ? row
          .platforms
          .map(platformId => formatExtraData?.allPlatforms[platformId])
          .join(', ')
        : '-',
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
    formatter: (_, row) => secondsToTimeString(row.wrTime),
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
    formatter: (_, row) => `${math.perSecondToPerMinute(row.wrPointsPerSecond)} pt/m`,
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
    formatter: (_, row) => `${math.perSecondToPerMinute(row.meanPointsPerSecond)} pt/m`,
  },
  {
    dataField: 'meanTime',
    text: 'Avg Time',
    searchable: false,
    sort: true,
    formatter: (_, row) => secondsToTimeString(row.meanTime),
    filter: numberFilter({
      getFilter: filter => minTimeFilter = filter,
      style: { 'display': 'none' },
    }),
  },
]

const GameSearch = () => {
  const [gameValues, setGameValues] = useState<GameValueRow[]>([])
  const [allPlatforms, setAllPlatforms] = useState<IdToNameMap>()
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformSelectOption[]>([])
  const [gameMap, setGameMap] = useState<IdToNameMap>({})
  const [categoryMap, setCategoryMap] = useState<IdToNameMap>({})
  const [includeAlternatePlatforms, setIncludeAlternatePlatforms] = useState(false)
  const [minTimeText, setMinTimeText] = useState('')
  const [maxTimeText, setMaxTimeText] = useState('')

  useEffect(() => {
    setGameMap(getLocalStorageItem('games', {}))
    setCategoryMap(getLocalStorageItem('categories', {}))
    doPlatformSelection(getLocalStorageItem('selectedPlatforms', []))
    setIncludeAlternatePlatforms(getLocalStorageItem('includeAlternatePlatforms', true))
    doMinTimeChange(getLocalStorageItem('selectedMinTime', ''))
    doMaxTimeChange(getLocalStorageItem('selectedMaxTime', ''))
    void getAllGameValues().then(setGameValues)
    void getAllPlatforms().then(setAllPlatforms)
  }, [])

  const doPlatformSelection = (selectedPlatformOptions: PlatformSelectOption[]) => {
    platformFilter(selectedPlatformOptions.map(platform => platform.id))
    setSelectedPlatforms(selectedPlatformOptions)
  }
  const handlePlatformSelection = (selectedPlatformOptions: PlatformSelectOption[]) => {
    doPlatformSelection(selectedPlatformOptions)
    setLocalStorageItem('selectedPlatforms', selectedPlatformOptions)
  }

  const handleIncludeAlternatePlatform: ChangeEventHandler<HTMLInputElement> = event => {
    setIncludeAlternatePlatforms(event.currentTarget.checked)
    setLocalStorageItem('includeAlternatePlatforms', event.currentTarget.checked)
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
    setLocalStorageItem('selectedMinTime', event.currentTarget.value)
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
    setLocalStorageItem('selectedMaxTime', event.currentTarget.value)
  }

  const buildPlatformsOptions = () =>
    Object
      .entries(allPlatforms ?? {})
      .filter(([id]) => gameValues.some(gameValue =>
        gameValue.platformId === id ||
        (includeAlternatePlatforms && gameValue.alternatePlatformsIds.includes(id))))
      .map(([id, name]) => ({ id, name } as PlatformSelectOption))

  const noDataIndication = () =>
    gameValues.length === 0 || !allPlatforms
      ? <Spinner animation='border' role='scoreboard' variant='primary'>
        <span className='visually-hidden'>Building the GameSearch. Please wait...</span>
      </Spinner>
      : <span>No matching records found</span>

  return <Container>
    <Helmet>
      <title>
        Game Search Tool
      </title>
    </Helmet>
    <br />
    <ToolkitProvider
      bootstrap4
      columns={columns.map(column => {
        const text = column.dataField === 'platforms' && includeAlternatePlatforms
          ? 'Platforms'
          : column.text
        const formatExtraData: FormatExtraDataProps = {
          allPlatforms: allPlatforms ?? {},
          gameMap,
          setGameMap,
          categoryMap,
          setCategoryMap,
        }

        return { ...column, text, formatExtraData, sortCaret }
      })}
      data={gameValues.map(gameValue => {
        gameValue.platforms = includeAlternatePlatforms
          ? [gameValue.platformId, ...gameValue.alternatePlatformsIds]
          : [gameValue.platformId]

        return gameValue
      })}
      keyField='runId'
      search={{
        searchFormatted: true,
      }}
    >
      {toolkitprops =>
        <PaginationProvider
          pagination={paginationFactory({
            ...defaultPaginationOptions,
            totalSize: gameValues.length,
          })}
        >
          {(({ paginationProps, paginationTableProps }) =>
            <>
              <Row className='gx-0' style={{ alignItems: 'center' }}>
                <Col xs='auto'>
                  <GameCategorySearchBar
                    {...toolkitprops.searchProps}
                    placeholder='Game / Category search'
                    setGameMap={setGameMap}
                  />
                </Col>
                <Col className='mb-2 me-2' xs='auto'>
                  <Picky
                    allSelectedPlaceholder='All platforms selected'
                    buttonProps={{ 'className': 'form-control' }}
                    id='platform-multiselect'
                    includeFilter
                    includeSelectAll
                    labelKey='name'
                    manySelectedPlaceholder='%s platforms selected'
                    multiple
                    numberDisplayed={1}
                    onChange={values => handlePlatformSelection(values as PlatformSelectOption[])}
                    options={buildPlatformsOptions()}
                    placeholder='Filter by platforms'
                    value={selectedPlatforms}
                    valueKey='id'
                  />
                </Col>
                <Col className='mb-2 me-2' xs='auto'>
                  <Form.Check
                    checked={includeAlternatePlatforms}
                    id='includeAlternatePlatforms'
                    label='Include alternate platforms'
                    onChange={handleIncludeAlternatePlatform}
                  />
                </Col>
                <FormGroup as={Col} className='mb-2 me-auto time-between' xs='auto'>
                  <FormLabel>Time between</FormLabel>
                  <InputGroup>
                    <Form.Control
                      name='min-time'
                      onChange={handleMinTimeChange}
                      placeholder='Min Avg'
                      value={minTimeText}
                    />
                    <InputGroup.Text>-</InputGroup.Text>
                    <Form.Control
                      name='max-time'
                      onChange={handleMaxTimeChange}
                      placeholder='Max WR'
                      value={maxTimeText}
                    />
                  </InputGroup>
                </FormGroup>
                <Col className='mb-2' xs='auto'>
                  <SizePerPageDropdownStandalone {...paginationProps} />
                </Col>
              </Row>

              <BootstrapTable
                striped
                wrapperClasses='table-responsive'
                {...toolkitprops.baseProps}
                {...paginationTableProps}
                defaultSorted={[{
                  dataField: 'wrPoints',
                  order: 'desc',
                }]}
                filter={filterFactory()}
                noDataIndication={noDataIndication}
              />

              <div>
                <PaginationTotalStandalone {...paginationProps} />
                <PaginationListStandalone {...paginationProps} />
              </div>
            </>
          )}
        </PaginationProvider>}
    </ToolkitProvider>
    <ScoreDropCalculator />
  </Container >
}

export default GameSearch
