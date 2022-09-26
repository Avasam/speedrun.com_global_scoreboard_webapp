import './PlayerNameCell.css'

import FriendButton from './FriendButton'
import type Player from 'src/Models/Player'

type PlayerNameCellProps = {
  player: Player
  isFriend: boolean
  isCurrentUser: boolean
  onBefriend: (friendId: string) => void
  onUnfriend: (friendId: string) => void
}

const backupFlag = (element: HTMLImageElement) => {
  const backupSource = element.src.replace(/\/[\da-z]+\.png/u, '.png')
  if (backupSource.endsWith('flags.png')) {
    element.removeAttribute('src')
  } else {
    element.src = backupSource
  }
}

const PlayerNameCell = (props: PlayerNameCellProps) =>
  <>
    {
      !props.isCurrentUser &&
      <FriendButton
        isFriend={props.isFriend}
        onBefriend={props.onBefriend}
        onUnfriend={props.onUnfriend}
        playerId={props.player.userId}
      />
    }
    <a
      // HACK: This is an edge case which we believe exists only with the user HaruSama / Haru様
      href={`https://www.speedrun.com/user/${props.player.name.replaceAll('様', 'Sama')}`}
      rel='noopener noreferrer'
      target='_blank'
    >
      {props.player.countryCode &&
      <img
        alt=''
        className='flagicon'
        onError={error => backupFlag(error.currentTarget)}
        src={`https://www.speedrun.com/images/flags/${props.player.countryCode}.png`}
      />}
      <span>{props.player.name}</span>
    </a>
  </>

export default PlayerNameCell
