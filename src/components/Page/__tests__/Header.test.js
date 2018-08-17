import React from 'react'
import { mount } from 'enzyme'
import Header from '../Header'

describe('ClassName', () => {
  test('Has default className', () => {
    const wrapper = mount(<Header />)

    expect(wrapper.hasClass('c-PageHeader')).toBe(true)
  })

  test('Applies custom className if specified', () => {
    const className = 'channel-4'
    const wrapper = mount(<Header className={className} />)

    expect(wrapper.hasClass(className)).toBe(true)
  })
})

describe('Content', () => {
  test('Does not renders child content', () => {
    const wrapper = mount(<Header>Channel 4</Header>)

    expect(wrapper.text()).not.toBe('Channel 4')
  })
})

describe('Title', () => {
  test('Can render a title', () => {
    const wrapper = mount(<Header title="Channel 4" />)

    expect(wrapper.text()).toContain('Channel 4')
  })

  test('Can render a subtitle', () => {
    const wrapper = mount(<Header title="Channel 4" subtitle="News team" />)

    expect(wrapper.text()).toContain('Channel 4')
    expect(wrapper.text()).toContain('News team')
  })
})

describe('Border', () => {
  test('Renders a border', () => {
    const wrapper = mount(<Header title="Channel 4" />)

    expect(wrapper.find('hr').length).toBe(1)
    expect(wrapper.hasClass('withBorder')).toBe(true)
  })

  test('Can not render a border, if specified', () => {
    const wrapper = mount(<Header title="Channel 4" withBorder={false} />)

    expect(wrapper.find('hr').length).toBe(0)
    expect(wrapper.hasClass('withBorder')).toBe(false)
  })
})