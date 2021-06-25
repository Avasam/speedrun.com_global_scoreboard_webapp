import { forwardRef, useState } from 'react'
import { Col, FormLabel, Row, Tab, Tabs } from 'react-bootstrap'

import QuickView from 'src/Components/Dashboard/QuickView/QuickView'
import type { ScoreboardRef } from 'src/Components/Dashboard/Scoreboard'
import Scoreboard from 'src/Components/Dashboard/Scoreboard'
import UpdateRunnerForm from 'src/Components/Dashboard/UpdateRunnerForm'
import type Player from 'src/Models/Player'

type ScoreTableLayoutProps = {
  onUpdate: (runnerNameOrId: string) => void
  onJumpToPlayer: (playerId: string) => void
  updating: boolean
  currentUser: Player | null
  players: Player[]
  friends: Player[]
  onUnfriend: (playerId: string) => void
  onBefriend: (playerId: string) => void
}

export const MobileScoreTableLayout = forwardRef<ScoreboardRef, ScoreTableLayoutProps>((props, ref) => {
  const [activeKey, setActiveKey] = useState('scoreboard')
  const handleJumpToPlayer: ScoreTableLayoutProps['onJumpToPlayer'] = playerId => {
    props.onJumpToPlayer(playerId)
    setActiveKey('scoreboard')
  }

  return <Row className='gx-0' >
    <UpdateRunnerForm {...props} />

    <Tabs activeKey={activeKey} onSelect={key => setActiveKey(key ?? 'scoreboard')}>
      <Tab eventKey='quickview' title='Quick view'>
        <QuickView {...props} onJumpToPlayer={handleJumpToPlayer} />
      </Tab>
      <Tab eventKey='scoreboard' title='Scoreboard'>
        <div style={{ paddingTop: '0.5rem' }}>
          <Scoreboard {...props} ref={ref} />
        </div>
      </Tab>
    </Tabs>
  </Row >
})
MobileScoreTableLayout.displayName = 'MobileScoreTableLayout'

export const DesktopScoreTableLayout = forwardRef<ScoreboardRef, ScoreTableLayoutProps>((props, ref) =>
  <Row>
    <Col md={4}>
      <UpdateRunnerForm {...props} />

      <FormLabel>Quick view:</FormLabel>
      <QuickView {...props} />
    </Col>

    <Col md={8}>
      <FormLabel>Scoreboard:</FormLabel>
      <Scoreboard {...props} ref={ref} />
    </Col>
  </Row>)
DesktopScoreTableLayout.displayName = 'DesktopScoreTableLayout'
