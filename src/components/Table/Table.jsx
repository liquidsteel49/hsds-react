import React from 'react'
import PropTypes from 'prop-types'
import { ThemeProvider } from 'styled-components'
import { classNames } from '../../utilities/classNames'
import { noop } from '../../utilities/other'
import equal from 'fast-deep-equal'
import getValidProps from '@helpscout/react-utils/dist/getValidProps'
import Button from '../Button'
import Scrollable from '../Scrollable'
import { TableWrapperUI, TableUI, LoadingUI } from './Table.css'
import { defaultSkin, chooseSkin } from './Table.skins'
import { columnShape, dataShape } from './Table.utils'
import TableBody from './Table.Body'
import TableHead from './Table.Head'

export const TABLE_CLASSNAME = 'c-Table'

export class Table extends React.Component {
  constructor(props) {
    super(props)

    const { maxRowsToDisplay, data } = this.props

    this.state = {
      isTableCollapsed:
        maxRowsToDisplay != null && maxRowsToDisplay < data.length,
    }
  }

  setWrapperNode = node => {
    this.wrapperNode = node
    this.props.wrapperRef(node)
  }

  setTableNode = node => {
    this.tableNode = node
    this.props.tableRef(node)
  }

  getComponentClassNames = () => {
    const { className, tableClassName, onRowClick } = this.props
    const { isTableCollapsed } = this.state

    const tableWrapperClassNames = classNames(
      `${TABLE_CLASSNAME}__Wrapper`,
      isTableCollapsed && 'is-collapsed',
      className
    )
    const tableClassNames = classNames(
      TABLE_CLASSNAME,
      Boolean(onRowClick) && 'with-clickable-rows',
      tableClassName
    )

    return { tableWrapperClassNames, tableClassNames }
  }

  handleExpanderClick = () => {
    this.setState(
      {
        isTableCollapsed: !this.state.isTableCollapsed,
      },
      () => {
        this.props.onExpand(!!this.state.isTableCollapsed)
      }
    )
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      nextState &&
      nextState.isTableCollapsed !== this.state.isTableCollapsed
    ) {
      return true
    }

    const { columns, data, ...rest } = this.props
    const { columns: columnsNext, data: dataNext, ...restNext } = nextProps
    if (!equal(rest, restNext)) {
      return true
    }
    if (!equal(columnsNext, columns)) {
      return true
    }

    if (!equal(dataNext, data)) {
      return true
    }

    return false
  }

  render() {
    const {
      className,
      tableClassName,
      columns,
      data,
      expanderText,
      maxRowsToDisplay,
      tableWidth,
      containerWidth,
      sortedInfo,
      isLoading,
      isScrollLocked,
      withTallRows,
      onRowClick,
      skin,
      ...rest
    } = this.props

    const { isTableCollapsed } = this.state

    const {
      tableWrapperClassNames,
      tableClassNames,
    } = this.getComponentClassNames()

    return (
      <ThemeProvider theme={chooseSkin(skin)}>
        <TableWrapperUI
          {...getValidProps(rest)}
          className={tableWrapperClassNames}
          ref={this.setWrapperNode}
          containerWidth={containerWidth}
        >
          <Scrollable
            fadeLeft
            fadeRight
            scrollLockDirection="x"
            isScrollLocked={isScrollLocked}
          >
            <TableUI
              tableWidth={tableWidth}
              withTallRows={withTallRows}
              className={tableClassNames}
              ref={this.setTableNode}
            >
              <TableHead
                columns={columns}
                isLoading={isLoading}
                sortedInfo={sortedInfo}
              />

              <TableBody
                rows={data}
                columns={columns}
                isTableCollapsed={isTableCollapsed}
                maxRowsToDisplay={maxRowsToDisplay}
                onRowClick={onRowClick}
              />
            </TableUI>
          </Scrollable>

          {isLoading && <LoadingUI className={`${TABLE_CLASSNAME}__Loading`} />}

          {maxRowsToDisplay && isTableCollapsed ? (
            <Button
              style={{ marginLeft: '14px' }}
              kind="link"
              className={`${TABLE_CLASSNAME}__Expander`}
              onClick={this.handleExpanderClick}
            >
              {expanderText ? expanderText.collapsed : 'View All'}
            </Button>
          ) : null}

          {maxRowsToDisplay && !isTableCollapsed ? (
            <Button
              style={{ marginLeft: '14px' }}
              kind="link"
              className={`${TABLE_CLASSNAME}__Expander`}
              onClick={this.handleExpanderClick}
            >
              {expanderText ? expanderText.expanded : 'Collapse'}
            </Button>
          ) : null}
        </TableWrapperUI>
      </ThemeProvider>
    )
  }
}

Table.propTypes = {
  className: PropTypes.string,
  tableClassName: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.shape(columnShape)),
  data: PropTypes.arrayOf(PropTypes.shape(dataShape)),
  /** Data attr for Cypress tests. */
  'data-cy': PropTypes.string,
  expanderText: PropTypes.any,
  maxRowsToDisplay: PropTypes.number,
  containerWidth: PropTypes.string,
  tableWidth: PropTypes.shape({ min: PropTypes.string, max: PropTypes.string }),
  skin: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      fontColorHeader: PropTypes.string,
      fontColorBody: PropTypes.string,
      fontColorAlternate: PropTypes.string,
      bgColor: PropTypes.string,
      bgAlternate: PropTypes.string,
      bgHeader: PropTypes.string,
      bgColorHover: PropTypes.string,
      borderTableBody: PropTypes.string,
      borderTableHeader: PropTypes.string,
      borderRows: PropTypes.string,
      borderColumns: PropTypes.string,
    }),
  ]),
  isLoading: PropTypes.bool,
  isScrollLocked: PropTypes.bool,
  withTallRows: PropTypes.bool,
  sortedInfo: PropTypes.shape({
    columnKey: PropTypes.string,
    order: PropTypes.string,
  }),
  onRowClick: PropTypes.func,
  onExpand: PropTypes.func,
  tableRef: PropTypes.func,
  wrapperRef: PropTypes.func,
}

Table.defaultProps = {
  columns: [],
  data: [],
  'data-cy': 'Table',
  skin: defaultSkin,
  tableWidth: { min: '700px' },
  containerWidth: '100%',
  sortedInfo: {
    columnKey: null,
    order: null,
  },
  isLoading: false,
  isScrollLocked: true,
  onRowClick: null,
  wrapperRef: noop,
  tableRef: noop,
  onExpand: noop,
  withTallRows: false,
}

export default Table
