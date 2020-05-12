import React, { ReactNode } from 'react'
import { Modal } from 'react-bootstrap'

type GenericModalProps = {
  show: boolean
  onHide: () => void
  title: string
  children: ReactNode
}

const GenericModal = (props: GenericModalProps) =>
  <Modal show={props.show} onHide={props.onHide}>
    <Modal.Header closeButton>
      <Modal.Title>{props.title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>{props.children}</Modal.Body>
  </Modal>

export default GenericModal
