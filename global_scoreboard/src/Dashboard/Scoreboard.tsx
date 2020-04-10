/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import './Scoreboard.css'
import BootstrapTable, { Column } from 'react-bootstrap-table-next'
import { Dropdown, DropdownButton, Spinner } from 'react-bootstrap'
import React, { MutableRefObject, forwardRef, useRef } from 'react'
import ToolkitProvider, { Search, ToolkitProviderProps } from 'react-bootstrap-table2-toolkit'
import paginationFactory, { PaginationListStandalone, PaginationProvider, PaginationTotalStandalone, SizePerPageDropdownStandalone } from 'react-bootstrap-table2-paginator'
import FriendButton from './FriendButton'
import Player from '../models/Player'


const currentTimeOnLoad = new Date()

const columnClass = (cell: string) => {
  // TODO: This probably doesn't take daylight savings and other weird shenaniganns into account
  const daysSince = Math.floor((currentTimeOnLoad.getTime() - Date.parse(cell)) / 86400000)
  if (daysSince >= 30) return 'daysSince'
  if (daysSince >= 7) return 'daysSince30'
  if (daysSince >= 1) return 'daysSince7'
  return 'daysSince1'
}

type FormatExtraDataProps = {
  currentUser: Player | null
  friends: Player[]
  handleOnUnfriend: (friendId: string) => void
  handleOnBefriend: (friendId: string) => void
}

const columns: Column[] = [
  {
    dataField: 'rank',
    text: 'Rank',
    searchable: false,
  },
  {
    dataField: 'name',
    text: 'Name',
    formatter: (_, row: Player | undefined, __, formatExtraData?: FormatExtraDataProps) =>
      row &&
      <>
        < a
          href={`https://www.speedrun.com/user/${row.name}`}
          target="_blank"
          rel="noopener noreferrer"
        > {row.name}</a >
        {
          formatExtraData && formatExtraData.currentUser?.userId !== row.userId &&
          <FriendButton
            isFriend={formatExtraData.friends.some(friend => friend.userId === row.userId) || false}
            playerId={row.userId}
            onUnfriend={formatExtraData.handleOnUnfriend}
            onBefriend={formatExtraData.handleOnBefriend}
          />
        }
      </>,
  },
  {
    dataField: 'score',
    text: 'Score',
    searchable: false,
  },
  {
    dataField: 'lastUpdate',
    text: 'Last Updated',
    formatter: (cell: Date | undefined) => cell && new Date(cell).toISOString().slice(0, 16).replace('T', ' '),
    classes: columnClass,
    searchable: false,
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
  alwaysShowAllBtns: true,
  sizePerPageList: [10, 25, 50, 100, 200],
  sizePerPageRenderer,
}

const { SearchBar } = Search

const Legend = () => <span className="legend">
  <label>Updated:&nbsp;</label>
  <span className="daysSince1">Today</span>,&nbsp;
  <span className="daysSince7">This week</span>,&nbsp;
  <span className="daysSince30">This month</span>,&nbsp;
  <span className="daysSince">Over a month ago</span>
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

const Scoreboard = forwardRef((props: ScoreboardProps, ref) => {
  (ref as MutableRefObject<ScoreboardRef>).current = {
    jumpToPlayer: (playerId: string) => {
      const playerIndex = props.players.findIndex(player => player.userId === playerId)
      const currSizePerPage = boostrapTableRef.current?.paginationContext.currSizePerPage
      const jumpToPage = Math.floor(playerIndex / Number(currSizePerPage)) + 1

      // TODO: Make it work
      alert(`WIP: Should now jump to page #${jumpToPage} to show player ID ${playerId}`)
    }
  }
  const boostrapTableRef = useRef<BootstrapTable>(null)

  return <>
    <label>Scoreboard:</label>
    {/* TODO: works without totalSize, but throws warning error in console. See if we could change library itself */}
    <PaginationProvider pagination={paginationFactory({ ...paginationOptions, totalSize: props.players.length })}>
      {(({ paginationProps, paginationTableProps }) =>
        // TODO: https://github.com/react-bootstrap-table/react-bootstrap-table2/issues/1118
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
            return { ...column, formatExtraData }
          })}
          search
          bootstrap4
        >
          {(toolkitprops: ToolkitProviderProps) =>
            <div>
              <SearchBar {...toolkitprops.searchProps} />
              <SizePerPageDropdownStandalone {...paginationProps} />
              <BootstrapTable
                ref={boostrapTableRef}
                striped
                rowClasses={(row?: Player) => rowClasses(row, props.currentUser, props.friends)}
                {...toolkitprops.baseProps}
                {...paginationTableProps}
                noDataIndication={() =>
                  props.players.length === 0
                    ? <Spinner animation="border" role="scoreboard">
                      <span className="sr-only">Building the Scoreboard. Please wait...</span>
                    </Spinner>
                    : <span>No matching records found</span>
                }
              />
              <div>
                <PaginationTotalStandalone {...paginationProps} />
                <PaginationListStandalone {...paginationProps} />
                <Legend />
              </div>
            </div>
          }
        </ToolkitProvider>
      )}
    </PaginationProvider>
  </>
})

export default Scoreboard
