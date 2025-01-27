import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route } from 'react-router-dom'

import { TierNames } from 'services/tier'
import { useFlags } from 'shared/featureFlags'
import { ComparisonReturnType } from 'shared/utils/comparison'

import PullRequestPageContent from './PullCoverage'

jest.mock('./Summary', () => () => <div>CompareSummary</div>)
jest.mock('../FirstPullBanner', () => () => <div>FirstPullBanner</div>)
jest.mock('./PullCoverageTabs', () => () => 'PullCoverageTabs')

jest.mock('./routes/FilesChangedTab', () => () => <div>FilesChangedTab</div>)
jest.mock('./routes/IndirectChangesTab', () => () => (
  <div>IndirectChangesTab</div>
))
jest.mock('./routes/CommitsTab', () => () => <div>CommitsTab</div>)
jest.mock('./routes/FlagsTab', () => () => <div>FlagsTab</div>)
jest.mock('./routes/FileExplorer', () => () => <div>FileExplorer</div>)
jest.mock('./routes/FileViewer', () => () => <div>FileViewer</div>)
jest.mock('./routes/ComponentsTab', () => () => <div>ComponentsTab</div>)

jest.mock('shared/featureFlags')

const mockPullData = (resultType) => {
  if (resultType === ComparisonReturnType.MISSING_BASE_COMMIT) {
    return {
      owner: {
        repository: {
          __typename: 'Repository',
          coverageEnabled: true,
          bundleAnalysisEnabled: true,
          pull: {
            pullId: 1,
            head: {
              commitid: '123',
            },
            compareWithBase: {
              __typename: resultType,
              message: resultType,
            },
          },
        },
      },
    }
  }

  return {
    owner: {
      repository: {
        __typename: 'Repository',
        coverageEnabled: true,
        bundleAnalysisEnabled: true,
        pull: {
          pullId: 1,
          head: {
            commitid: '123',
          },
          compareWithBase: {
            __typename: resultType,
            impactedFilesCount: 2,
            indirectChangedFilesCount: 3,
            directChangedFilesCount: 4,
            flagComparisonsCount: 5,
            componentComparisonsCount: 6,
          },
        },
      },
    },
  }
}

const mockPullDataTeam = {
  owner: {
    isCurrentUserPartOfOrg: true,
    repository: {
      __typename: 'Repository',
      coverageEnabled: true,
      bundleAnalysisEnabled: true,
      pull: {
        pullId: 1,
        head: {
          commitid: '123',
        },
        compareWithBase: {
          __typename: ComparisonReturnType.SUCCESSFUL_COMPARISON,
          impactedFilesCount: 2,
          directChangedFilesCount: 4,
        },
      },
    },
  },
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})
const server = setupServer()

const wrapper =
  (initialEntries = '/gh/codecov/test-repo/pull/1') =>
  ({ children }) =>
    (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntries]}>
          <Route
            path={[
              '/:provider/:owner/:repo/pull/:pullId/blob/:path+',
              '/:provider/:owner/:repo/pull/:pullId/tree/:path+',
              '/:provider/:owner/:repo/pull/:pullId/tree/',
              '/:provider/:owner/:repo/pull/:pullId',
            ]}
          >
            {children}
          </Route>
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

describe('PullRequestPageContent', () => {
  function setup(
    resultType = ComparisonReturnType.SUCCESSFUL_COMPARISON,
    tierValue = TierNames.BASIC
  ) {
    useFlags.mockReturnValue({
      multipleTiers: true,
    })
    server.use(
      graphql.query('PullPageData', (req, res, ctx) => {
        if (req.variables.isTeamPlan) {
          return res(ctx.status(200), ctx.data(mockPullDataTeam))
        }
        return res(ctx.status(200), ctx.data(mockPullData(resultType)))
      }),
      graphql.query('GetRepoSettings', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.data({
            owner: { repository: { private: true } },
          })
        )
      }),
      graphql.query('OwnerTier', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.data({
            owner: { plan: { tierName: tierValue } },
          })
        )
      })
    )
  }

  it('renders the compare summary', async () => {
    setup(ComparisonReturnType.SUCCESSFUL_COMPARISON)

    render(<PullRequestPageContent />, {
      wrapper: wrapper(),
    })

    const compareSummary = await screen.findByText('CompareSummary')
    expect(compareSummary).toBeInTheDocument()
  })

  describe('result type was not successful', () => {
    beforeEach(() => setup(ComparisonReturnType.MISSING_BASE_COMMIT))

    it('renders an error banner', async () => {
      render(<PullRequestPageContent />, { wrapper: wrapper() })

      const errorBanner = await screen.findByRole('heading', {
        name: 'Missing Base Commit',
      })
      expect(errorBanner).toBeInTheDocument()
    })
  })

  describe('result type is first pull request', () => {
    beforeEach(() => setup(ComparisonReturnType.FIRST_PULL_REQUEST))

    it('does not render the error banner', () => {
      render(<PullRequestPageContent />, { wrapper: wrapper() })

      const errorBanner = screen.queryByRole('heading', {
        name: 'Missing Base Commit',
      })
      expect(errorBanner).not.toBeInTheDocument()
    })
  })

  describe('result type was successful', () => {
    beforeEach(() => setup())

    describe('on the indirect changes path', () => {
      it('renders indirect changes tab', async () => {
        render(<PullRequestPageContent />, {
          wrapper: wrapper('/gh/codecov/test-repo/pull/1/indirect-changes'),
        })

        const indirectChanges = await screen.findByText('IndirectChangesTab')
        expect(indirectChanges).toBeInTheDocument()
      })
    })

    describe('on the commits path', () => {
      it('renders the commits tab', async () => {
        render(<PullRequestPageContent />, {
          wrapper: wrapper('/gh/codecov/test-repo/pull/1/commits'),
        })

        const commitsTab = await screen.findByText('CommitsTab')
        expect(commitsTab).toBeInTheDocument()
      })
    })

    describe('on the flags path', () => {
      it('renders the flags tab', async () => {
        render(<PullRequestPageContent />, {
          wrapper: wrapper('/gh/codecov/test-repo/pull/1/flags'),
        })

        const flagsTab = await screen.findByText('FlagsTab')
        expect(flagsTab).toBeInTheDocument()
      })
    })

    describe('on the components path', () => {
      it('renders the components tab', async () => {
        render(<PullRequestPageContent />, {
          wrapper: wrapper('/gh/codecov/test-repo/pull/1/components'),
        })

        const componentsTab = await screen.findByText('ComponentsTab')
        expect(componentsTab).toBeInTheDocument()
      })
    })

    describe('on the root path', () => {
      it('renders files changed tab', async () => {
        render(<PullRequestPageContent />, { wrapper: wrapper() })

        const filesChangedTab = await screen.findByText('FilesChangedTab')
        expect(filesChangedTab).toBeInTheDocument()
      })
    })

    describe('on a random path', () => {
      it('redirects to the files changed tab', async () => {
        render(<PullRequestPageContent />, {
          wrapper: wrapper('/gh/codecov/test-repo/pull/1/blah'),
        })

        const filesChangedTab = await screen.findByText('FilesChangedTab')
        expect(filesChangedTab).toBeInTheDocument()
      })
    })
  })

  describe('testing tree route', () => {
    beforeEach(() => setup())

    describe('not path provided', () => {
      it('renders FileExplorer', async () => {
        render(<PullRequestPageContent />, {
          wrapper: wrapper('/gh/codecov/test-repo/pull/1/tree'),
        })

        const fileExplorer = await screen.findByText('FileExplorer')
        expect(fileExplorer).toBeInTheDocument()
      })
    })

    describe('path provided', () => {
      it('renders FileExplorer', async () => {
        render(<PullRequestPageContent />, {
          wrapper: wrapper('/gh/codecov/test-repo/pull/1/tree/src/dir'),
        })

        const fileExplorer = await screen.findByText('FileExplorer')
        expect(fileExplorer).toBeInTheDocument()
      })
    })
  })

  describe('testing blob path', () => {
    it('renders FileViewer', async () => {
      setup()

      render(<PullRequestPageContent />, {
        wrapper: wrapper('/gh/codecov/test-repo/pull/1/blob/src/file.js'),
      })

      const fileViewer = await screen.findByText('FileViewer')
      expect(fileViewer).toBeInTheDocument()
    })
  })

  describe('user is on team plan', () => {
    it('returns a valid response', async () => {
      setup(ComparisonReturnType.SUCCESSFUL_COMPARISON, TierNames.TEAM)

      render(<PullRequestPageContent />, {
        wrapper: wrapper(),
      })

      const filesChangedTab = await screen.findByText('FilesChangedTab')
      expect(filesChangedTab).toBeInTheDocument()
    })
  })
})
