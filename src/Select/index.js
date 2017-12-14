import React, { Component } from 'react'
import Option from '../Option'
import PropTypes from 'prop-types'
import uniqueId from 'lodash/uniqueId'
import * as keycode from '../keycodes'

export default class Select extends Component {
  static propTypes = {
    label: (props, propName, componentName) => {
      if (!props.label && !props.labelledBy) {
        const msg = `One of props 'label' or 'labelledBy' was not specified in ${componentName}`
        return new Error(msg)
      }
      return null
    },
    labelledBy: (props, propName, componentName) => {
      const msg = `One of props 'label' or 'labelledBy' was not specified in ${componentName}`
      if (!props.label && !props.labelledBy) {
        return new Error(msg)
      }
      return null
    },
    placeholderText: PropTypes.string,
    indicator: PropTypes.string,
    initialValue: PropTypes.string,
    onChange: PropTypes.func,
  }
  static defaultProps = {
    placeholderText: 'Please choose...',
    indicator: '&#x25be;',
    onChange: (_value) => {},
  }

  constructor() {
    super()
    this.state = {
      open: false,
      selectedIndex: null,
      highlightedIndex: -1,
    }
    this.options = []
  }

  componentWillMount() {
    let index = -1
    const { children, initialValue } = this.props
    const indexedOptions = React.Children.map(children, (child) => {
      if (child.type === Option) {
        index++
        return React.cloneElement(child, {
          onMouseOver: (e) => this.handleOptionHover(e, index),
          onClick: (e) => this.handleOptionSelect(e, index),
          index,
        })
      }
      return null
    })
    this.options = React.Children.toArray(indexedOptions).filter((child) => !!child)

    if (initialValue) {
      const initialOption = this.findOptionByValue(initialValue)
      if (initialOption) {
        this.setState({
          selectedIndex: initialOption.props.index,
        })
      }
    }
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
  }

  handleClick = (_e) => {
    const { open } = this.state
    this.setState({
      open: !open,
    })
  }

  handleClickOutside = (e) => {
    if (this.wrapperDiv && !this.wrapperDiv.contains(e.target)) {
      const { open } = this.state
      if (open) {
        this.setState({
          open: false,
        })
      }
    }
  }

  handleKeyDown = (e) => {
    const { open, highlightedIndex } = this.state
    e.preventDefault()
    switch (e.keyCode) {
      case keycode.DOWN: {
        if (!open) {
          this.setState({
            open: true,
          })
        }
        const nextIndex = highlightedIndex === React.Children.count(this.options) - 1 ?
              highlightedIndex : highlightedIndex + 1
        this.setState({
          highlightedIndex: nextIndex,
        })
        break
      }
      case keycode.UP: {
        const previousIndex = highlightedIndex === 0 ? 0 : highlightedIndex - 1
        this.setState({
          highlightedIndex: previousIndex,
        })
        break
      }
      case keycode.ESC: {
        if (open) {
          this.setState({
            open: false,
          })
        }
        break
      }
      case keycode.SPACE:
      case keycode.ENTER: {
        if (open) {
          this.handleOptionSelect(e, highlightedIndex)
        } else {
          this.setState({
            open: true,
            highlightedIndex: 0,
          })
        }
        break
      }
      case keycode.TAB: {
        if (open) {
          this.setState({
            open: false,
          })
        }
        break
      }
      default:
    }
  }

  handleOptionHover(e, hoverOverIndex) {
    this.setState({
      highlightedIndex: hoverOverIndex,
    })
  }

  handleOptionSelect(_e, clickedIndex) {
    this.selectOption(clickedIndex)
  }

  selectOption(index) {
    const { onChange } = this.props
    this.setState({
      open: false,
      selectedIndex: index,
      highlightedIndex: null,
    })

    const selectedValue = this.findOptionByIndex(index).props.value
    if (onChange) {
      onChange(selectedValue)
    }
  }

  findOptionByIndex(index) {
    return this.options.find((option) => option.props.index === index)
  }

  findOptionByValue(value) {
    return this.options.find((option) => option.props.value === value)
  }

  renderButtonLabel(listId) {
    const { selectedIndex } = this.state
    const { placeholderText, indicator } = this.props
    if (selectedIndex === null) {
      return (
        <span aria-controls={listId}>
          { placeholderText }
          <div
            className="ReactA11ySelect__button__arrow"
            dangerouslySetInnerHTML={{ __html: indicator }}
          />
        </span>
      )
    }
    return (
      <span aria-controls={listId}>
        {this.findOptionByIndex(selectedIndex).props.children}
        <div
          className="ReactA11ySelect__button__arrow"
          dangerouslySetInnerHTML={{ __html: indicator }}
        />
      </span>
    )
  }

  renderChildren() {
    const { highlightedIndex, selectedIndex } = this.state
    const options = this.options.map((option) =>
      React.cloneElement(option, {
        id: `option-${option.props.index}`,
        highlighted: (highlightedIndex === option.props.index ? true : undefined),
        selected: (selectedIndex === option.props.index),
        onMouseOver: (e) => this.handleOptionHover(e, option.props.index),
        onClick: (e) => this.handleOptionSelect(e, option.props.index),
      })
    )
    return <div>{options}</div>
  }

  render() {
    const { open } = this.state
    const listId = `react-a11y-select-${uniqueId()}`
    return (
      <div
        className="ReactA11ySelect"
        ref={(wrapperDiv) => { this.wrapperDiv = wrapperDiv }}
      >
        <button
          tabIndex="0"
          className={
            `ReactA11ySelect__button ${this.state.open ? 'ReactA11ySelect__button--open' : ''}`
          }
          role="button"
          aria-haspopup="true"
          aria-expanded={open ? true : undefined} // ARIA recommends not excluding over false
          onKeyDown={this.handleKeyDown}
          onClick={this.handleClick}
        >
          {this.renderButtonLabel(listId)}
        </button>
        {this.state.open &&
          <ul id={listId} role="menu" className="ReactA11ySelect__ul">
            {this.renderChildren()}
          </ul>}
      </div>
    )
  }
}