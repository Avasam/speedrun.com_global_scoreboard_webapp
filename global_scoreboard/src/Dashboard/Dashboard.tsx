import './Dashboard.css'
import React, { FC } from 'react'
import { Button } from 'react-bootstrap'

const Dashboard: FC = () => {
  const players = []
  for (let i = 0; i < 9; i++) {
    players.push(
      {
        rank: i + 1,
        name: `TestPlayer${i + 1}`,
        score: 111.11 * (9 - i),
        lastUpdate: new Date(),
        userId: `${i + 1}abc`,
      }
    )
  }
  const currentUser = players[0]
  const friends = [players[1], players[2], players[3]]

  const unfriend = (friendId: string) => console.log('unfriend', friendId)
  const befriend = (friendId: string) => console.log('befriend', friendId)
  const jumpToPlayer = (friendId: string) => console.log('jumpToPlayer', friendId)

  return (
    <div className="container">
      <div className="alert alert-info" id="ajaxResponseMessage">Building the DataTable. Please wait...</div>

      <div className="col-md-4">
        <div className="row">
          <form method="POST" className="ajax" id="update-user-form">
            <div className="form-group">
              <input type="hidden" id="action" name="action" value="update-user" />
              <label htmlFor="name-or-id"> Update runner:</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  id="name-or-id"
                  name="name-or-id"
                  required
                  placeholder={currentUser ? 'Name or ID' : 'Please log in first'}
                  disabled={!currentUser}
                />
                <span className="input-group-btn">
                  <button id="update-runner-button"
                    type="button"
                    className="btn btn-primary"
                    disabled={!currentUser}
                  >Update</button>
                </span>
              </div>
            </div>
          </form>
        </div>

        <div className="row">
          <label htmlFor="preview">Quick view:</label>
          <table className="table" id="preview">
            <tbody>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th colSpan={2}>Score</th>
              </tr>
              <tr className="highlight-current-user" id={`preview-${currentUser.userId}`}>
                {currentUser
                  ? <>
                    <td>{currentUser.rank}</td>
                    <td>
                      <a
                        href={`https://speedrun.com/user/${currentUser.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >{currentUser.name}</a>
                    </td>
                    <td>{currentUser.score}</td>
                    <td>
                      <Button variant="link" onClick={() => jumpToPlayer(currentUser.userId)}>
                        <span className="pull-right">AR</span>
                      </Button>
                    </td>
                  </>
                  : <td colSpan={4}></td>
                }
              </tr>
              {currentUser
                ? friends.map(friend =>
                  <tr className="highlight-friend" id={`preview-${friend.userId}`} key={`preview-${friend.userId}`}>
                    <td>{friend.rank}</td>
                    <td>
                      {friend.name}
                      <span className="pull-right friend-icon" onClick={() => unfriend(friend.userId)}></span>
                    </td>
                    <td>{friend.userId}</td>
                    <td>
                      <Button variant="link" onClick={() => jumpToPlayer(friend.userId)}>
                        <span className="pull-right">AR</span>
                      </Button>
                    </td>
                  </tr>
                )
                : <tr className="highlight-friend">
                  <td colSpan={4}></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-md-8">
        <div className="col-xs-12">
          <label htmlFor="preview">Scoreboard:</label>
        </div>
        <table className="table table-bordered table-striped" id="scoreboard">
          <thead>
            <tr>
              <th className="col-xs-1">Rank</th>
              <th className="col-xs-6">Name</th>
              <th className="col-xs-1">Score</th>
              <th className="col-xs-3">Last Updated</th>
              <th className="col-xs-1">ID</th>
            </tr>
          </thead>
          <tbody>
            {
              players.map(player => {
                let colorClass = ''
                if (player.userId === currentUser.userId) {
                  colorClass = colorClass + ' highlight-current-user'
                }
                if (friends.some(friend => player.userId === friend.userId)) {
                  colorClass = colorClass + ' highlight-friend'
                }
                if (player.userId === 'kjp4y75j') {
                  colorClass = colorClass + ' highlight-vip'
                }

                return <tr
                  className={colorClass}
                  id={`player-${player.userId}`}
                  key={`player-${player.userId}`}
                >
                  <td>{player.rank}</td>
                  <td>
                    <a
                      href={`https://www.speedrun.com/user/${player.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >{player.name}</a>
                    {currentUser &&
                      <span
                        className="pull-right friend-icon"
                        onClick={friends.some(friend => friend.userId === player.userId)
                          ? () => unfriend(player.userId)
                          : () => befriend(player.userId)
                        }
                      ></span>
                    }
                  </td>
                  <td>{player.score}</td>
                  <td>{player.lastUpdate.toString()}</td>
                  <td>{player.userId}</td>
                </tr>
              })
            }
          </tbody>
        </table>

      </div>
    </div >
  )
}

export default Dashboard
