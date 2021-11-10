import { Dropdown, DropdownButton } from 'react-bootstrap'

const sizePerPageRenderer: PaginationProps['sizePerPageRenderer'] = ({
  options,
  currSizePerPage,
  onSizePerPageChange,
}) =>
  <span className='react-bs-table-sizePerPage-dropdown'>
    {'Show '}
    <DropdownButton
      align='end'
      id='pageDropDown'
      style={{ display: 'inline-block' }}
      title={currSizePerPage}
      variant='outline-primary'
    >
      {
        options.map(option =>
          <Dropdown.Item
            active={currSizePerPage === `${option.page}`}
            href='#'
            key={`data-page-${option.page}`}
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
