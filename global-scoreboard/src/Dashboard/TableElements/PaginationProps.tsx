import { Dropdown, DropdownButton } from 'react-bootstrap'

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

const defaultPaginationOptions: PaginationProps = {
  custom: true,
  showTotal: true,
  totalSize: -1,
  prePageTitle: 'hidden',
  nextPageTitle: 'hidden',
  alwaysShowAllBtns: true,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  sizePerPageList: [10, 25, 50, 100],
  sizePerPageRenderer,
}

export default defaultPaginationOptions
