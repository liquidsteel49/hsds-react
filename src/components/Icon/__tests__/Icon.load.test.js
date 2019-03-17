import React from 'react'
import { mount } from 'enzyme'
import Icon, { svgSet, load } from '../Icon'

test('Is not set by default', () => {
  expect(svgSet).toEqual({})

  const wrapper = mount(<Icon name="activity" />)
  expect(wrapper.html()).not.toContain('svg')
})

test('Can be set with load', () => {
  const svgs = {
    activity: '<svg><path></path></svg>',
    chat: '<svg><path></path></svg>',
  }

  load(svgs)
  expect(svgSet).toEqual(svgs)

  const wrapper = mount(<Icon name="activity" />)
  expect(wrapper.html()).toContain(svgs.activity)
})