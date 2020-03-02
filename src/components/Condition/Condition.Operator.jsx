import React from 'react'
import PropTypes from 'prop-types'
import Text from '../Text'
import { classNames } from '../../utilities/classNames'
import { OperatorUI } from './Condition.css'

export const Operator = props => {
  const { className, isBorderless, type, ...rest } = props
  const label = type.toLowerCase() === 'and' ? 'and' : 'or'

  const componentClassName = classNames(
    Operator.className,
    isBorderless && 'is-borderless',
    `is-${label}`,
    className
  )

  return (
    <OperatorUI {...rest} className={componentClassName}>
      <Text block lineHeightReset size="11" weight={500}>
        {label}
      </Text>
    </OperatorUI>
  )
}

Operator.propTypes = {
  /** The className of the component. */
  className: PropTypes.string,
  /** Retrieve the inner DOM node. */
  innerRef: PropTypes.func,
  /** Renders a white border. */
  isBorderless: PropTypes.bool,
  /** The operator. */
  type: PropTypes.oneOf(['and', 'or']),
}

Operator.className = 'c-ConditionOperator'

Operator.defaultProps = {
  isBorderless: true,
  type: 'or',
}

Operator.displayName = 'ConditionOperator'

export default Operator
