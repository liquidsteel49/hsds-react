import * as React from 'react'

import {
  ComponentUI,
  FieldUI,
  LabelTextUI,
  AddButtonUI,
} from './styles/EditableField.css'
import { EditableFieldInput as Input } from './EditableField.Input'
import { EditableFieldMask as Mask } from './EditableField.Mask'
import { EditableFieldActions as Actions } from './EditableField.Actions'
import EventListener from '../EventListener'
import Icon from '../Icon'

import propConnect from '../PropProvider/propConnect'
import getValidProps from '@helpscout/react-utils/dist/getValidProps'
import { classNames } from '../../utilities/classNames'
import {
  EF_COMPONENT_KEY,
  createNewValueFieldFactory,
  generateFieldActions,
  normalizeFieldValue,
  findChangedField,
  ignoreClick,
  ACTION_ICONS,
  FIELDTYPES,
  FIELDSIZES,
  FIELDSTATES,
  EDITABLEFIELD_CLASSNAMES,
  INPUT_CLASSNAMES,
  OTHERCOMPONENTS_CLASSNAMES,
  STATES_CLASSNAMES,
} from './EditableField.utils'
import { key } from '../../constants/Keys'
import { noop } from '../../utilities/other'
import { createUniqueIDFactory } from '../../utilities/id'
import { isArray, isFunction } from '../../utilities/is'
import { find } from '../../utilities/arrays'
import debounce from '../../utilities/debounce'

import * as equal from 'fast-deep-equal'

import {
  EditableFieldProps,
  EditableFieldState,
  FieldValue,
  Validation,
} from './EditableField.types'

const nextUuid = createUniqueIDFactory(EF_COMPONENT_KEY)
const createNewFieldValue = createNewValueFieldFactory(nextUuid)

const EMPTY_VALUE = ''

export class EditableField extends React.Component<
  EditableFieldProps,
  EditableFieldState
> {
  static className = EDITABLEFIELD_CLASSNAMES.component
  static defaultProps = {
    type: FIELDTYPES.text,
    defaultOption: null,
    disabled: false,
    emphasizeTopValue: false,
    inline: false,
    multipleValues: false,
    size: FIELDSIZES.md,
    state: FIELDSTATES.default,
    value: EMPTY_VALUE,
    innerRef: noop,
    onInputFocus: noop,
    onInputBlur: noop,
    onInputChange: noop,
    onOptionFocus: noop,
    onOptionChange: noop,
    onChange: noop,
    onEnter: noop,
    onEscape: noop,
    onAdd: noop,
    onCommit: noop,
    onDelete: noop,
    onDiscard: noop,
  }

  constructor(props) {
    super(props)

    const {
      actions,
      disabled,
      name,
      defaultOption,
      multipleValues,
      state,
      value,
      valueOptions,
    } = props

    let defaultStateOption: string | null = null

    if (valueOptions) {
      defaultStateOption = defaultOption ? defaultOption : valueOptions[0]
    }

    const initialFieldValue = normalizeFieldValue({
      value,
      name,
      createNewFieldValue,
      defaultOption: defaultStateOption,
    })

    this.state = {
      actions: generateFieldActions(actions),
      activeField: EMPTY_VALUE,
      defaultOption: defaultStateOption,
      disabled,
      fieldValue: initialFieldValue,
      focusedByLabel: false,
      initialFieldValue,
      maskTabIndex: null,
      multipleValuesEnabled: isArray(value) || multipleValues,
      state: state || FIELDSTATES.default,
      valueOptions:
        valueOptions && isArray(valueOptions)
          ? valueOptions.map(option => ({
              id: option,
              label: option,
              value: option,
            }))
          : null,
    }
  }

  editableFieldRef: HTMLDivElement

  shouldComponentUpdate(nextProps, nextState) {
    if (!equal(this.props.value, nextProps.value)) {
      return true
    }

    if (this.props.disabled !== nextProps.disabled) {
      return true
    }

    if (this.props.state !== nextProps.state) {
      return true
    }

    if (!equal(this.state.fieldValue, nextState.fieldValue)) {
      return true
    }

    if (!equal(this.state.initialFieldValue, nextState.initialFieldValue)) {
      return true
    }

    if (this.state.activeField !== nextState.activeField) {
      return true
    }

    if (this.state.state !== nextState.state) {
      return true
    }

    if (this.state.maskTabIndex !== nextState.maskTabIndex) {
      return true
    }

    if (this.state.focusedByLabel !== nextState.focusedByLabel) {
      return true
    }

    if (this.state.disabled !== nextState.disabled) {
      return true
    }

    return false
  }

  setEditableNode = node => {
    this.editableFieldRef = node
    this.props.innerRef(node)
  }

  getClassName() {
    const { className, size } = this.props
    const { disabled } = this.state

    return classNames(
      EditableField.className,
      className,
      disabled && STATES_CLASSNAMES.isDisabled,
      size === FIELDSIZES.lg && STATES_CLASSNAMES.isLarge
    )
  }

  assignInputValueToFieldValue = ({ inputValue, name }) => {
    const { fieldValue } = this.state

    return fieldValue.map(val => {
      if (val.id === name) {
        return { ...val, value: inputValue, validated: false }
      }
      return val
    })
  }

  handleInputFocus = ({ name, event }) => {
    const { onInputFocus } = this.props
    const { fieldValue } = this.state

    this.setState({
      focusedByLabel: false,
      activeField: name,
      maskTabIndex: null,
    })

    onInputFocus({ name, value: fieldValue, event })
  }

  handleInputBlur = ({ name, event }) => {
    const { onInputBlur } = this.props
    const { fieldValue, focusedByLabel } = this.state
    console.log('handleInputBlur')

    /* istanbul ignore else */
    if (!focusedByLabel) {
      //@ts-ignore
      this.handleFieldBlurDebounced(event)

      onInputBlur({
        name,
        value: fieldValue,
        event,
      })
    }
  }

  handleInputChange = ({ inputValue, name, event }) => {
    const { onChange, onInputChange } = this.props
    const newFieldValue = this.assignInputValueToFieldValue({
      inputValue,
      name,
    })

    // @ts-ignore
    this.setState({
      fieldValue: newFieldValue,
      disabled: false,
      state: FIELDSTATES.default,
      validationInfo: undefined,
    })

    onChange({ name, value: newFieldValue, event })
    onInputChange({ name, value: newFieldValue, event })
  }

  handleInputKeyDown = ({ event, name }) => {
    const isEnter = event.key === key.ENTER
    const isEscape = event.key === key.ESCAPE

    if (isEnter) {
      return this.handleFieldEnterPress({ event, name })
    } else if (isEscape) {
      return this.handleFieldEscapePress({ event, name })
    }
    // This path is never taken, as handleInputKeyDown is only called on enter or escape from the input
    // But typescript is being annoying about it
    /* istanbul ignore next */
    return new Promise((resolve, reject) => {
      reject()
    })
  }

  handleFieldEnterPress = ({ event, name }) => {
    const { onEnter } = this.props
    const { initialFieldValue, fieldValue, multipleValuesEnabled } = this.state
    const inputValue = event.currentTarget.value
    const impactedField = find(initialFieldValue, val => val.id === name)
    const valueDidNotChange =
      impactedField && inputValue === impactedField.value

    return new Promise(resolve => {
      const cachedEvent = { ...event }

      // Case 1: in multi-value fields if value is empty
      // Do nothing
      if (multipleValuesEnabled && inputValue === EMPTY_VALUE) {
        return
      }
      // Case 2: value was not changed
      // Just change active status
      else if (valueDidNotChange) {
        this.setState({ activeField: EMPTY_VALUE, maskTabIndex: name }, () => {
          resolve()

          onEnter({ name, value: fieldValue, event: cachedEvent })
        })
      } else {
        // Case 3: value was changed
        // Case 3A: with validation
        const { validate } = this.props
        const impactedField = find(
          this.state.fieldValue,
          val => val.id === name
        )

        if (isFunction(validate)) {
          // Skip if the field was marked as validated
          if (!impactedField.validated) {
            this.updateFieldValueWithValidation({
              name,
              resolve,
              value: inputValue,
              event: cachedEvent,
            })
          }
        } else {
          // Case 3B: without validation
          this.updateFieldValue({
            name,
            resolve,
            value: inputValue,
            event: cachedEvent,
          })
        }
      }
    })
  }

  updateFieldValueWithValidation = ({
    value,
    name,
    event,
    resolve,
  }: {
    value: string
    name: string
    event: Event
    resolve?: any
  }) => {
    const { validate } = this.props

    if (isFunction(validate)) {
      this.setState({ disabled: true })

      validate({ value, name }).then((validation: Validation) => {
        if (validation.isValid) {
          this.updateFieldValue({ value, name, resolve, event })
        } else {
          this.setState({
            disabled: false,
            state: validation.type,
            validationInfo: validation,
            fieldValue: this.state.fieldValue.map(field => {
              if (field.id === name) {
                return { ...field, validated: true }
              }
              return field
            }),
          })
        }
      })
    }
  }

  /**
   * Change active status, field value, update initialFieldValue, enable field
   */
  updateFieldValue = ({ value, event, name, resolve }) => {
    const { onEnter, onCommit, validate } = this.props
    const { fieldValue } = this.state
    const updatedFieldValue = fieldValue.map(val => {
      /* istanbul ignore else */
      if (val.id === name) {
        return { ...val, value: value, validated: isFunction(validate) }
      }
      return val
    })

    this.setState(
      {
        disabled: false,
        fieldValue: updatedFieldValue,
        initialFieldValue: updatedFieldValue,
        maskTabIndex: name,
        validationInfo: undefined,
      },
      () => {
        resolve && resolve()
        onEnter({ name, value: updatedFieldValue, event })
        onCommit({ name, value: updatedFieldValue })
      }
    )
  }

  handleFieldEscapePress = ({ event, name }) => {
    const { onEscape, onDiscard } = this.props
    const { initialFieldValue } = this.state
    const cachedEvent = { ...event }

    return new Promise(resolve => {
      // Change active status and return fieldValue to initialValue
      this.setState(
        {
          activeField: EMPTY_VALUE,
          fieldValue: initialFieldValue,
          maskTabIndex: name,
        },
        () => {
          resolve()

          onEscape({ name, value: initialFieldValue, event: cachedEvent })
          onDiscard({ value: initialFieldValue })
        }
      )
    })
  }

  /* istanbul ignore next */
  handleMaskValueKeyDown = ({ event, name }) => {
    const isEnter = event.key === key.ENTER
    const isEscape = event.key === key.ESCAPE

    if (isEnter || isEscape) {
      this.setState(
        {
          maskTabIndex: null,
        },
        () => {
          const inputNode = document.getElementById(name)
          isEnter && inputNode && inputNode.focus()
        }
      )
    }
  }

  handleOptionFocus = ({ name, event }) => {
    const { onOptionFocus } = this.props

    this.setState({
      activeField: name,
    })

    onOptionFocus({ name, value: this.state.fieldValue, event })
  }

  handleOptionSelection = ({ name, selection }) => {
    const { onChange, onOptionChange, onCommit } = this.props
    const { fieldValue } = this.state
    let newFieldValue: FieldValue[] = []
    let changed = false

    for (const value of fieldValue) {
      const temp = { ...value }
      /* istanbul ignore else */
      if (temp.id === name && temp.option !== selection) {
        temp.option = selection
        changed = true
      }

      newFieldValue.push(temp)
    }

    /* istanbul ignore else */
    if (changed) {
      this.setState({ fieldValue: newFieldValue, activeField: name }, () => {
        onOptionChange({ name, selection, value: newFieldValue })
        onChange({ name, value: newFieldValue })
        onCommit({ name, value: newFieldValue })
      })
    }
  }

  handleAddValue = () => {
    const { onAdd } = this.props
    const { fieldValue, defaultOption } = this.state
    const isNotSingleEmptyValue =
      fieldValue[fieldValue.length - 1].value !== EMPTY_VALUE
    /* istanbul ignore next */
    if (isNotSingleEmptyValue) {
      // it is tested
      const { name } = this.props
      const newValueObject = createNewFieldValue(
        {
          value: EMPTY_VALUE,
          name,
        },
        defaultOption
      )
      const newFieldValue = fieldValue.concat(newValueObject)
      const newState: any = {
        fieldValue: newFieldValue,
        activeField: newValueObject.id,
      }
      this.setState(newState)

      onAdd({ name, value: newFieldValue })
    }
  }

  handleDeleteAction = ({ action, name, event }) => {
    const { onCommit, onDelete } = this.props
    const { defaultOption, fieldValue } = this.state
    const cachedEvent = { ...event }
    let updatedFieldValue: FieldValue[]

    // Clearing value
    // When there is only one item in the fieldValue array
    if (fieldValue.length === 1) {
      const emptyValue = { ...fieldValue[0], validated: false }

      emptyValue.value = EMPTY_VALUE
      /* istanbul ignore next */
      if (defaultOption != null) {
        emptyValue.option = defaultOption
      }

      updatedFieldValue = [emptyValue]
    } else {
      // Deleting value
      // Remove the item from the array
      updatedFieldValue = fieldValue.filter(val => val.id !== name)
    }

    this.setState(
      {
        fieldValue: updatedFieldValue,
        initialFieldValue: updatedFieldValue,
      },
      () => {
        onDelete({ name, value: this.state.fieldValue, event })
        onCommit({ name, value: this.state.fieldValue })

        if (isFunction(action.callback)) {
          action.callback({
            name,
            action,
            value: fieldValue,
            event: cachedEvent,
          })
        }
      }
    )
  }

  handleCustomAction = ({ action, name, event }) => {
    const { fieldValue } = this.state

    if (isFunction(action.callback)) {
      action.callback({ name, action, value: fieldValue, event })
    }
  }

  handleOusideFieldClick = (event: Event) => {
    if (ignoreClick(event, this.editableFieldRef)) return

    // @ts-ignore
    this.handleFieldBlurDebounced(event)

    this.setState({
      activeField: EMPTY_VALUE,
    })
  }

  handleBlur = event => {
    const { fieldValue, initialFieldValue, multipleValuesEnabled } = this.state
    const { name, validate } = this.props
    const withValidation = isFunction(validate)

    // Value unchanged
    if (equal(initialFieldValue, fieldValue)) {
      return
    }

    const updatedField =
      fieldValue.length === 1
        ? fieldValue[0]
        : findChangedField(initialFieldValue, fieldValue)

    if (withValidation && updatedField.value && !updatedField.validated) {
      this.updateFieldValueWithValidation({
        value: updatedField.value,
        name: updatedField.id,
        event,
      })

      return
    }

    const removedEmptyFields = fieldValue.filter(field => Boolean(field.value))
    const shouldDiscardEmpty =
      multipleValuesEnabled &&
      removedEmptyFields.length < fieldValue.length &&
      removedEmptyFields.length > 0

    if (shouldDiscardEmpty) {
      this.setState(
        {
          fieldValue: removedEmptyFields,
          activeField: EMPTY_VALUE,
          disabled: false,
        },
        () => {
          this.props.onDiscard({ value: this.state.fieldValue })
          this.props.onCommit({ name, value: this.state.fieldValue })
        }
      )

      return
    }

    this.setState(
      {
        disabled: false,
      },
      () => {
        this.props.onCommit({ name, value: this.state.fieldValue })
      }
    )
  }

  handleFieldBlurDebounced = debounce(this.handleBlur, 200, false)

  renderAddButton = () => {
    const {
      disabled,
      fieldValue,
      multipleValuesEnabled,
      validationInfo,
    } = this.state

    const isLastValueEmpty =
      fieldValue[fieldValue.length - 1].value === EMPTY_VALUE
    const isSingleAndEmpty = fieldValue.length === 1 && isLastValueEmpty
    const invalidValuePresent = validationInfo && !validationInfo.isValid

    return multipleValuesEnabled &&
      !isSingleAndEmpty &&
      !disabled &&
      !invalidValuePresent ? (
      <AddButtonUI
        className={EDITABLEFIELD_CLASSNAMES.addButton}
        type="button"
        onClick={this.handleAddValue}
        disabled={isLastValueEmpty}
      >
        <Icon name={ACTION_ICONS.plus} size="24" />
      </AddButtonUI>
    ) : null
  }

  renderFields = () => {
    const { name, emphasizeTopValue, type, ...rest } = this.props
    const {
      actions,
      activeField,
      disabled,
      fieldValue,
      maskTabIndex,
      multipleValuesEnabled,
      state,
      valueOptions,
      validationInfo,
    } = this.state

    return (
      <div className={EDITABLEFIELD_CLASSNAMES.fieldWrapper}>
        {fieldValue.map((val, index) => {
          const isActive = activeField === val.id

          return (
            <FieldUI
              className={classNames(
                EDITABLEFIELD_CLASSNAMES.field,
                isActive && STATES_CLASSNAMES.isActive,
                valueOptions && STATES_CLASSNAMES.hasOptions,
                !Boolean(val.value) && STATES_CLASSNAMES.isEmpty
              )}
              key={val.id}
            >
              <Input
                {...getValidProps(rest)}
                actions={actions}
                disabled={disabled}
                fieldValue={val}
                isActive={isActive}
                name={val.id}
                state={state}
                type={type}
                validationInfo={validationInfo}
                valueOptions={valueOptions}
                onInputFocus={this.handleInputFocus}
                onInputBlur={this.handleInputBlur}
                onInputChange={this.handleInputChange}
                onOptionFocus={this.handleOptionFocus}
                onOptionSelection={this.handleOptionSelection}
                onChange={this.handleInputChange}
                onKeyDown={this.handleInputKeyDown}
              />
              <Mask
                {...getValidProps(rest)}
                actions={actions}
                emphasize={
                  multipleValuesEnabled && emphasizeTopValue && index === 0
                }
                fieldValue={val}
                name={val.id}
                type={type}
                valueOptions={valueOptions}
                maskTabIndex={maskTabIndex}
                onValueKeyDown={this.handleMaskValueKeyDown}
              />
              {actions && Boolean(val.value) && !disabled ? (
                <Actions
                  actions={actions}
                  fieldValue={val}
                  name={val.id}
                  customAction={this.handleCustomAction}
                  deleteAction={this.handleDeleteAction}
                />
              ) : null}
            </FieldUI>
          )
        })}

        {this.renderAddButton()}
      </div>
    )
  }

  renderFieldsInline = () => {
    const { name, inline, type, ...rest } = this.props
    const { activeField, disabled, fieldValue } = this.state

    return (
      <div className={EDITABLEFIELD_CLASSNAMES.fieldWrapper}>
        {fieldValue.map(val => {
          const isActive = activeField === val.id

          return (
            <FieldUI
              className={classNames(
                EDITABLEFIELD_CLASSNAMES.field,
                isActive && STATES_CLASSNAMES.isActive,
                !Boolean(val.value) && STATES_CLASSNAMES.isEmpty
              )}
              key={val.id}
            >
              <Input
                {...getValidProps(rest)}
                disabled={disabled}
                fieldValue={val}
                isActive={isActive}
                inline={inline}
                name={val.id}
                type={type}
                onInputFocus={this.handleInputFocus}
                onInputBlur={this.handleInputBlur}
                onInputChange={this.handleInputChange}
                onOptionFocus={this.handleOptionFocus}
                onOptionSelection={this.handleOptionSelection}
                onChange={this.handleInputChange}
                onKeyDown={this.handleInputKeyDown}
              />
            </FieldUI>
          )
        })}
      </div>
    )
  }

  handleLabelClick = e => {
    e.preventDefault()
    const { disabled } = this.props
    const { fieldValue } = this.state

    if (!disabled) {
      // @ts-ignore
      this.setState({ focusedByLabel: true, activeField: fieldValue[0].id })
    }
  }

  render() {
    const { inline, label, name, type, value, ...rest } = this.props
    const { fieldValue } = this.state

    if (inline) {
      return (
        <ComponentUI
          {...getValidProps(rest)}
          className={this.getClassName()}
          innerRef={this.setEditableNode}
          inline
        >
          <EventListener
            event="mousedown"
            handler={this.handleOusideFieldClick}
          />
          {this.renderFieldsInline()}
        </ComponentUI>
      )
    }

    return (
      <ComponentUI
        {...getValidProps(rest)}
        className={this.getClassName()}
        innerRef={this.setEditableNode}
      >
        <EventListener event="click" handler={this.handleOusideFieldClick} />
        <label
          className={EDITABLEFIELD_CLASSNAMES.label}
          htmlFor={fieldValue[0].id}
          onClick={this.handleLabelClick}
        >
          <LabelTextUI className={EDITABLEFIELD_CLASSNAMES.labelText}>
            {label || name}
          </LabelTextUI>
        </label>
        {this.renderFields()}
      </ComponentUI>
    )
  }
}

const PropConnectedComponent = propConnect(EF_COMPONENT_KEY)(EditableField)

export default PropConnectedComponent
