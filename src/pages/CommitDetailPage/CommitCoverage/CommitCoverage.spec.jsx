import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { Suspense } from 'react'
import { MemoryRouter, Route } from 'react-router-dom'

import { TierNames } from 'services/tier/useTier'
import { UploadStateEnum } from 'shared/utils/commit'

import CommitCoverage from './CommitCoverage'

jest.mock('./BotErrorBanner', () => () => <div>BotErrorBanner</div>)
jest.mock('./YamlErrorBanner', () => () => <div>YamlErrorBanner</div>)
jest.mock('./routes/FilesChangedTab', () => () => <div>FilesChangedTab</div>)
jest.mock('./UploadsCard', () => () => <div>UploadsCard</div>)
jest.mock('./routes/IndirectChangesTab', () => () => (
  <div>IndirectChangesTab</div>
))
jest.mock('./CommitCoverageSummary', () => () => (
  <div>CommitCoverageSummary</div>
))
jest.mock('./routes/CommitDetailFileExplorer', () => () => (
  <div>CommitDetailFileExplorer</div>
))
jest.mock('./routes/CommitDetailFileViewer', () => () => (
  <div>CommitDetailFileViewer</div>
))

const mockCommitData = {
  owner: {
    repository: {
      __typename: 'Repository',
      commit: {
        branchName: null,
        totals: {
          coverage: 38.30846,
          diff: {
            coverage: null,
          },
        },
        commitid: 'f00162848a3cebc0728d915763c2fd9e92132408',
        pullId: 10,
        createdAt: '2020-08-25T16:35:32',
        author: {
          username: 'febg',
        },
        state: 'complete',
        uploads: {
          edges: [
            {
              node: {
                id: 0,
                state: 'PROCESSED',
                provider: 'travis',
                createdAt: '2020-08-25T16:36:19.55947400:00',
                updatedAt: '2020-08-25T16:36:19.67986800:00',
                flags: [],
                downloadUrl:
                  '/api/gh/febg/repo-test/download/build?path=v4/raw/2020-08-25/F84D6D9A7F883055E40E3B380280BC44/f00162848a3cebc0728d915763c2fd9e92132408/30582d33-de37-4272-ad50-c4dc805802fb.txt',
                ciUrl: 'https://travis-ci.com/febg/repo-test/jobs/721065746',
                uploadType: 'UPLOADED',
                errors: null,
                name: 'upload name',
                jobCode: null,
                buildCode: null,
              },
            },
          ],
        },
        message: 'paths test',
        ciPassed: true,
        compareWithParent: {
          __typename: 'Comparison',
          state: 'pending',
          indirectChangedFilesCount: 1,
          directChangedFilesCount: 1,
          patchTotals: null,
          impactedFiles: {
            __typename: 'ImpactedFiles',
            results: [],
          },
        },
        parent: {
          commitid: 'd773f5bc170caec7f6e64420b0967e7bac978a8f',
          totals: {
            coverage: 38.30846,
          },
        },
      },
    },
  },
}

const mockErroredUploads = {
  owner: {
    repository: {
      __typename: 'Repository',
      commit: {
        branchName: null,
        totals: {
          coverage: 38.30846,
          diff: {
            coverage: null,
          },
        },
        commitid: 'f00162848a3cebc0728d915763c2fd9e92132408',
        pullId: 10,
        createdAt: '2020-08-25T16:35:32',
        author: {
          username: 'febg',
        },
        state: 'complete',
        uploads: {
          edges: [
            {
              node: {
                id: 0,
                state: UploadStateEnum.error,
                provider: 'travis',
                createdAt: '2020-08-25T16:36:19.55947400:00',
                updatedAt: '2020-08-25T16:36:19.67986800:00',
                flags: [],
                downloadUrl:
                  '/api/gh/febg/repo-test/download/build?path=v4/raw/2020-08-25/F84D6D9A7F883055E40E3B380280BC44/f00162848a3cebc0728d915763c2fd9e92132408/30582d33-de37-4272-ad50-c4dc805802fb.txt',
                ciUrl: 'https://travis-ci.com/febg/repo-test/jobs/721065746',
                uploadType: 'UPLOADED',
                errors: null,
                name: 'upload name',
                jobCode: null,
                buildCode: null,
              },
            },
          ],
        },
        message: 'paths test',
        ciPassed: true,
        compareWithParent: {
          __typename: 'Comparison',
          state: 'pending',
          indirectChangedFilesCount: 1,
          directChangedFilesCount: 1,
          patchTotals: null,
          impactedFiles: {
            __typename: 'ImpactedFiles',
            results: [],
          },
        },
        parent: {
          commitid: 'd773f5bc170caec7f6e64420b0967e7bac978a8f',
          totals: {
            coverage: 38.30846,
          },
        },
      },
    },
  },
}

const mockRepoSettingsTeamData = (isPrivate = false) => ({
  owner: {
    repository: {
      defaultBranch: 'master',
      private: isPrivate,
      uploadToken: 'token',
      graphToken: 'token',
      yaml: 'yaml',
      bot: {
        username: 'test',
      },
    },
  },
})

const mockOwnerTier = (tier = TierNames.PRO) => ({
  owner: {
    plan: {
      tierName: tier,
    },
  },
})

const mockRepoBackfilledData = {
  config: {
    isTimescaleEnabled: false,
  },
  owner: {
    repository: {
      flagsMeasurementsActive: false,
      flagsMeasurementsBackfilled: false,
      flagsCount: 0,
    },
  },
}

const mockCommitErrors = (hasErrors = false) => {
  const yamlErrors = []
  const botErrors = []

  if (hasErrors) {
    yamlErrors.push({ node: { errorCode: 'invalid_yaml' } })
    botErrors.push({ node: { errorCode: 'repo_bot_invalid' } })
  }

  return {
    owner: {
      repository: {
        commit: {
          yamlErrors: {
            edges: yamlErrors,
          },
          botErrors: {
            edges: botErrors,
          },
        },
      },
    },
  }
}

const mockCompareTotals = {
  owner: {
    repository: {
      __typename: 'Repository',
      commit: {
        compareWithParent: {
          __typename: 'Comparison',
          state: 'pending',
          patchTotals: null,
          impactedFiles: [],
        },
      },
    },
  },
}

const mockOwnerData = {
  owner: {
    orgUploadToken: null,
    ownerid: 123,
    username: 'codecov',
    avatarUrl: 'http://127.0.0.1/avatar-url',
    isCurrentUserPartOfOrg: true,
    isAdmin: false,
  },
}

const mockCommitComponentData = {
  owner: {
    repository: {
      __typename: 'Repository',
      commit: {
        components: [],
      },
    },
  },
}

const mockCommitPageData = (
  hasCommitPageDataError = false,
  hasFirstPR = false
) => ({
  owner: {
    isCurrentUserPartOfOrg: true,
    repository: {
      __typename: 'Repository',
      bundleAnalysisEnabled: true,
      coverageEnabled: true,
      commit: {
        commitid: 'id-1',
        compareWithParent: {
          __typename: hasCommitPageDataError
            ? 'MissingBaseCommit'
            : hasFirstPR
            ? 'FirstPullRequest'
            : 'Comparison',
        },
        bundleAnalysisCompareWithParent: {
          __typename: 'BundleAnalysisComparison',
        },
      },
    },
  },
})

const server = setupServer()

const wrapper =
  ({
    queryClient,
    initialEntries = '/gh/test-org/test-repo/commit/1234567890abcdef',
    path = '/:provider/:owner/:repo/commit/:commit',
  }) =>
  ({ children }) =>
    (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntries]}>
          <Route path={path}>
            <Suspense fallback={<p>Loading</p>}>{children}</Suspense>
          </Route>
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

describe('CommitCoverage', () => {
  function setup(
    {
      isPrivate = false,
      tierName = TierNames.PRO,
      hasCommitErrors = false,
      hasErroredUploads = false,
      hasCommitPageDataError = false,
      hasFirstPR = false,
    } = {
      isPrivate: false,
      tierName: TierNames.PRO,
      hasCommitErrors: false,
      hasErroredUploads: false,
      hasCommitPageDataError: false,
      hasFirstPR: false,
    }
  ) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          suspense: true,
        },
      },
    })

    server.use(
      graphql.query('Commit', (req, res, ctx) => {
        if (hasErroredUploads) {
          return res(ctx.status(200), ctx.data(mockErroredUploads))
        }

        return res(ctx.status(200), ctx.data(mockCommitData))
      }),
      graphql.query('GetRepoSettingsTeam', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.data(mockRepoSettingsTeamData(isPrivate))
        )
      }),
      graphql.query('OwnerTier', (req, res, ctx) => {
        return res(ctx.status(200), ctx.data(mockOwnerTier(tierName)))
      }),
      graphql.query('BackfillFlagMemberships', (req, res, ctx) => {
        return res(ctx.status(200), ctx.data(mockRepoBackfilledData))
      }),
      graphql.query('CommitErrors', (req, res, ctx) => {
        return res(ctx.status(200), ctx.data(mockCommitErrors(hasCommitErrors)))
      }),
      graphql.query('DetailOwner', (req, res, ctx) => {
        return res(ctx.status(200), ctx.data(mockOwnerData))
      }),
      graphql.query('CompareTotals', (req, res, ctx) => {
        return res(ctx.status(200), ctx.data(mockCompareTotals))
      }),
      graphql.query('CommitComponents', (req, res, ctx) => {
        return res(ctx.status(200), ctx.data(mockCommitComponentData))
      }),
      graphql.query('CommitPageData', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.data(mockCommitPageData(hasCommitPageDataError, hasFirstPR))
        )
      })
    )

    return { queryClient }
  }

  describe('testing different routes', () => {
    describe('/:provider/:owner/:repo/commit/:commit', () => {
      it('renders files changed tab', async () => {
        const { queryClient } = setup()
        render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

        const filesChangedTab = await screen.findByText('FilesChangedTab')
        expect(filesChangedTab).toBeInTheDocument()
      })
    })

    describe('/:provider/:owner/:repo/commit/:commit/indirect-changes', () => {
      it('renders indirect changes tab', async () => {
        const { queryClient } = setup()
        render(<CommitCoverage />, {
          wrapper: wrapper({
            queryClient,
            path: '/:provider/:owner/:repo/commit/:commit/indirect-changes',
            initialEntries:
              '/gh/test-org/test-repo/commit/1234567890abcdef/indirect-changes',
          }),
        })

        const indirectChangesTab = await screen.findByText('IndirectChangesTab')
        expect(indirectChangesTab).toBeInTheDocument()
      })
    })

    describe('/:provider/:owner/:repo/commit/:commit/tree/', () => {
      it('renders commit detail file explorer', async () => {
        const { queryClient } = setup()
        render(<CommitCoverage />, {
          wrapper: wrapper({
            queryClient,
            path: '/:provider/:owner/:repo/commit/:commit/tree/',
            initialEntries:
              '/gh/test-org/test-repo/commit/1234567890abcdef/tree',
          }),
        })

        const fileExplorer = await screen.findByText('CommitDetailFileExplorer')
        expect(fileExplorer).toBeInTheDocument()
      })
    })

    describe('/:provider/:owner/:repo/commit/:commit/tree/:path+', () => {
      it('renders commit detail file explorer', async () => {
        const { queryClient } = setup()
        render(<CommitCoverage />, {
          wrapper: wrapper({
            queryClient,
            path: '/:provider/:owner/:repo/commit/:commit/tree/:path+',
            initialEntries:
              '/gh/test-org/test-repo/commit/1234567890abcdef/tree/src/',
          }),
        })

        const fileExplorer = await screen.findByText('CommitDetailFileExplorer')
        expect(fileExplorer).toBeInTheDocument()
      })
    })

    describe('/:provider/:owner/:repo/commit/:commit/blob/:path+', () => {
      it('renders commit detail file viewer', async () => {
        const { queryClient } = setup()
        render(<CommitCoverage />, {
          wrapper: wrapper({
            queryClient,
            path: '/:provider/:owner/:repo/commit/:commit/blob/:path+',
            initialEntries:
              '/gh/test-org/test-repo/commit/1234567890abcdef/blob/src/index.js',
          }),
        })

        const fileViewer = await screen.findByText('CommitDetailFileViewer')
        expect(fileViewer).toBeInTheDocument()
      })
    })
  })

  describe('there are no errored uploads', () => {
    describe('rendering uploads card', () => {
      it('renders uploads card', async () => {
        const { queryClient } = setup()
        render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

        const uploadsCard = await screen.findByText('UploadsCard')
        expect(uploadsCard).toBeInTheDocument()
      })
    })

    describe('user is on a team plan', () => {
      it('does not render commit coverage summary', async () => {
        const { queryClient } = setup({
          tierName: TierNames.TEAM,
          isPrivate: true,
        })
        render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

        const loader = await screen.findByText('Loading')
        await waitForElementToBeRemoved(loader)

        const coverageSummary = screen.queryByText('CommitCoverageSummary')
        expect(coverageSummary).not.toBeInTheDocument()
      })

      it('does not render indirect changes tab', async () => {
        const { queryClient } = setup({
          tierName: TierNames.TEAM,
          isPrivate: true,
        })
        render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

        const loader = await screen.findByText('Loading')
        await waitForElementToBeRemoved(loader)

        const indirectChangesTab = screen.queryByText(/Indirect changes/)
        expect(indirectChangesTab).not.toBeInTheDocument()
      })
    })
  })

  describe('there are bot errors', () => {
    it('renders commit summary', async () => {
      const { queryClient } = setup({ hasErroredUploads: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const commitCoverageSummary = await screen.findByText(
        'CommitCoverageSummary'
      )
      expect(commitCoverageSummary).toBeInTheDocument()
    })

    it('renders uploads card', async () => {
      const { queryClient } = setup({ hasErroredUploads: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const uploadsCard = await screen.findByText('UploadsCard')
      expect(uploadsCard).toBeInTheDocument()
    })

    it('renders bot error banner', async () => {
      const { queryClient } = setup({ hasCommitErrors: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const botErrorBanner = await screen.findByText('BotErrorBanner')
      expect(botErrorBanner).toBeInTheDocument()
    })
  })

  describe('there are yaml errors', () => {
    it('renders commit summary', async () => {
      const { queryClient } = setup({ hasErroredUploads: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const commitCoverageSummary = await screen.findByText(
        'CommitCoverageSummary'
      )
      expect(commitCoverageSummary).toBeInTheDocument()
    })

    it('renders uploads card', async () => {
      const { queryClient } = setup({ hasErroredUploads: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const uploadsCard = await screen.findByText('UploadsCard')
      expect(uploadsCard).toBeInTheDocument()
    })

    it('renders yaml error banner', async () => {
      const { queryClient } = setup({ hasCommitErrors: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const yamlErrorBanner = await screen.findByText('YamlErrorBanner')
      expect(yamlErrorBanner).toBeInTheDocument()
    })
  })

  describe('there are errored uploads', () => {
    it('renders commit summary', async () => {
      const { queryClient } = setup({ hasErroredUploads: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const commitCoverageSummary = await screen.findByText(
        'CommitCoverageSummary'
      )
      expect(commitCoverageSummary).toBeInTheDocument()
    })

    it('renders uploads card', async () => {
      const { queryClient } = setup({ hasErroredUploads: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const uploadsCard = await screen.findByText('UploadsCard')
      expect(uploadsCard).toBeInTheDocument()
    })

    it('renders error uploads component', async () => {
      const { queryClient } = setup({ hasErroredUploads: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const erroredUploads = await screen.findByText(
        /The following uploads failed to process:/
      )
      expect(erroredUploads).toBeInTheDocument()
    })
  })

  describe('comparison returns first pull request', () => {
    it('renders first pull banner', async () => {
      const { queryClient } = setup({ hasFirstPR: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const firstPullRequest = await screen.findByText(/Welcome to Codecov/)
      expect(firstPullRequest).toBeInTheDocument()
    })
  })

  describe('commit has errors', () => {
    it('renders error banner', async () => {
      const { queryClient } = setup({ hasCommitPageDataError: true })
      render(<CommitCoverage />, { wrapper: wrapper({ queryClient }) })

      const missingBaseCommit = await screen.findByText(/Missing Base Commit/)
      expect(missingBaseCommit).toBeInTheDocument()
    })
  })
})
