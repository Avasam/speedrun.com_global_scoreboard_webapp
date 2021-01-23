import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import './Scoreboard.css'

import { Component, forwardRef, MutableRefObject, useRef, useState } from 'react'
import { Dropdown, DropdownButton, Spinner } from 'react-bootstrap'
import BootstrapTable, { Column } from 'react-bootstrap-table-next'
import paginationFactory, { PaginationListStandalone, PaginationProvider, PaginationTotalStandalone, SizePerPageDropdownStandalone } from 'react-bootstrap-table2-paginator'
import ToolkitProvider, { Search, SearchProps, ToolkitProviderProps } from 'react-bootstrap-table2-toolkit'

import Configs from '../models/Configs'
import Player, { PlayerField } from '../models/Player'
import PlayerNameCell from './TableElements/PlayerNameCell'
import PlayerScoreCell from './TableElements/PlayerScoreCell'
import ScoreTitle from './TableElements/ScoreTitle'
import sortCaret from './TableElements/SortCarret'
const { SearchBar } = Search

let getSortOrder: () => SortOrder | undefined
const currentTimeOnLoad = new Date()
const columnClass = (cell: Date | undefined) => {
  if (!cell) return 'daysSince0'
  // FIXME: This probably doesn't take daylight savings and other weird shenanigans into account
  const daysSince = Math.floor((currentTimeOnLoad.getTime() - cell.getTime()) / 86_400_000)
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

const dateFormat = { year: 'numeric', month: 'long', day: 'numeric' }

const nameFormatter = (_cell: unknown, row: Player | undefined, _rowIndex: number, formatExtraData?: FormatExtraDataProps) =>
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

const scoreFormatter = (_cell: unknown, row: Player | undefined) =>
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
    formatter: (cell: Date | undefined) => cell && cell.toLocaleDateString('en-us', dateFormat),
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

const Legend = () =>
  <span className='legend'>
    <br />
    <label>Updated:</label>{' '}
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
    const sortItemA = a[sortKey] || 0
    const sortItemB = b[sortKey] || 0

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
    }
  }

  const searchBarRef = useRef<Component<SearchProps>>(null)
  const boostrapTableRef = useRef<BootstrapTable>(null)
  const [pageState, goToPage] = useState<number | undefined>()

  getSortOrder = () => boostrapTableRef.current?.sortContext.state.sortOrder

  return <>
    <label>Scoreboard:</label>
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
            ...paginationOptions,
            totalSize: props.players.length,
            // HACK: Required to keep the state in sync. Will not cause rerenders
            onPageChange: goToPage,
            onSizePerPageChange: (_, page) => goToPage(page),
            page: pageState,
          })}
        >
          {(({ paginationProps, paginationTableProps }) =>
            <div>
              <SearchBar ref={searchBarRef} {...toolkitprops.searchProps} />
              <SizePerPageDropdownStandalone {...paginationProps} />
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
