import * as React from 'react'
import { classNames } from '../../utilities/classNames'
import { namespaceComponent } from '../../utilities/component'
import { COMPONENT_KEY, MODAL_STYLES } from './Modal.utils'
import {
  ActionFooterUI,
  CancelButtonUI,
  PrimaryButtonUI,
  SecondaryAlertButtonUI,
  SecondaryButtonUI,
} from './styles/Modal.ActionFooter.css'
import { ModalActionFooterProps } from './Modal.types'

import Button from '../Button'

class ActionFooter extends React.PureComponent<ModalActionFooterProps> {
  static defaultProps = {
    cancelText: 'Cancel',
    kind: MODAL_STYLES.DEFAULT,
    onCancel: () => {},
    primaryButtonText: 'Save',
    secondaryButtonText: null,
    showDefaultCancel: true,
    state: '',
    onPrimaryClick: () => {},
    onSecondaryClick: () => {},
  }

  handleCancel = e => {
    e && e.preventDefault()
    const { onCancel } = this.props
    if (onCancel) {
      onCancel()
    }
  }

  handlePrimaryAction = e => {
    e && e.preventDefault()
    const { onPrimaryClick } = this.props
    if (onPrimaryClick) {
      onPrimaryClick()
    }
  }

  handleSecondaryAction = e => {
    e && e.preventDefault()
    const { onSecondaryClick } = this.props
    if (onSecondaryClick) {
      onSecondaryClick()
    }
  }

  renderPrimaryButton() {
    const { primaryButtonText, state } = this.props
    return (
      <PrimaryButtonUI
        state={state}
        kind="primary"
        size="lg"
        version={2}
        onClick={this.handlePrimaryAction}
      >
        {primaryButtonText}
      </PrimaryButtonUI>
    )
  }

  renderSecondaryButton() {
    const { kind, secondaryButtonText } = this.props
    if (!secondaryButtonText) {
      return null
    }

    if (kind === MODAL_STYLES.ALERT) {
      return (
        <SecondaryAlertButtonUI
          kind="secondary"
          size="lg"
          version={2}
          onClick={this.handleSecondaryAction}
        >
          {secondaryButtonText}
        </SecondaryAlertButtonUI>
      )
    } else {
      return (
        <SecondaryButtonUI
          kind="secondary"
          size="lg"
          version={2}
          onClick={this.handleSecondaryAction}
        >
          {secondaryButtonText}
        </SecondaryButtonUI>
      )
    }
  }

  renderCancelButton() {
    const { cancelText, showDefaultCancel } = this.props
    if (!(showDefaultCancel && cancelText)) {
      return null
    }
    return (
      <CancelButtonUI
        className="is-cancel"
        kind="default"
        version={2}
        onClick={this.handleCancel}
      >
        {cancelText}
      </CancelButtonUI>
    )
  }

  render() {
    const { className, kind, state, ...rest } = this.props

    const componentClassName = classNames(
      'c-ModalActionFooter',
      kind === MODAL_STYLES.DEFAULT && 'is-default',
      kind === MODAL_STYLES.ALERT && 'is-alert',
      kind === MODAL_STYLES.BRANDED && 'is-branded',
      kind === MODAL_STYLES.SEQUENCE && 'is-sequence',
      state === 'danger' && 'is-danger',
      className
    )

    return (
      <ActionFooterUI
        {...rest}
        className={componentClassName}
        gap="md"
        placement="bottom"
        size="md"
      >
        {this.renderCancelButton()}
        {this.renderSecondaryButton()}
        {this.renderPrimaryButton()}
      </ActionFooterUI>
    )
  }
}

namespaceComponent(COMPONENT_KEY.ActionFooter)(ActionFooter)

export default ActionFooter