import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { graphql, rest } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route } from 'react-router-dom'

import { useAddNotification } from 'services/toastNotification'

import RepoState from './RepoState'

jest.mock('services/toastNotification')

const queryClient = new QueryClient()
const server = setupServer()

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/gh/codecov/codecov-client/settings']}>
      <Route path="/:provider/:owner/:repo/settings">{children}</Route>
    </MemoryRouter>
  </QueryClientProvider>
)

beforeAll(() => {
  server.listen()
  console.error = () => {}
})
afterEach(() => {
  queryClient.clear()
  server.resetHandlers()
})
afterAll(() => server.close())

describe('RepoState', () => {
  const mutate = jest.fn()
  const addNotification = jest.fn()

  function setup({ activated = false, failMutation = false } = {}) {
    server.use(
      graphql.query('GetRepoSettings', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.data({
            owner: {
              repository: {
                activated,
              },
            },
          })
        )
      }),
      rest.patch(
        '/internal/github/codecov/repos/codecov-client/',
        (req, res, ctx) => {
          mutate()

          if (failMutation) {
            return res(ctx.status(500))
          }

          return res(ctx.status(200), ctx.json({}))
        }
      )
    )

    useAddNotification.mockReturnValue(addNotification)
  }

  describe('renders DeactivateRepo component', () => {
    beforeEach(() => {
      setup()
    })
    it('renders title', async () => {
      render(<RepoState />, { wrapper })

      const title = await screen.findByText(/Repo has been deactivated/)
      expect(title).toBeInTheDocument()
    })

    it('renders Activate Repo button', async () => {
      render(<RepoState />, { wrapper })

      const activationButton = await screen.findByRole('button', {
        name: 'Activate',
      })
      expect(activationButton).toBeInTheDocument()
    })
  })

  describe('when the user clicks on Activate button', () => {
    beforeEach(() => {
      setup()
    })

    it('calls the mutation', async () => {
      render(<RepoState />, { wrapper })

      const activationButton = await screen.findByRole('button', {
        name: 'Activate',
      })
      userEvent.click(activationButton)

      await waitFor(() => expect(mutate).toHaveBeenCalled())
    })
  })

  describe('when mutation data has active set to true', () => {
    beforeEach(() => {
      setup({ activated: true })
    })

    it('displays deactivate button', async () => {
      render(<RepoState />, { wrapper })

      const deactivateButton = await screen.findByTestId('deactivate-repo')
      expect(deactivateButton).toBeInTheDocument()
    })

    it('displays the warning', async () => {
      render(<RepoState />, { wrapper })

      const warning = await screen.findByText(
        'This will prevent any further uploads'
      )
      expect(warning).toBeInTheDocument()
    })

    describe('when the user clicks on Deactivate button', () => {
      it('displays Deactivate Repo Modal', async () => {
        render(<RepoState />, {
          wrapper,
        })

        const deactivateButton = await screen.findByTestId('deactivate-repo')
        userEvent.click(deactivateButton)

        const warning = await screen.findByText(
          'Are you sure you want to deactivate the repo?'
        )
        expect(warning).toBeInTheDocument()

        const modalDeactivateButton = await screen.findByTestId(
          'deactivate-repo-modal'
        )
        expect(modalDeactivateButton).toBeInTheDocument()

        const cancelButton = await screen.findByRole('button', {
          name: 'Cancel',
        })
        expect(cancelButton).toBeInTheDocument()
      })

      describe('when user clicks on Cancel button', () => {
        it('does not call the mutation', async () => {
          render(<RepoState />, {
            wrapper,
          })

          const deactivateButton = await screen.findByTestId('deactivate-repo')
          userEvent.click(deactivateButton)

          const cancelButton = await screen.findByRole('button', {
            name: 'Cancel',
          })
          userEvent.click(cancelButton)

          expect(mutate).not.toHaveBeenCalled()
        })
      })

      describe('when user clicks on Deactivate button', () => {
        it('calls the mutation', async () => {
          render(<RepoState />, {
            wrapper,
          })

          const deactivateButton = await screen.findByTestId('deactivate-repo')
          userEvent.click(deactivateButton)

          const modalDeactivateButton = await screen.findByTestId(
            'deactivate-repo-modal'
          )
          userEvent.click(modalDeactivateButton)
          await waitFor(() => expect(mutate).toHaveBeenCalled())
        })
      })
    })
  })

  describe('when activate mutation is not successful', () => {
    beforeEach(() => {
      setup({ failMutation: true })
    })

    it('calls the mutation', async () => {
      render(<RepoState />, { wrapper })

      const activationButton = await screen.findByRole('button', {
        name: 'Activate',
      })
      expect(activationButton).toBeInTheDocument()

      userEvent.click(activationButton)
      await waitFor(() => expect(mutate).toHaveBeenCalled())
    })

    it('adds an error notification', async () => {
      render(<RepoState />, { wrapper })

      const activationButton = await screen.findByRole('button', {
        name: 'Activate',
      })
      userEvent.click(activationButton)

      await waitFor(() =>
        expect(addNotification).toHaveBeenCalledWith({
          type: 'error',
          text: 'We were not able to activate this repo',
        })
      )
    })
  })

  describe('when deactivate mutation is not successful', () => {
    beforeEach(() => {
      setup({ activated: true, failMutation: true })
    })
    it('calls the mutation', async () => {
      render(<RepoState />, {
        wrapper,
      })

      const deactivateButton = await screen.findByTestId('deactivate-repo')
      userEvent.click(deactivateButton)

      const modalDeactivateButton = await screen.findByTestId(
        'deactivate-repo-modal'
      )
      userEvent.click(modalDeactivateButton)

      await waitFor(() => expect(mutate).toHaveBeenCalled())
    })

    it('adds an error notification', async () => {
      render(<RepoState />, {
        wrapper,
      })

      const deactivateButton = await screen.findByTestId('deactivate-repo')
      userEvent.click(deactivateButton)

      const modalDeactivateButton = await screen.findByTestId(
        'deactivate-repo-modal'
      )
      userEvent.click(modalDeactivateButton)

      await waitFor(() =>
        expect(addNotification).toHaveBeenCalledWith({
          type: 'error',
          text: 'We were not able to deactivate this repo',
        })
      )
    })
  })
})