import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { mockIsIntersecting } from 'react-intersection-observer/test-utils'
import { MemoryRouter, Route } from 'react-router-dom'

import PullsTableTeam from './PullsTableTeam'

const node1 = {
  pullId: 1,
  title: 'first pull',
  state: 'MERGED',
  updatestamp: '2023-10-11T00:00.000000',
  author: {
    username: 'codecov-user',
    avatarUrl: 'http://127.0.0.1/avatar-url',
  },
  compareWithBase: {
    __typename: 'Comparison',
    patchTotals: {
      percentCovered: 75,
    },
  },
}

const node2 = {
  pullId: 2,
  title: 'second pull',
  state: 'MERGED',
  updatestamp: '2023-10-12T00:00.000000',
  author: {
    username: 'codecov-user',
    avatarUrl: 'http://127.0.0.1/avatar-url',
  },
  compareWithBase: {
    __typename: 'Comparison',
    patchTotals: {
      percentCovered: 87,
    },
  },
}

const node3 = {
  pullId: 3,
  title: 'third pull',
  state: 'MERGED',
  updatestamp: '2023-10-13T00:00.000000',
  author: {
    username: 'codecov-user',
    avatarUrl: 'http://127.0.0.1/avatar-url',
  },
  compareWithBase: {
    __typename: 'Comparison',
    patchTotals: {
      percentCovered: 92,
    },
  },
}

const server = setupServer()
const wrapper =
  (queryClient: QueryClient): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/gh/codecov/cool-repo/pulls']}>
          <Route path="/:provider/:owner/:repo/pulls">{children}</Route>
        </MemoryRouter>
      </QueryClientProvider>
    )

beforeAll(() => {
  server.listen()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

interface SetupArgs {
  noEntries?: boolean
}

describe('PullsTableTeam', () => {
  function setup({ noEntries = false }: SetupArgs) {
    const queryClient = new QueryClient()

    server.use(
      graphql.query('GetPullsTeam', (req, res, ctx) => {
        if (noEntries) {
          return res(
            ctx.status(200),
            ctx.data({
              owner: {
                repository: {
                  __typename: 'Repository',
                  pulls: {
                    edges: [],
                    pageInfo: {
                      hasNextPage: false,
                      endCursor: null,
                    },
                  },
                },
              },
            })
          )
        }

        return res(
          ctx.status(200),
          ctx.data({
            owner: {
              repository: {
                __typename: 'Repository',
                pulls: {
                  edges: req.variables.after
                    ? [
                        {
                          node: node3,
                        },
                      ]
                    : [
                        {
                          node: node1,
                        },
                        {
                          node: node2,
                        },
                      ],
                  pageInfo: {
                    hasNextPage: req.variables.after ? false : true,
                    endCursor: req.variables.after
                      ? 'aa'
                      : 'MjAyMC0wOC0xMSAxNzozMDowMiswMDowMHwxMDA=',
                  },
                },
              },
            },
          })
        )
      })
    )

    return { queryClient }
  }

  describe('renders table headers', () => {
    it('renders name column', async () => {
      const { queryClient } = setup({})
      render(<PullsTableTeam />, { wrapper: wrapper(queryClient) })

      const nameColumn = await screen.findByText('Name')
      expect(nameColumn).toBeInTheDocument()
    })

    it('renders patch column', async () => {
      const { queryClient } = setup({})
      render(<PullsTableTeam />, { wrapper: wrapper(queryClient) })

      const patchColumn = await screen.findByText('Patch %')
      expect(patchColumn).toBeInTheDocument()
    })
  })

  describe('renders table body', () => {
    it('renders name column', async () => {
      const { queryClient } = setup({})
      render(<PullsTableTeam />, { wrapper: wrapper(queryClient) })

      const title = await screen.findByText('first pull')
      expect(title).toBeInTheDocument()
    })

    it('renders patch column', async () => {
      const { queryClient } = setup({})
      render(<PullsTableTeam />, { wrapper: wrapper(queryClient) })

      const patch = await screen.findByText('87.00%')
      expect(patch).toBeInTheDocument()
    })
  })

  describe('no data is returned', () => {
    it('renders error message', async () => {
      const { queryClient } = setup({ noEntries: true })
      render(<PullsTableTeam />, { wrapper: wrapper(queryClient) })

      const errorMessage = await screen.findByText('No pulls found')
      expect(errorMessage).toBeInTheDocument()
    })
  })

  describe('infinite scrolling', () => {
    it('loads next page', async () => {
      const { queryClient } = setup({})
      render(<PullsTableTeam />, { wrapper: wrapper(queryClient) })

      const loading = await screen.findByText('Loading')
      mockIsIntersecting(loading, true)
      await waitForElementToBeRemoved(loading)

      const thirdPR = await screen.findByText('third pull')
      expect(thirdPR).toBeInTheDocument()
    })
  })
})
