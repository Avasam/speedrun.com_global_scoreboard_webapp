import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import './Scoreboard.css'

import type { Component, MutableRefObject } from 'react'
import { forwardRef, useRef, useState } from 'react'
import { Col, FormLabel, Row, Spinner } from 'react-bootstrap'
import type { BootstrapTableRef, ColumnDescription, SearchProps, SortOrder } from 'react-bootstrap-table-next'
import BootstrapTable from 'react-bootstrap-table-next'
import paginationFactory, { PaginationListStandalone, PaginationProvider, PaginationTotalStandalone, SizePerPageDropdownStandalone } from 'react-bootstrap-table2-paginator'
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit'

import defaultPaginationOptions from './TableElements/PaginationProps'
import PlayerNameCell from './TableElements/PlayerNameCell'
import PlayerScoreCell from './TableElements/PlayerScoreCell'
import ScoreTitle from './TableElements/ScoreTitle'
import sortCaret from './TableElements/SortCarret'
import Configs from 'src/Models/Configs'
import type { PlayerField } from 'src/Models/Player'
import type Player from 'src/Models/Player'
import { diffDays } from 'src/utils/time'

type FormatExtraDataProps = {
  currentUser: Player | null
  friends: Player[]
  handleOnUnfriend: (friendId: string) => void
  handleOnBefriend: (friendId: string) => void
}

type ScoreboardColumnDescription = ColumnDescription<Player, FormatExtraDataProps>

let getSortOrder: () => SortOrder | undefined
const currentTimeOnLoad = new Date()
const columnClass: ScoreboardColumnDescription['classes'] = cell => {
  if (!(cell instanceof Date)) return 'daysSince0'
  const daysSince = diffDays(currentTimeOnLoad, cell)
  if (daysSince >= Configs.lastUpdatedDays[2]) return 'daysSince'
  if (daysSince >= Configs.lastUpdatedDays[1]) return 'daysSince2'
  if (daysSince >= Configs.lastUpdatedDays[0]) return 'daysSince1'

  return 'daysSince0'
}

const dateFormat: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }

const columns: ScoreboardColumnDescription[] = [
  {
    dataField: 'rank',
    text: 'Rank',
    searchable: false,
  },
  {
    dataField: 'name',
    text: 'Name',
    formatter: (_cell, row, _rowIndex, formatExtraData) =>
      formatExtraData &&
      <PlayerNameCell
        handleOnBefriend={formatExtraData.handleOnBefriend}
        handleOnUnfriend={formatExtraData.handleOnUnfriend}
        isCurrentUser={formatExtraData.currentUser?.userId === row.userId}
        isFriend={formatExtraData.friends.some(friend => friend.userId === row.userId) || false}
        player={row}
      />,
    sort: true,
  },
  {
    dataField: 'score',
    text: 'Score',
    headerFormatter: () =>
      <>
        <ScoreTitle />
        {sortCaret(getSortOrder())}
      </>,
    searchable: false,
    formatter: (_cell, row) => <PlayerScoreCell player={row} />,
    sort: true,
  },
  {
    dataField: 'lastUpdate',
    text: 'Last Updated',
    formatter: (cell?: Date) => cell?.toLocaleDateString('en-us', dateFormat),
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
    <FormLabel>Updated:</FormLabel>
    {' '}
    <span className='daysSince0'>This&nbsp;week</span>
    {', '}
    <span className='daysSince1'>This&nbsp;month</span>
    {', '}
    <span className='daysSince2'>In&nbsp;the&nbsp;last&nbsp;3&nbsp;months</span>
    {', '}
    <span className='daysSince'>Over&nbsp;3&nbsp;months&nbsp;ago</span>
  </span>

export type ScoreboardProps = {
  currentUser: Player | null
  players: Player[]
  friends: Player[] | undefined
  onUnfriend: (playerId: string) => void
  onBefriend: (playerId: string) => void
}

export type ScoreboardRef = {
  jumpToPlayer: (playerId: string) => void
}

const buildSortFunction = (boostrapTable: BootstrapTableRef) => {
  const sortOrder = boostrapTable.sortContext?.state.sortOrder === 'asc' ? 1 : -1
  const sortKey = boostrapTable.sortContext?.state.sortColumn.dataField as PlayerField

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
      const currentSizePerPage = boostrapTableRef.current.paginationContext?.currSizePerPage
      const jumpToPage = Math.floor(playerIndex / Number(currentSizePerPage)) + 1

      // Note: setState is used to ensure the table had time to update before jumping
      searchBarRef.current.props.onClear?.()
      searchBarRef.current.setState({ value: '' }, () => goToPage(jumpToPage))
    },
  }

  const searchBarRef = useRef<Component<SearchProps<Player>>>(null)
  const boostrapTableRef = useRef<BootstrapTable & BootstrapTableRef>(null)
  const [pageState, goToPage] = useState<number | undefined>()

  const noDataIndication = () =>
    props.players.length === 0
      ? <Spinner animation='border' role='scoreboard' variant='primary'>
        <span className='visually-hidden'>Building the Scoreboard. Please wait...</span>
      </Spinner>
      : <span>No matching records found</span>

  getSortOrder = () => boostrapTableRef.current?.sortContext?.state.sortOrder
  return <ToolkitProvider
    bootstrap4
    columns={columns.map(column => {
      const formatExtraData: FormatExtraDataProps = {
        currentUser: props.currentUser,
        friends: props.friends ?? [],
        handleOnUnfriend: props.onUnfriend,
        handleOnBefriend: props.onBefriend,
      }

      return { ...column, formatExtraData, sortCaret }
    })}
    data={props.players}
    keyField='userId'
    search
  >
    {toolkitprops =>
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
          <>
            <Row className='gx-0'>
              <Col className='mb-2 me-auto' xs='auto'>
                <Search.SearchBar ref={searchBarRef} {...toolkitprops.searchProps} />
              </Col>
              <Col className='mb-2' xs='auto'>
                <SizePerPageDropdownStandalone {...paginationProps} />
              </Col>
            </Row>
            <div className='panel panel-default'>
              <BootstrapTable
                ref={boostrapTableRef}
                rowClasses={(row?: Player) => rowClasses(row, props.currentUser, props.friends ?? [])}
                striped
                wrapperClasses='table-responsive'
                {...toolkitprops.baseProps}
                {...paginationTableProps}
                defaultSorted={[{
                  dataField: 'score',
                  order: 'desc',
                }]}
                noDataIndication={noDataIndication}
              />
            </div>
            <div>
              <PaginationTotalStandalone {...paginationProps} />
              <PaginationListStandalone {...paginationProps} />
              <Legend />
            </div>
          </>
        )}
      </PaginationProvider>}
  </ToolkitProvider>
})
Scoreboard.displayName = 'Scoreboad'

export default Scoreboard
