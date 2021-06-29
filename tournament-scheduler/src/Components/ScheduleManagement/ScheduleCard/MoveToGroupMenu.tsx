import { IconButton, Menu, MenuItem } from '@material-ui/core'
import { DriveFileMove } from '@material-ui/icons'
import { useState } from 'react'

import type { ScheduleGroup } from 'src/Models/Schedule'

export type MoveToGroupMenuProps = {
  onMoveToGroup: (groupId: number | null) => void
  possibleGroups: ScheduleGroup[]
}

const MoveToGroupMenu = (props: MoveToGroupMenuProps) => {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorElement)
  const handleClose = () => setAnchorElement(null)

  return <>
    <IconButton
      id='move-button'
      aria-controls='move-menu'
      aria-haspopup='true'
      aria-expanded={open ? 'true' : undefined}
      size='small'
      onClick={event => setAnchorElement(event.currentTarget)}
    >
      <DriveFileMove />
    </IconButton>
    <Menu
      id='move-menu'
      anchorEl={anchorElement}
      open={open}
      onClose={handleClose}
      MenuListProps={{
        'aria-labelledby': 'move-button',
      }}
    >
      {props.possibleGroups.map(group =>
        <MenuItem
          onClick={() => {
            props.onMoveToGroup(group.id)
            handleClose()
          }}
          key={`move-to-${group.id}`}
          value={group.id}
        >
          {group.name}
        </MenuItem>)}
    </Menu>
  </>
}

export default MoveToGroupMenu
