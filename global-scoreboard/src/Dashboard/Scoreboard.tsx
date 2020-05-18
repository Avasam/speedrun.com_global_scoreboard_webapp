/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import './Scoreboard.css'
import BootstrapTable, { Column } from 'react-bootstrap-table-next'
import { Dropdown, DropdownButton, Spinner } from 'react-bootstrap'
import React, { MutableRefObject, forwardRef, useRef, useState } from 'react'
import ToolkitProvider, { Search, ToolkitProviderProps } from 'react-bootstrap-table2-toolkit'
import paginationFactory, { PaginationListStandalone, PaginationProvider, PaginationTotalStandalone, SizePerPageDropdownStandalone } from 'react-bootstrap-table2-paginator'
import Configs from '../models/Configs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Player from '../models/Player'
import PlayerNameCell from './TableElements/PlayerNameCell'
import PlayerScoreCell from './TableElements/PlayerScoreCell'
import ScoreTitle from './TableElements/ScoreTitle'
import { faLongArrowAltDown } from '@fortawesome/free-solid-svg-icons'
import { faLongArrowAltUp } from '@fortawesome/free-solid-svg-icons'

const currentTimeOnLoad = new Date()

const columnClass = (cell: string) => {
  // TODO: This probably doesn't take daylight savings and other weird shenaniganns into account
  const daysSince = Math.floor((currentTimeOnLoad.getTime() - Date.parse(cell)) / 86400000)
  if (daysSince >= Configs.lastUpdatedDays[2]) return 'daysSince'
  if (daysSince >= Configs.lastUpdatedDays[1]) return 'daysSince2'
  if (daysSince >= Configs.lastUpdatedDays[0]) return 'daysSince1'
  return 'daysSince0'
}

const sortCaret: Column['sortCaret'] = (order) =>
  <span className="sortCarrets">
    {' '}
    <FontAwesomeIcon className={order === 'asc' ? 'active' : ''} icon={faLongArrowAltDown} />
    <FontAwesomeIcon className={order === 'desc' ? 'active' : ''} icon={faLongArrowAltUp} />
  </span>

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
      formatExtraData &&
      <PlayerNameCell
        player={row}
        isFriend={formatExtraData.friends.some(friend => friend.userId === row.userId) || false}
        isCurrentUser={formatExtraData.currentUser?.userId === row.userId}
        handleOnUnfriend={formatExtraData.handleOnUnfriend}
        handleOnBefriend={formatExtraData.handleOnBefriend}
      />,
    sort: true,
  },
  {
    dataField: 'score',
    text: <ScoreTitle />,
    searchable: false,
    formatter: (_, row: Player | undefined) =>
      row &&
      <PlayerScoreCell player={row} />,
    sort: true,
  },
  {
    dataField: 'lastUpdate',
    text: 'Last Updated',
    formatter: (cell: Date | undefined) => cell && new Date(cell).toISOString().slice(0, 16).replace('T', ' '),
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

const { SearchBar } = Search

const Legend = () => <span className="legend">
  <br />
  <label>Updated:</label>{' '}
  <span className="daysSince0">This&nbsp;week</span>{', '}
  <span className="daysSince1">This&nbsp;month</span>{', '}
  <span className="daysSince2">In&nbsp;the&nbsp;last&nbsp;3&nbsp;months</span>{', '}
  <span className="daysSince">Over&nbsp;3&nbsp;months&nbsp;ago</span>
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

      goToPage(jumpToPage)
    }
  }

  const boostrapTableRef = useRef<BootstrapTable>(null)
  const [page, goToPage] = useState<number | undefined>()

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
            page,
          })}
        >
          {(({ paginationProps, paginationTableProps }) =>
            <div>
              <SearchBar {...toolkitprops.searchProps} />
              <SizePerPageDropdownStandalone {...paginationProps} />
              <BootstrapTable
                ref={boostrapTableRef}
                wrapperClasses="table-responsive"
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

export default Scoreboard
