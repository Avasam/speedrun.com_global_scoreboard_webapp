// Note: Let's stay as close to the original types as possible, even if they're vague
/* eslint-disable @typescript-eslint/no-duplicate-imports */
/* eslint-disable @typescript-eslint/sort-type-union-intersection-members */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable unicorn/no-keyword-prefix */
/* eslint-disable unicorn/no-static-only-class */
/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable extra-rules/no-commented-out-code */
/* eslint-disable max-len */

// Origin: https://gitlab.com/fluidattacks/integrates/-/blob/master/integrates/front/src/typings/react-bootstrap-table-2/index.d.ts
// Modified:
// - rowClasses and classes: added function definition
// - totalSize supports numbers and is required because of 'Warning: Failed prop type: The prop `dataSize` is marked as required in `PaginationTotal`, but its value is `undefined`.'
// - sizePerPageList supports array of number
// - export PaginationProvider, PaginationListStandalone, PaginationTotalStandalone and SizePerPageDropdownStandalone
// - currSizePerPage is actually a string
// - Column.searchable is a propriety that exists
// - PaginationProps.custom is a property that exists
// - onPageChange and onSizePerPageChange return type to void
// - wrapperClasses neede to add "table-responsive"
// - Column.sortCaret exists
// - BootstrapTable.sort exists
// - SearchFieldProps.ref?
// - formatter as ReactNode
// - headerFormatter exists
// - Replaced string | number by ReactText
// - Replaced CSSStyleDeclaration by React.CSSProperties
// - Replaced OptionSelectFilterProps by { [key: ReactText]: string }
// - Extends FilterProps and all optionnal
// - Column.filter as component with FilterProps
// - Column.filterRenderer exists
// - Column.filter type is React.FC<FilterProps>
// - CustomFilterProps extends
// - NumberFIlterFunction
// - FilterProps.getFilter exists
// - export SearchFieldProps and SearchProps
// - onSearch has first parameter searchText: string
// - Pagination is a React Component
// - Added SelectFilterFunction and getFilter to SelectFilterProps
// - Shorthand method signature is forbidden. Use a function property instead.eslint@typescript-eslint/method-signature-style
// - Added ColumnFormatter<T> type alias

type RowFieldValue = ReactText | Date | TODO
type TODO = any

type Pagination = React.FC<PaginationProps>
// Note: Not my TODO
// eslint-disable-next-line no-warning-comments
// TODO: check missings : https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/pagination-props.html
interface PaginationProps {
  custom?: boolean
  page?: number
  sizePerPage?: number
  totalSize: ReactText
  pageStartIndex?: number
  paginationSize?: number
  showTotal?: boolean
  sizePerPageList?: { text: string, value: number }[] | number[]
  withFirstAndLast?: boolean
  alwaysShowAllBtns?: boolean
  firstPageText?: string
  prePageText?: string
  nextPageText?: string
  lastPageText?: string
  nextPageTitle?: string
  prePageTitle?: string
  firstPageTitle?: string
  lastPageTitle?: string
  hideSizePerPage?: boolean
  hidePageListOnlyOnePage?: boolean
  onPageChange?: (page: number, sizePerPage: number) => void
  onSizePerPageChange?: (sizePerPage: number, page: number) => void
  paginationTotalRenderer?: (from: number, to: number, size: number) => TODO
  sizePerPageRenderer?: (options: SizePerPageRenderer) => TODO
  handleNextPage?: (event: { page: number, onPageChange: () => void }) => void
  handlePrevPage?: (event: { page: number, onPageChange: () => void }) => void
  handleSizePerPage?: (event: { page: number, onSizePerPageChange: () => void }, newSizePerPage: number) => void
}
interface OptionPaginationProps {
  page: number
  text: string
}
type PaginationTableProps = TODO
type SizePerPageRenderer = { options: OptionPaginationProps[], currSizePerPage: string, onSizePerPageChange: onSizePerPageChange }
type onSizePerPageChange = (sizePerPage: number, page?: number) => number
type onTableChange = (type: TableChangeType, event: TableChangeNewState) => TODO
interface TableChangeNewState {
  page?: number
  sizePerPage?: number
  filters?: Record<string, Filter<any>>
  sortField?: string
  sortOrder?: SortOrder
  data?: RowT[]
}
type TableChangeType = 'filter' | 'pagination' | 'sort'
type SortOrder = 'asc' | 'desc'
interface Sorted {
  dataField?: string
  order?: SortOrder
}
interface FilterOptions {
  page: number
  sizePerPage: number
  totalSize: string
  sizePerPageRenderer: SizePerPageRenderer
}
interface Filter<Type extends TODO = TODO> {
  filterVal: FilterVal
  filterType: FilterType
  comparator: PredefinedComparatorTypes
}
interface FilterProps<Type extends TODO> {
  getFilter?: (filter: FilterFunction<Type>) => TODO
  onFilter?: (filterVal: string, data?: any) => TODO
  onInput?: (event: React.SyntheticEvent<HTMLInputElement>, value: string) => void
  defaultValue?: Type
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  delay?: number
  comparator?: PredefinedComparatorTypes
  caseSensitive?: true
  comparatorStyle?: React.CSSProperties
  comparatorClassName?: string
  withoutEmptyComparatorOption?: boolean
}
type TextFilterProps = FilterProps<TODO>
interface DateFilterProps extends FilterProps<TODO> {
  dateStyle?: React.CSSProperties
  dateClassName?: string
  defaultValue?: { date: Date, comparator: PredefinedComparatorTypes }
}
interface SelectFilterProps extends FilterProps<TODO> {
  getFilter?: (filter: SelectFilterFunction) => TODO
  options: Record<ReactText, string>
  withoutEmptyOption?: boolean
}
interface NumberFilterProps extends FilterProps<TODO> {
  getFilter?: (filter: NumberFilterFunction) => TODO
  options?: number[]
  withoutEmptyNumberOption?: boolean
  comparators?: PredefinedComparatorTypes[]
  numberStyle?: React.CSSProperties
  numberClassName?: string
  defaultValue?: { number: number, comparator: PredefinedComparatorTypes }
}
interface RemoteProps {
  cellEdit?: boolean
  filter?: boolean
  pagination?: boolean
  sort?: boolean
}
interface CustomFilterProps extends FilterProps<TODO> {
  type?: TODO//: FILTER_TYPES.NUMBER,  // default is FILTER_TYPES.TEXT
  comparator?: PredefinedComparatorTypes//: Comparator.EQ, // only work if type is FILTER_TYPES.SELECT
  caseSensitive?: boolean//false, // default is true
}
type FilterFunction<Type extends TODO> = (val: Type) => TODO
type NumberFilterFunction = (val: { number: number | '', comparator: PredefinedComparatorTypes }) => TODO
type SelectFilterFunction = FilterFunction<string[]>
type FilterVal = string | TODO
type FilterType = 'TEXT' | TODO
interface ComparatorTypes {
  LIKE: 'LIKE'
  EQ: '='
  NE: '!='
  GT: '>'
  GE: '>='
  LT: '<'
  LE: '<='
}
// eslint-disable-next-line no-shadow
declare enum PredefinedComparatorTypes {
  LIKE = 'LIKE', EQ = '=', NE = '!=', GT = '>', GE = '>=', LT = '<', LE = '<=',
}
type PredefinedComparators = typeof PredefinedComparatorTypes
// EDITOR
type EditorProps = TODO
// OVERLAY
interface OverlayOptions {
  spinner: boolean
  background: Color
}
type Color = string
type Overlay = TODO
// SELECT AND EXPAND
interface SelectRowOptions {
  mode: 'checkbox' | 'radio'
  clickToSelect: boolean
  hideSelectColumn?: boolean
  nonSelectable?: number[]
  selected?: number[]
  onSelect?: (row: any, isSelect: boolean, index: number) => void
  onSelectAll?: (isSelect: boolean, rows: any) => void
}
interface ExpandRowOptions {
  renderer: (row: any) => JSX.Element
  showExpandColumn?: boolean
}
declare module 'react-bootstrap-table-next' {
  import type { FC, ReactElement, ReactNode } from 'react'
  import { Component } from 'react'
  export default class BootstrapTable extends Component<BootstrapTableProps, TODO> {
    table: {
      props: {
        data: TableChangeNewState['data']
      }
    }
    selectionContext: {
      selected: number[] | TODO
    }
    rowExpandContext: {
      state: {
        expanded: TODO
      }
    }
    paginationContext: {
      currPage: TableChangeNewState['page']
      currSizePerPage: TableChangeNewState['sizePerPage']
    }
    sortContext: {
      state: {
        sortColumn: Column
        sortOrder: TableChangeNewState['sortOrder']
      }
      filterContext: {
        currFilters: TableChangeNewState['filters']
      }
      cellEditContext: {
        startEditing: (rowindex: number, columnindex: number) => void
      }
    }
    sort: {
      dataField: string
      order: SortOrder
    }
  }
  export interface BootstrapTableProps extends PaginationProps {
    keyField: string
    columns: Column[]
    data: TODO[]
    headerClasses?: string
    hover?: boolean
    remote?: boolean | RemoteProps
    bordered?: boolean
    bootstrap4?: boolean
    noDataIndication?: () => JSX.Element | string
    loading?: boolean
    overlay?: Overlay
    caption?: string | JSX.Element
    wrapperClasses?: string
    striped?: boolean
    defaultSorted?: Sorted[]
    filter?: FilterProps<TODO>
    pagination?: Pagination
    onTableChange?: onTableChange
    rowClasses?: string | ((row: TODO, rowIndex: number) => string)
    rowEvents?: {}
    rowStyle?: {}
    selectRow?: SelectRowOptions
    expandRow?: ExpandRowOptions
  }
  export type ColumnFormatter<T, F> = (cell: T | undefined, row: T | undefined, rowIndex: number, formatExtraData: F | undefined) => ReactNode
  export interface Column {
    align?: string
    dataField: string
    text: string
    classes?: string | ((cell: TODO, row: TODO, rowIndex: number, colIndex: number) => string)
    headerClasses?: string
    hidden?: boolean
    isDummyField?: boolean
    sort?: boolean
    searchable?: boolean
    filter?: FC<FilterProps>
    formatExtraData?: TODO
    formatter?: ColumnFormatter<T, F>
    headerFormatter?: (column: Column, colIndex: number, components: any) => ReactNode
    headerStyle?: (colum: TODO, colIndex: number) => any
    sortFunc?: <T>(a: T, b: T, order: SortOrder, rowA: Row, rowB: Row) => number
    style?: (colum: TODO, colIndex: number) => {}
    filterValue?: <T>(cell: T, row: TODO) => any
    onSort?: (dataField: string, order: SortOrder) => void
    sortCaret?: (order: SortOrder | null | undefined, column: Column) => JSX.Element | null
    filterRenderer?: (onFilter: FilterProps['onFilter'], column: Column) => ReactElement
  }
  export type Row = RowT
}
type RowT<Type extends TODO = TODO, FieldId extends string = string> = {
  [fieldName in FieldId]: RowFieldValue
}
declare module 'react-bootstrap-table2-filter' {
  import type { FC } from 'react'
  export default function filterFactory<Type extends TODO>(options?: FilterOptions): FilterProps<Type>
  function textFilter(props?: TextFilterProps): FC<TextFilterProps>
  function dateFilter(props?: DateFilterProps): FC<DateFilterProps>
  function selectFilter(props?: SelectFilterProps): FC<SelectFilterProps>
  function multiSelectFilter(props?: SelectFilterProps): FC<SelectFilterProps>
  function numberFilter(props?: NumberFilterProps): FC<NumberFilterProps>
  function customFilter(props?: CustomFilterProps): FC<CustomFilterProps>
  const Comparator: PredefinedComparators
}
declare module 'react-bootstrap-table2-paginator' {
  import type { FC } from 'react'
  import { Component } from 'react'
  export default function paginationFactory(options?: PaginationProps): Pagination
  export type PaginationProviderProps = {
    paginationProps: PaginationProps
    paginationTableProps: PaginationProps
  }
  export class PaginationProvider extends Component<{
    pagination: Pagination
    children: FC<PaginationProviderProps>
  }>{ }
  export class PaginationListStandalone extends Component<PaginationProps, TODO>{ }
  export class SizePerPageDropdownStandalone extends Component<PaginationProps, TODO>{ }
  export class PaginationTotalStandalone extends Component<PaginationProps, TODO>{ }
}

declare module 'react-bootstrap-table2-overlay' {
  export default function overlayFactory(props?: OverlayOptions): Overlay
}
declare module 'react-bootstrap-table2-toolkit' {
  import type { ReactElement } from 'react'
  import { Component } from 'react'
  import type { Column } from 'react-bootstrap-table-next'
  interface BaseProps {
    columns: Column[]
    data: {}[]
    keyField: string
  }
  interface CsvProps {
    onExport?: () => void
  }
  export interface ColumnToggle extends Column {
    toggle?: boolean
  }
  interface ColumnToggleProps {
    btnClassName?: string
    className?: string
    columns: Column[]
    contextual?: string
    onColumnToggle: (dataField: string) => void
    toggles: Dictionary<string, boolean>
  }
  export interface ToolkitProviderProps {
    baseProps: BaseProps
    columnToggleProps: ColumnToggleProps
    csvProps: CsvProps
    searchProps: SearchProps
  }
  interface CSVExportProps {
    children?: {} | {}[]
    className?: string
    style?: {}
  }
  export interface SearchFieldProps {
    className?: string
    placeholder?: string
    ref?: SearchBar
  }
  export interface SearchProps {
    searchText?: string
    onClear?: () => void
    onSearch?: (searchText: string) => void
  }
  export class ColumnToggle {
    static ToggleList: (props: ColumnToggleProps) => ReactElement
  }
  export class Search {
    static SearchBar: (props: SearchProps | SearchFieldProps) => ReactElement
  }
  export class CSVExport {
    static ExportCSVButton: (props: CSVExportProps | CsvProps) => ReactElement
  }
  export default class ToolkitProvider extends Component<TODO, TODO> { }
}
