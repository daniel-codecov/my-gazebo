import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import SidebarLayout from './SidebarLayout'
jest.mock('../shared/ErrorBoundary', () => ({ children }) => <>{children}</>)

const robinQuote = 'Holy Tintinnabulation!'
const batmanQuote =
  'Why do we fall? So that we can learn to pick ourselves back up.'

describe('SidebarLayout', () => {
  function setup(content) {
    render(
      <SidebarLayout sidebar={<div>{robinQuote}</div>}>
        {content}
      </SidebarLayout>,
      {
        wrapper: MemoryRouter,
      }
    )
  }

  describe('it renders with no children', () => {
    beforeEach(() => {
      setup()
    })

    it('renders the sidebar', () => {
      const sidebar = screen.getByText(robinQuote)
      expect(sidebar).toBeInTheDocument()
    })
  })

  describe('it renders with children', () => {
    beforeEach(() => {
      setup(<p>{batmanQuote}</p>)
    })

    it('renders the sidebar', () => {
      const sidebar = screen.getByText(robinQuote)
      expect(sidebar).toBeInTheDocument()
    })

    it('renders the content of the page (children)', () => {
      const content = screen.getByText(batmanQuote)
      expect(content).toBeInTheDocument()
    })
  })
})