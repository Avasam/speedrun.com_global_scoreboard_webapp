import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import './Scoreboard.css'

import type { Component, MutableRefObject } from 'react'
import { forwardRef, useRef, useState } from 'react'
import { Col, FormLabel, Row, Spinner } from 'react-bootstrap'
import type { Column, ColumnFormatter } from 'react-bootstrap-table-next'
import BootstrapTable from 'react-bootstrap-table-next'
import paginationFactory, { PaginationListStandalone, PaginationProvider, PaginationTotalStandalone, SizePerPageDropdownStandalone } from 'react-bootstrap-table2-paginator'
import type { SearchProps, ToolkitProviderProps } from 'react-bootstrap-table2-toolkit'
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit'

import Configs from '../models/Configs'
import type { PlayerField } from '../models/Player'
import type Player from '../models/Player'
import { daysBetween } from '../utils/Time'
import defaultPaginationOptions from './TableElements/PaginationProps'
import PlayerNameCell from './TableElements/PlayerNameCell'
import PlayerScoreCell from './TableElements/PlayerScoreCell'
import ScoreTitle from './TableElements/ScoreTitle'
import sortCaret from './TableElements/SortCarret'

let getSortOrder: () => SortOrder | undefined
const currentTimeOnLoad = new Date()
const columnClass = (cell: Date | undefined) => {
  if (!cell) return 'daysSince0'
  const daysSince = daysBetween(cell, currentTimeOnLoad)
  if (daysSince >= Configs.lastUpdatedDays[2]) return 'daysSince'
  if (daysSince >= Configs.lastUpdatedDays[1]) return 'daysSince2'
  if (daysSince >= Configs.lastUpdatedDays[0]) return 'daysSince1'
  return 'daysSince0'
}

type FormatExtraDataProps = {
  currentUser: Player | null
  friends: Player[]
  handleOnUnfriend: (friendId: string) => void
  handleOnBefriend: (friendId: string) => void
}

const dateFormat: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }

const nameFormatter: ColumnFormatter<Player, FormatExtraDataProps> = (_cell, row, _rowIndex, formatExtraData) =>
  row &&
  formatExtraData &&
  <PlayerNameCell
    player={row}
    isFriend={formatExtraData.friends.some(friend => friend.userId === row.userId) || false}
    isCurrentUser={formatExtraData.currentUser?.userId === row.userId}
    handleOnUnfriend={formatExtraData.handleOnUnfriend}
    handleOnBefriend={formatExtraData.handleOnBefriend}
  />

const scoreHeaderFormatter = () =>
  <>
    <ScoreTitle />
    {sortCaret(getSortOrder())}
  </>

const scoreFormatter: ColumnFormatter<Player, void> = (_cell, row) =>
  row &&
  <PlayerScoreCell player={row} />

const columns: Column[] = [
  {
    dataField: 'rank',
    text: 'Rank',
    searchable: false,
  },
  {
    dataField: 'name',
    text: 'Name',
    formatter: nameFormatter,
    sort: true,
  },
  {
    dataField: 'score',
    text: 'Score',
    headerFormatter: scoreHeaderFormatter,
    searchable: false,
    formatter: scoreFormatter,
    sort: true,
  },
  {
    dataField: 'lastUpdate',
    text: 'Last Updated',
    formatter: (cell => cell?.toLocaleDateString('en-us', dateFormat)) as ColumnFormatter<Date, void>,
    classes: columnClass,
    searchable: false,
    sort: true,
  },
  {
    dataField: 'userId',
    text: 'ID',
  },
]

const rowClasses = (row: Player | undefined, currentUser: Player | null, friends: Player[]) => {
  let colorClass = ''
  if (!row) return ''
  if (row.userId === currentUser?.userId) {
    colorClass += ' highlight-current-user'
  }
  if (friends.some(friend => row.userId === friend.userId)) {
    colorClass += ' highlight-friend'
  }
  if (row.userId === 'kjp4y75j') {
    colorClass += ' highlight-vip'
  }
  return colorClass
}

const Legend = () =>
  <span className='legend'>
    <br />
    <FormLabel>Updated:</FormLabel>{' '}
    <span className='daysSince0'>This&nbsp;week</span>{', '}
    <span className='daysSince1'>This&nbsp;month</span>{', '}
    <span className='daysSince2'>In&nbsp;the&nbsp;last&nbsp;3&nbsp;months</span>{', '}
    <span className='daysSince'>Over&nbsp;3&nbsp;months&nbsp;ago</span>
  </span>

type ScoreboardProps = {
  currentUser: Player | null
  players: Player[]
  friends: Player[]
  onUnfriend: (playerId: string) => void
  onBefriend: (playerId: string) => void
}

export type ScoreboardRef = {
  jumpToPlayer: (playerId: string) => void
}

const buildSortFunction = (boostrapTable: BootstrapTable) => {
  const sortOrder = boostrapTable.sortContext.state.sortOrder === 'asc' ? 1 : -1
  const sortKey = boostrapTable.sortContext.state.sortColumn.dataField as PlayerField
  return (a: Player, b: Player) => {
    const sortItemA = a[sortKey] ?? 0
    const sortItemB = b[sortKey] ?? 0

    const comparison = typeof sortItemA === 'string'
      ? sortItemA.localeCompare(sortItemB as string)
      : sortItemA > sortItemB ? 1 : sortItemA < sortItemB ? -1 : 0
    return comparison * sortOrder
  }
}

const Scoreboard = forwardRef<ScoreboardRef, ScoreboardProps>((props, ref) => {
  (ref as MutableRefObject<ScoreboardRef>).current = {
    jumpToPlayer: (playerId: string) => {
      if (boostrapTableRef.current == null) throw new TypeError('boostrapTableRef.current is null or undefined')
      if (searchBarRef.current == null) throw new TypeError('searchBarRef.current is null or undefined')
      const sortedPlayers = [...props.players].sort(buildSortFunction(boostrapTableRef.current))
      const playerIndex = sortedPlayers.findIndex(player => player.userId === playerId)
      const currentSizePerPage = boostrapTableRef.current.paginationContext.currSizePerPage
      const jumpToPage = Math.floor(playerIndex / Number(currentSizePerPage)) + 1

      // Note: setState is used to ensure the table had time to update before jumping
      searchBarRef.current.props.onClear?.()
      searchBarRef.current.setState({ value: '' }, () => goToPage(jumpToPage))
    },
  }

  const searchBarRef = useRef<Component<SearchProps>>(null)
  const boostrapTableRef = useRef<BootstrapTable>(null)
  const [pageState, goToPage] = useState<number | undefined>()

  getSortOrder = () => boostrapTableRef.current?.sortContext.state.sortOrder

  return <>
    <FormLabel>Scoreboard:</FormLabel>
    <ToolkitProvider
      keyField='userId'
      data={props.players}
      columns={columns.map(column => {
        const formatExtraData: FormatExtraDataProps = {
          currentUser: props.currentUser,
          friends: props.friends,
          handleOnUnfriend: props.onUnfriend,
          handleOnBefriend: props.onBefriend,
        }
        return { ...column, formatExtraData, sortCaret }
      })}
      search
      bootstrap4
    >
      {(toolkitprops: ToolkitProviderProps) =>
        <PaginationProvider
          pagination={paginationFactory({
            ...defaultPaginationOptions,
            totalSize: props.players.length,
            // HACK: Required to keep the state in sync. Will not cause rerenders
            onPageChange: goToPage,
            onSizePerPageChange: (_, page) => goToPage(page),
            page: pageState,
          })}
        >
          {(({ paginationProps, paginationTableProps }) =>
            <div>
              <Row className='gx-0' noGutters>
                <Col xs='auto' className='mb-2 me-auto'>
                  <Search.SearchBar ref={searchBarRef} {...toolkitprops.searchProps} />
                </Col>
                <Col xs='auto' className='mb-2'>
                  <SizePerPageDropdownStandalone {...paginationProps} />
                </Col>
              </Row>
              <BootstrapTable
                ref={boostrapTableRef}
                wrapperClasses='table-responsive'
                striped
                rowClasses={(row?: Player) => rowClasses(row, props.currentUser, props.friends)}
                {...toolkitprops.baseProps}
                {...paginationTableProps}
                noDataIndication={() =>
                  props.players.length === 0
                    ? <Spinner animation='border' role='scoreboard'>
                      <span className='sr-only'>Building the Scoreboard. Please wait...</span>
                    </Spinner>
                    : <span>No matching records found</span>
                }
                defaultSorted={[{
                  dataField: 'score',
                  order: 'desc',
                }]}
              />
              <div>
                <PaginationTotalStandalone {...paginationProps} />
                <PaginationListStandalone {...paginationProps} />
                <Legend />
              </div>
            </div>
          )}
        </PaginationProvider>
      }
    </ToolkitProvider>
  </>
})
Scoreboard.displayName = 'Scoreboad'

export default Scoreboard
