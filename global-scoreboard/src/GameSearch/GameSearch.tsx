/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import BootstrapTable, { Column } from 'react-bootstrap-table-next'
import { Container, Dropdown, DropdownButton, Spinner } from 'react-bootstrap'
import React, { Component, useEffect, useRef, useState } from 'react'
import ToolkitProvider, { Search, SearchProps, ToolkitProviderProps } from 'react-bootstrap-table2-toolkit'
import paginationFactory, { PaginationListStandalone, PaginationProvider, PaginationTotalStandalone, SizePerPageDropdownStandalone } from 'react-bootstrap-table2-paginator'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { apiGet } from '../fetchers/api'
import { faLongArrowAltDown } from '@fortawesome/free-solid-svg-icons'
import { faLongArrowAltUp } from '@fortawesome/free-solid-svg-icons'
const { SearchBar } = Search

interface PlatformDto {
  id: string
  name: string
}

type PlatformMap = Map<string, string>

interface GameValue {
  gameId: string
  categoryId: string
  platformId: string
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
  <span className="sortCarrets">
    {' '}
    <FontAwesomeIcon className={order === 'asc' ? 'active' : ''} icon={faLongArrowAltDown} />
    <FontAwesomeIcon className={order === 'desc' ? 'active' : ''} icon={faLongArrowAltUp} />
  </span>

type FormatExtraDataProps = {
  platforms: PlatformMap
}

const columns: Column[] = [
  {
    dataField: 'gameId',
    text: 'Game',
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      <a href={`https://www.speedrun.com/run/${row.runId}`} target="src">{row.runId}</a>
  },
  {
    dataField: 'categoryId',
    text: 'Category',
  },
  {
    dataField: 'platformId',
    text: 'Platform',
    formatter: (_, row: GameValueRow | undefined, __, formatExtraData?: FormatExtraDataProps) =>
      row &&
      formatExtraData &&
      formatExtraData.platforms.get(row.platformId)
  },
  {
    dataField: 'wrTime',
    text: 'WR Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      new Date(row.meanTime * 1000).toISOString().substr(11, 8),
  },
  {
    dataField: 'wrPointsPerSecond',
    text: 'WR Points/Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      `${(row.wrPointsPerSecond * 60).toFixed(1)} pt/m`,
  },
  {
    dataField: 'wrPoints',
    text: 'WR Points',
    searchable: false,
    sort: true,
  },
  {
    dataField: 'meanPointsPerSecond',
    text: 'WR Points/Mean Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      `${(row.meanPointsPerSecond * 60).toFixed(1)} pt/m`,
  },
  {
    dataField: 'meanTime',
    text: 'Mean Time',
    searchable: false,
    sort: true,
    formatter: (_, row: GameValueRow | undefined) =>
      row &&
      new Date(row.meanTime * 1000).toISOString().substr(11, 8),
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
  .then<PlatformMap>(platforms => new Map(platforms.map(platform => [platform.id, platform.name])))

const GameSearch = () => {
  const searchBarRef = useRef<Component<SearchProps>>(null)
  const boostrapTableRef = useRef<BootstrapTable>(null)
  const [gameValues, setGameValues] = useState<GameValueRow[]>([])
  const [platforms, setPlatforms] = useState<PlatformMap>()

  useEffect(() => {
    getAllGameValues().then(setGameValues)
    getAllPlatforms().then(setPlatforms)
  }, [])

  return <Container>
    <label>GameSearch:</label>
    <ToolkitProvider
      keyField='runId'
      data={gameValues}
      columns={columns.map(column => {
        if (!platforms) return { ...column }
        const formatExtraData: FormatExtraDataProps = { platforms }
        return { ...column, formatExtraData, sortCaret }
      })}
      search
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
