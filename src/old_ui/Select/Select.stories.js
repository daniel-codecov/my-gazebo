/* eslint-disable react/display-name */
import identity from 'lodash/identity'
import PropTypes from 'prop-types'
import { useState } from 'react'

import Select from './Select'

const Template = ({ renderItem, renderSelected, onChange, ...args }) => {
  const [value, setValue] = useState()
  // Storybook doesn't process default function props correctly
  const functionArgs = { renderItem, renderSelected }
  if (renderItem === 'identity') functionArgs.renderItem = identity
  if (renderSelected === 'identity') functionArgs.renderSelected = identity

  const onChangeHandler = (item) => {
    setValue(item)
    onChange(item)
  }

  return (
    <Select
      {...args}
      {...functionArgs}
      onChange={onChangeHandler}
      value={value}
    />
  )
}

Template.propTypes = {
  renderItem: PropTypes.func,
  renderSelected: PropTypes.func,
  onChange: PropTypes.func,
}

export const SimpleSelect = Template.bind({})
SimpleSelect.args = {
  items: [`Don't forget EQ`, `Yeehaw`, `Scarlett Dawn`],
}

export const SimpleSelectWithRenderItem = Template.bind({})
SimpleSelectWithRenderItem.args = {
  ...SimpleSelect.args,
  renderItem: (item, { isSelected, isHover, placeholder }) => (
    <span>
      {isSelected || isHover ? '👨🏼‍🎤' : '👩🏼‍🎤'} {item || placeholder}
    </span>
  ),
}

export const SimpleSelectWithRenderSelected = Template.bind({})
SimpleSelectWithRenderSelected.args = {
  ...SimpleSelect.args,
  renderSelected: (item, { placeholder }) => (
    <span>👨🏼‍🎤 {item || placeholder}</span>
  ),
}

export const complexSelectWithAll = Template.bind({})
complexSelectWithAll.args = {
  ...SimpleSelect.args,
  items: [
    { foo: 'Hello', bar: '!' },
    { foo: 'This', bar: 'Is' },
    { foo: 'An', bar: 'Example' },
  ],
  // eslint-disable-next-line react/display-name
  renderItem: (obj) => <span>Passed: {JSON.stringify(obj)}</span>,
  // eslint-disable-next-line react/display-name
  renderSelected: (obj) => <span>‍Passed: {JSON.stringify(obj)}</span>,
}

export const complexSelect = Template.bind({})
complexSelect.args = {
  ...SimpleSelect.args,
  items: [
    { foo: 'Hello', bar: '!' },
    { foo: 'This', bar: 'Is' },
    { foo: 'An', bar: 'Example' },
  ],
  // eslint-disable-next-line react/display-name
  renderItem: (obj) => <span>Passed: {JSON.stringify(obj)}</span>,
}

export default {
  title: 'old_ui/Components/Select',
  component: Select,
  argTypes: {
    onChange: { action: 'onChange' },
  },
}
