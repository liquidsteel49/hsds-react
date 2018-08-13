import React from 'react'
import PropTypes from 'prop-types'
import { setComponentKey } from '../../utilities/component'
import classNames from '../../utilities/classNames'
import { noop } from '../../utilities/other'
import RouteWrapper from '../RouteWrapper'
import { stateTypes } from '../../constants/propTypes'
import { COMPONENT_KEY } from './utils'

export const propTypes = {
  accessibilityLabel: PropTypes.string,
  block: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onFocus: PropTypes.func,
  isActive: PropTypes.bool,
  outline: PropTypes.bool,
  plain: PropTypes.bool,
  primary: PropTypes.bool,
  size: PropTypes.oneOf(['lg', 'md', 'sm', 'xs', '']),
  state: stateTypes,
  submit: PropTypes.bool,
  theme: PropTypes.string,
}

const defaultProps = {
  block: false,
  disabled: false,
  onBlur: noop,
  onClick: noop,
  onFocus: noop,
  outline: false,
  plain: false,
  primary: false,
  submit: false,
}

const Button = props => {
  const {
    accessibilityLabel,
    block,
    buttonRef,
    children,
    className,
    disabled,
    isActive,
    isFirst,
    isNotOnly,
    isLast,
    onBlur,
    onClick,
    onFocus,
    outline,
    plain,
    primary,
    size,
    state,
    submit,
    theme,
    ...rest
  } = props

  const componentClassName = classNames(
    'c-Button',
    isActive && 'is-selected',
    block && 'c-Button--block',
    isFirst && 'is-first',
    isNotOnly && 'is-notOnly',
    isLast && 'is-last',
    outline && 'c-Button--outline',
    plain && 'c-Button--link',
    primary && 'c-Button--primary',
    size && `c-Button--${size}`,
    state && `is-${state}`,
    theme && `c-Button--${theme}`,
    className
  )

  const type = submit ? 'submit' : 'button'

  return (
    <button
      aria-label={accessibilityLabel}
      ref={buttonRef}
      className={componentClassName}
      disabled={disabled}
      onBlur={onBlur}
      onClick={onClick}
      onFocus={onFocus}
      type={type}
      {...rest}
    >
      {children}
    </button>
  )
}

Button.propTypes = propTypes
Button.defaultProps = defaultProps

setComponentKey(Button, COMPONENT_KEY)

export default RouteWrapper(Button)