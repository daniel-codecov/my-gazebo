import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route } from 'react-router-dom'

import { trackSegmentEvent } from 'services/tracking/segment'

import GitHubActions from './GitHubActions'

jest.mock('services/tracking/segment')

const mockCurrentUser = {
  me: {
    trackingMetadata: {
      ownerid: 'user-owner-id',
    },
  },
}

const mockGetRepo = {
  owner: {
    isCurrentUserPartOfOrg: true,
    repository: {
      private: false,
      uploadToken: '9e6a6189-20f1-482d-ab62-ecfaa2629295',
      defaultBranch: 'main',
      yaml: '',
      activated: false,
      oldestCommitAt: '',
    },
  },
}

const queryClient = new QueryClient()
const server = setupServer()

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/gh/codecov/cool-repo/new']}>
      <Route
        path={[
          '/:provider/:owner/:repo/new',
          '/:provider/:owner/:repo/new/other-ci',
        ]}
      >
        {children}
      </Route>
    </MemoryRouter>
  </QueryClientProvider>
)

beforeAll(() => {
  console.error = () => {}
  server.listen()
})
afterEach(() => {
  queryClient.clear()
  server.resetHandlers()
})
afterAll(() => server.close())

describe('GitHubActions', () => {
  function setup() {
    server.use(
      graphql.query('GetRepo', (req, res, ctx) =>
        res(ctx.status(200), ctx.data(mockGetRepo))
      ),
      graphql.query('CurrentUser', (req, res, ctx) =>
        res(ctx.status(200), ctx.data(mockCurrentUser))
      )
    )

    trackSegmentEvent.mockImplementation((data) => data)
  }

  describe('step one', () => {
    beforeEach(() => setup())

    it('renders header', async () => {
      render(<GitHubActions />, { wrapper })

      const header = await screen.findByRole('heading', { name: /Step 1/ })
      expect(header).toBeInTheDocument()

      const repositorySecretLink = await screen.findByRole('link', {
        name: /repository secret/,
      })
      expect(repositorySecretLink).toBeInTheDocument()
      expect(repositorySecretLink).toHaveAttribute(
        'href',
        'https://github.com/codecov/cool-repo/settings/secrets/actions'
      )
    })

    it('renders token box', async () => {
      render(<GitHubActions />, { wrapper })

      const codecovToken = await screen.findByText(/CODECOV_TOKEN/)
      expect(codecovToken).toBeInTheDocument()

      const tokenValue = await screen.findByText(
        /9e6a6189-20f1-482d-ab62-ecfaa2629295/
      )
      expect(tokenValue).toBeInTheDocument()
    })

    describe('user copies token', () => {
      it('fires segment event', async () => {
        render(<GitHubActions />, { wrapper })

        // this is needed to wait for all the data to be loaded
        const tokenValue = await screen.findByText(
          /9e6a6189-20f1-482d-ab62-ecfaa2629295/
        )
        expect(tokenValue).toBeInTheDocument()

        const buttons = await screen.findAllByTestId('clipboard')
        const button = buttons[0]

        userEvent.click(button)

        await waitFor(() => expect(trackSegmentEvent).toBeCalled())
        await waitFor(() =>
          expect(trackSegmentEvent).toBeCalledWith({
            data: {
              category: 'Onboarding',
              tokenHash: 'a2629295',
              userId: 'user-owner-id',
            },
            event: 'User Onboarding Copied CI Token',
          })
        )
      })
    })
  })

  describe('step two', () => {
    beforeEach(() => setup())

    it('renders header', async () => {
      render(<GitHubActions />, { wrapper })

      const header = await screen.findByRole('heading', { name: /Step 2/ })
      expect(header).toBeInTheDocument()

      const codecovGitHubAppLink = await screen.findByRole('link', {
        name: /Codecov's GitHub app/,
      })
      expect(codecovGitHubAppLink).toBeInTheDocument()
      expect(codecovGitHubAppLink).toHaveAttribute(
        'href',
        'https://github.com/apps/codecov'
      )
    })

    it('renders body section', async () => {
      render(<GitHubActions />, { wrapper })

      const body = await screen.findByText(/Codecov will use the/)
      expect(body).toBeInTheDocument()
    })
  })

  describe('step three', () => {
    beforeEach(() => setup())

    it('renders header', async () => {
      render(<GitHubActions />, { wrapper })

      const header = await screen.findByRole('heading', { name: /Step 3/ })
      expect(header).toBeInTheDocument()

      const gitHubActionsWorkflowLink = await screen.findByRole('link', {
        name: /GitHub Actions workflow/,
      })
      expect(gitHubActionsWorkflowLink).toBeInTheDocument()
      expect(gitHubActionsWorkflowLink).toHaveAttribute(
        'href',
        'https://github.com/codecov/cool-repo/settings/actions'
      )
    })

    it('renders yaml section', async () => {
      render(<GitHubActions />, { wrapper })

      const yamlBox = await screen.findByText(
        /Upload coverage reports to Codecov/
      )
      expect(yamlBox).toBeInTheDocument()
    })
  })

  describe('step four', () => {
    beforeEach(() => setup())

    it('renders header', async () => {
      render(<GitHubActions />, { wrapper })

      const header = await screen.findByRole('heading', { name: /Step 4/ })
      expect(header).toBeInTheDocument()
    })

    it('renders first body', async () => {
      render(<GitHubActions />, { wrapper })

      const body = await screen.findByText(/Once you've committed your changes/)
      expect(body).toBeInTheDocument()
    })

    it('renders status check image', async () => {
      render(<GitHubActions />, { wrapper })

      const img = await screen.findByRole('img', {
        name: 'codecov patch and project',
      })
      expect(img).toBeInTheDocument()
    })

    it('renders second body', async () => {
      render(<GitHubActions />, { wrapper })

      const body = await screen.findByText(/and a comment with coverage/)
      expect(body).toBeInTheDocument()
    })

    it('renders pr comment image', async () => {
      render(<GitHubActions />, { wrapper })

      const img = await screen.findByRole('img', { name: 'codecov report' })
      expect(img).toBeInTheDocument()
    })

    it('renders footer text', async () => {
      render(<GitHubActions />, { wrapper })

      const footer = await screen.findByText(/Learn more about the comment/)
      expect(footer).toBeInTheDocument()

      const footerLink = await screen.findByRole('link', { name: /here/ })
      expect(footerLink).toBeInTheDocument()
      expect(footerLink).toHaveAttribute(
        'href',
        'https://docs.codecov.com/docs/pull-request-comments#layout'
      )
    })
  })

  describe('ending', () => {
    beforeEach(() => setup())

    it('renders title', async () => {
      render(<GitHubActions />, { wrapper })

      const title = await screen.findByText(/Once steps are complete/)
      expect(title).toBeInTheDocument()
    })

    it('renders body', async () => {
      render(<GitHubActions />, { wrapper })

      const body = await screen.findByText(/How was your setup experience/)
      expect(body).toBeInTheDocument()

      const bodyLink = await screen.findByRole('link', { name: /this issue/ })
      expect(bodyLink).toHaveAttribute(
        'href',
        'https://github.com/codecov/Codecov-user-feedback/issues/18'
      )
    })
  })
})