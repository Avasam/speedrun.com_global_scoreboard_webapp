import './PlayerNameCell.css'

import Player from '../../models/Player'
import FriendButton from './FriendButton'

type PlayerNameCellProps = {
  player: Player
  isFriend: boolean
  isCurrentUser: boolean
  handleOnUnfriend: (friendId: string) => void
  handleOnBefriend: (friendId: string) => void
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
