import DriveFileMove from '@mui/icons-material/DriveFileMove'
import { IconButton, Menu, MenuItem } from '@mui/material'
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
      aria-controls='move-menu'
      aria-expanded={open ? 'true' : undefined}
      aria-haspopup='true'
      id='move-button'
      onClick={event => setAnchorElement(event.currentTarget)}
      size='small'
    >
      <DriveFileMove />
    </IconButton>
    <Menu
      MenuListProps={{
        'aria-labelledby': 'move-button',
      }}
      anchorEl={anchorElement}
      id='move-menu'
      onClose={handleClose}
      open={open}
    >
      {props.possibleGroups.map(group =>
        <MenuItem
          key={`move-to-${group.id}`}
          onClick={() => {
            props.onMoveToGroup(group.id)
            handleClose()
          }}
          value={group.id}
        >
          {group.name}
        </MenuItem>)}
    </Menu>
  </>
}

export default MoveToGroupMenu
