import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route } from 'react-router-dom'

import OwnerPage from './OwnerPage'

jest.mock('./Header', () => () => 'Header')
jest.mock('./Tabs', () => () => 'Tabs')
jest.mock('shared/ListRepo', () => () => 'ListRepo')

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})
const server = setupServer()

let testLocation
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/gh/codecov']}>
      <Route path="/:provider/:owner">{children}</Route>
      <Route
        path="*"
        render={({ location }) => {
          testLocation = location
          return null
        }}
      />
    </MemoryRouter>
  </QueryClientProvider>
)

beforeAll(() => {
  server.listen()
})
afterEach(() => {
  queryClient.clear()
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})

describe('OwnerPage', () => {
  function setup(
    { owner, successfulMutation = true } = {
      owner: null,
      successfulMutation: true,
    }
  ) {
    server.use(
      graphql.query('OwnerPageData', (req, res, ctx) =>
        res(ctx.status(200), ctx.data({ owner }))
      ),
      graphql.mutation('SendSentryToken', (req, res, ctx) => {
        if (!successfulMutation) {
          return res(
            ctx.status(200),
            ctx.data({
              saveSentryState: {
                error: {
                  __typename: 'ValidationError',
                  message: 'validation error',
                },
              },
            })
          )
        }

        return res(ctx.status(200), ctx.data({ saveSentryState: null }))
      })
    )
  }

  describe('when the owner exists', () => {
    it('renders the header', async () => {
      setup({
        owner: {
          username: 'codecov',
          isCurrentUserPartOfOrg: true,
        },
      })

      render(<OwnerPage />, { wrapper })
      const header = await screen.findByText(/Header/)
      expect(header).toBeInTheDocument()
    })

    it('renders the tabs', async () => {
      setup({
        owner: {
          username: 'codecov',
          isCurrentUserPartOfOrg: true,
        },
      })

      render(<OwnerPage />, { wrapper })

      const tabs = await screen.findByText(/Tabs/)
      expect(tabs).toBeInTheDocument()
    })

    it('renders the ListRepo', async () => {
      setup({
        owner: {
          username: 'codecov',
          isCurrentUserPartOfOrg: true,
        },
      })

      render(<OwnerPage />, { wrapper })

      const listRepo = await screen.findByText(/ListRepo/)
      expect(listRepo).toBeInTheDocument()
    })

    describe('sentry token is present in local storage', () => {
      describe('it successfully validates token', () => {
        it('redirects to plan page', async () => {
          setup({
            owner: {
              username: 'codecov',
              isCurrentUserPartOfOrg: true,
            },
          })

          localStorage.setItem('sentry-token', 'super-cool-token')

          render(<OwnerPage />, { wrapper })

          await waitFor(() => expect(testLocation.pathname).toBe('/plan/gh'))
        })
      })

      describe('it does not successfully validate token', () => {
        it('does not redirect user', async () => {
          setup({
            owner: {
              username: 'codecov',
              isCurrentUserPartOfOrg: true,
            },
            successfulMutation: false,
          })

          render(<OwnerPage />, { wrapper })

          await waitFor(() => expect(testLocation.pathname).toBe('/gh/codecov'))
        })
      })
    })
  })

  describe('when the owner does not exist', () => {
    beforeEach(() => {
      setup({ owner: null })
    })

    it('does not render the header', () => {
      render(<OwnerPage />, { wrapper })
      expect(screen.queryByText(/Header/)).not.toBeInTheDocument()
    })

    it('does not renders the tabs', () => {
      render(<OwnerPage />, { wrapper })
      expect(screen.queryByText(/Tabs/)).not.toBeInTheDocument()
    })

    it('does not render the ListRepo', () => {
      render(<OwnerPage />, { wrapper })
      expect(screen.queryByText(/ListRepo/)).not.toBeInTheDocument()
    })
  })

  describe('when user is not part of the org', () => {
    beforeEach(() => {
      setup({
        owner: {
          username: 'codecov',
          isCurrentUserPartOfOrg: false,
        },
      })
    })

    it('does not render links to the settings', () => {
      render(<OwnerPage />, { wrapper })
      expect(screen.queryByText(/Tabs/)).not.toBeInTheDocument()
    })
  })
})
