import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { MemoryRouter, Route } from 'react-router-dom'

import { useCommitBasedCoverageForFileViewer } from 'services/file'
import { useOwner } from 'services/user'

import FileView from './FileView'

jest.mock(
  'ui/FileViewer/ToggleHeader/ToggleHeader',
  () => () => 'The Fileviewer Toggle Header'
)
jest.mock(
  'ui/CodeRendererProgressHeader/CodeRendererProgressHeader',
  () => () => 'The Progress Header for Coderenderer'
)
jest.mock('shared/FileViewer/CodeRenderer', () => () => 'The Coderenderer')
jest.mock('services/file/hooks')
jest.mock('services/user')

const queryClient = new QueryClient()

describe('FileView', () => {
  function setup({ content, owner }) {
    useOwner.mockReturnValue({
      data: owner,
    })

    useCommitBasedCoverageForFileViewer.mockReturnValue({
      isLoading: false,
      totals: 53.43,
      coverage: {
        1: 'H',
        2: 'H',
        5: 'H',
        6: 'H',
        9: 'H',
        10: 'H',
        13: 'M',
        14: 'P',
        15: 'M',
        16: 'M',
        17: 'M',
        21: 'H',
      },
      flagNames: ['flagOne', 'flagTwo'],
      content,
    })

    render(
      <MemoryRouter
        initialEntries={[
          '/gh/criticalrole/mightynein/blob/19236709182orym9234879/folder/subfolder/file.js',
        ]}
      >
        <Route path="/:provider/:owner/:repo/blob/:ref/*">
          <QueryClientProvider client={queryClient}>
            <FileView />
          </QueryClientProvider>
        </Route>
      </MemoryRouter>
    )
  }

  describe('when there is content to be shown', () => {
    beforeEach(() => {
      const content =
        'function add(a, b) {\n    return a + b;\n}\n\nfunction subtract(a, b) {\n    return a - b;\n}\n\nfunction multiply(a, b) {\n    return a * b;\n}\n\nfunction divide(a, b) {\n    if (b !== 0) {\n        return a / b;\n    } else {\n        return 0\n    }\n}\n\nmodule.exports = {add, subtract, multiply, divide};'
      const owner = {
        username: 'criticalrole',
        isCurrentUserPartOfOrg: true,
      }
      setup({ content, owner })
    })

    it('renders the Breadcrumbs, Fileviewer Header, Coderenderer Header, and Coderenderer', () => {
      expect(screen.getByText(/criticalrole/)).toBeInTheDocument()
      expect(screen.getByText(/mightynein/)).toBeInTheDocument()
      expect(screen.getByText(/19236709182orym9234879/)).toBeInTheDocument()
      expect(
        screen.getByText(/The Fileviewer Toggle Header/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/The Progress Header for Coderenderer/)
      ).toBeInTheDocument()
      expect(screen.getByText(/The Coderenderer/)).toBeInTheDocument()
      expect(
        screen.queryByText(
          /There was a problem getting the source code from your provider./
        )
      ).not.toBeInTheDocument()
    })
  })

  describe('when there is no owner data to be shown', () => {
    beforeEach(() => {
      setup({ owner: null })
    })

    it('renders the 404 message', () => {
      expect(screen.getByText(/Not found/)).toBeInTheDocument()
      expect(screen.getByText(/404/)).toBeInTheDocument()
    })
  })

  describe('when there is an owner but no content to be shown', () => {
    beforeEach(() => {
      const owner = {
        username: 'criticalrole',
        isCurrentUserPartOfOrg: true,
      }
      setup({ content: null, owner })
    })

    it('renders the Fileviewer Header, Coderenderer Header, and error message', () => {
      expect(
        screen.getByText(/The Fileviewer Toggle Header/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/The Progress Header for Coderenderer/)
      ).toBeInTheDocument()
      expect(screen.queryByText(/The Coderenderer/)).not.toBeInTheDocument()
      expect(
        screen.getByText(
          /There was a problem getting the source code from your provider./
        )
      ).toBeInTheDocument()
    })
  })
})
