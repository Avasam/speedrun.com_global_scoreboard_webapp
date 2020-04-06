/* eslint-disable @typescript-eslint/no-explicit-any */
// Origin: https://gitlab.com/fluidattacks/integrates/-/blob/master/front/src/typings/react-bootstrap-table-2/index.d.ts
// Modified: rowClasses, added function definition

type RowFieldValue = string | number | Date | TODO
type TODO = any
type Pagination = TODO
// TODO: check missings : https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/pagination-props.html
interface PaginationProps {
  page?: number
  sizePerPage?: number
  totalSize?: string
  pageStartIndex?: number
  paginationSize?: number
  showTotal?: boolean
  sizePerPageList?: { text: string, value: number }[]
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
  onPageChange?: (page: number, sizePerPage: number) => any
  onSizePerPageChange?: (sizePerPage: number, page: number) => number
  paginationTotalRenderer?: (from: number, to: number, size: number) => TODO
  sizePerPageRenderer?: (options: SizePerPageRenderer) => TODO
  handleNextPage?: (event: { page: number, onPageChange: () => void }) => void
  handlePrevPage?: (event: { page: number, onPageChange: () => void }) => void
  handleSizePerPage?: (event: { page: number, onSizePerPageChange: () => void },
    newSizePerPage: number) => void
}
interface OptionPaginationProps {
  page: number
  text: string
}
type PaginationProvider = React.Component<{
  pagination: Pagination
  children: React.Component<{
    paginationProps: PaginationProps
    paginationTableProps: PaginationProps
  }>
}>
type PaginationTableProps = TODO
type SizePerPageRenderer = { options: OptionPaginationProps[], currSizePerPage: number, onSizePerPageChange: onSizePerPageChange }
type onSizePerPageChange = (sizePerPage: number, page?: number) => number
type onTableChange = (type: TableChangeType, event: TableChangeNewState) => TODO
interface TableChangeNewState {
  page?: number
  sizePerPage?: number
  filters?: { [dataField: string]: Filter<any> }
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
  getFilter?(filter: FilterFunction<Type>): TODO
  onFilter?(filterVal: string, data: any): TODO
  onInput?(event: React.SyntheticEvent<HTMLInputElement>, value: string): void
  defaultValue?: Type
  placeholder?: string
  className?: string
  style?: CSSStyleDeclaration
  delay?: number
  comparator?: PredefinedComparatorTypes
  caseSensitive?: true
  comparatorStyle?: CSSStyleDeclaration
  comparatorClassName?: string
  withoutEmptyComparatorOption?: boolean
}
type TextFilterProps = FilterProps<TODO>
interface DateFilterProps extends FilterProps<TODO> {
  dateStyle?: CSSStyleDeclaration
  dateClassName?: string
  defaultValue?: { date: Date, comparator: PredefinedComparatorTypes }
}
interface OptionSelectFilterProps { value: string | number, label: string }
interface SelectFilterProps extends FilterProps<TODO> {
  options?: OptionSelectFilterProps[] | string[]
  withoutEmptyOption?: boolean
}
interface NumberFilterProps extends FilterProps<TODO> {
  options?: number[]
  withoutEmptyNumberOption?: boolean
  comparators?: PredefinedComparatorTypes[]
  numberStyle?: CSSStyleDeclaration
  numberClassName?: string
  defaultValue?: { number: number, comparator: PredefinedComparatorTypes }
}
interface RemoteProps {
  cellEdit?: boolean
  filter?: boolean
  pagination?: boolean
  sort?: boolean
}
interface CustomFilterProps {
  type: TODO//: FILTER_TYPES.NUMBER,  // default is FILTER_TYPES.TEXT
  comparator?: PredefinedComparatorTypes//: Comparator.EQ, // only work if type is FILTER_TYPES.SELECT
  caseSensitive?: boolean//false, // default is true
}
type FilterFunction<Type extends TODO> = (val: Type) => TODO
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
declare enum PredefinedComparatorTypes { LIKE = 'LIKE', EQ = '=', NE = '!=', GT = '>', GE = '>=', LT = '<', LE = '<=' }
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
interface ExpandRowOptions { renderer: (row: any) => JSX.Element, showExpandColumn?: boolean }
declare module 'react-bootstrap-table-next' {
  import { Component, ReactElement } from 'react'
  export default class BootstrapTable extends Component<BootstrapTableProps, TODO> {
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
    noDataIndication?(): JSX.Element | string
    loading?: boolean
    overlay?: Overlay
    caption?: string | JSX.Element
    striped?: boolean
    defaultSorted?: Sorted[]
    filter?: FilterProps<TODO>
    pagination?: Pagination
    onTableChange?: onTableChange
    rowClasses?: string | ((row: any, rowIndex: number) => string)
    rowEvents?: {}
    rowStyle?: {}
    selectRow?: SelectRowOptions
    expandRow?: ExpandRowOptions
  }
  export interface Column {
    align?: string
    dataField: string
    text: string
    classes?: string
    headerClasses?: string
    hidden?: boolean
    isDummyField?: boolean
    sort?: boolean
    filter?: TODO
    formatExtraData?: TODO
    formatter?: (cell: TODO, row: TODO, rowIndex: number, formatExtraData: any) => string | ReactElement | undefined
    headerStyle?: (colum: TODO, colIndex: number) => any
    sortFunc?<T>(a: T, b: T, order: 'asc' | 'desc', rowA: Row, rowB: Row): number
    style?: (colum: TODO, colIndex: number) => {}
    filterValue?<T>(cell: T, row: TODO): any
    onSort?(dataField: string, order: SortOrder): void
  }
  export type Row = RowT
}
type RowT<Type extends TODO = TODO, FieldId extends string = string> = {
  [fieldName in FieldId]: RowFieldValue
}
declare module 'react-bootstrap-table2-filter' {
  export default function filterFactory<Type extends TODO>(options?: FilterOptions): FilterProps<Type>
  function textFilter(props?: TextFilterProps): TODO
  function dateFilter(props?: DateFilterProps): TODO
  function selectFilter(props?: SelectFilterProps): TODO
  function multiSelectFilter(props?: SelectFilterProps): TODO
  function numberFilter(props?: NumberFilterProps): TODO
  function customFilter(props?: CustomFilterProps): TODO
  const Comparator: PredefinedComparators
}
declare module 'react-bootstrap-table2-paginator' {
  export default function paginationFactory(options?: PaginationProps): Pagination
}
declare module 'react-bootstrap-table2-overlay' {
  export default function overlayFactory(props?: OverlayOptions): Overlay
}
declare module 'react-bootstrap-table2-toolkit' {
  import { Component, ReactElement } from 'react'
  import { Column } from 'react-bootstrap-table-next'
  interface BaseProps {
    columns: Column[]
    data: Array<{}>
    keyField: string
  }
  interface CsvProps {
    onExport?(): void
  }
  export interface ColumnToggle extends Column {
    toggle?: boolean
  }
  interface ColumnToggleProps {
    btnClassName?: string
    className?: string
    columns: Column[]
    contextual?: string
    onColumnToggle(dataField: string): void
    toggles: Dictionary<string, boolean>
  }
  export interface ToolkitProviderProps {
    baseProps: BaseProps
    columnToggleProps: ColumnToggleProps
    csvProps: CsvProps
    searchProps: SearchProps
  }
  interface CSVExportProps {
    children?: {} | Array<{}>
    className?: string
    style?: {}
  }
  interface SearchFieldProps {
    className?: string
    placeholder?: string
  }
  interface SearchProps {
    searchText?: string
    onClear?(): void
    onSearch?(): void
  }
  export class ColumnToggle {
    static ToggleList(props: ColumnToggleProps): ReactElement
  }
  export class Search {
    static SearchBar(props: SearchProps | SearchFieldProps): ReactElement
  }
  export class CSVExport {
    static ExportCSVButton(props: CSVExportProps | CsvProps): ReactElement
  }
  export default class ToolkitProvider extends Component<TODO, TODO> { }
}
