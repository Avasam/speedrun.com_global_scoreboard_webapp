import './PlayerNameCell.css'

import type Player from 'src/Models/Player'
import FriendButton from './FriendButton'

type PlayerNameCellProps = {
  player: Player
  isFriend: boolean
  isCurrentUser: boolean
  handleOnUnfriend: (friendId: string) => void
  handleOnBefriend: (friendId: string) => void
}

const backupFlag = (element: HTMLImageElement) => {
  const backupSrc = element.src.replace(/\/[\da-z]+?\.png/, '.png')
  if (backupSrc.endsWith('flags.png')) {
    element.removeAttribute('src')
  } else {
    element.src = backupSrc
  }
}

const PlayerNameCell = (props: PlayerNameCellProps) =>
  <span className='name-cell'>
    <a
      // HACK: This is an edge case which we believe exists only with the user HaruSama / Haru様
      href={`https://www.speedrun.com/user/${props.player.name.replaceAll('様', 'Sama')}`}
      target='_blank'
      rel='noopener noreferrer'
    >{props.player.countryCode &&
      <img
        alt=''
        className='flagicon'
        src={`https://www.speedrun.com/images/flags/${props.player.countryCode}.png`}
        onError={err => backupFlag(err.currentTarget)}
      />}{props.player.name}</a>
    {
      !props.isCurrentUser &&
      <FriendButton
        isFriend={props.isFriend}
        playerId={props.player.userId}
        onUnfriend={props.handleOnUnfriend}
        onBefriend={props.handleOnBefriend}
      />
    }
  </span>

export default PlayerNameCell
