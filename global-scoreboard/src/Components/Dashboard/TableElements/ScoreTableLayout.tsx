import { forwardRef, useState } from 'react'
import { Col, FormLabel, Row, Tab, Tabs } from 'react-bootstrap'

import type { QuickViewProps } from 'src/Components/Dashboard/QuickView/QuickView'
import QuickView from 'src/Components/Dashboard/QuickView/QuickView'
import type { ScoreboardProps, ScoreboardRef } from 'src/Components/Dashboard/Scoreboard'
import Scoreboard from 'src/Components/Dashboard/Scoreboard'
import type { UpdateRunnerFormProps } from 'src/Components/Dashboard/UpdateRunnerForm'
import UpdateRunnerForm from 'src/Components/Dashboard/UpdateRunnerForm'

type ScoreTableLayoutProps = QuickViewProps & ScoreboardProps & UpdateRunnerFormProps

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
