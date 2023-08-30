import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route } from 'react-router-dom'

import { TrialStatuses } from 'services/account'
import { useFlags } from 'shared/featureFlags'

import ProPlanSubheading from './ProPlanSubheading'

jest.mock('shared/featureFlags')

const mockedUseFlags = useFlags as jest.Mock<{ codecovTrialMvp: boolean }>

const mockResponse = {
  baseUnitPrice: 10,
  benefits: [],
  billingRate: 'monthly',
  marketingName: 'Users Basic',
  monthlyUploadLimit: 250,
  planName: 'users-basic',
  trialStatus: TrialStatuses.NOT_STARTED,
  trialStartDate: '',
  trialEndDate: '',
  trialTotalDays: 0,
  pretrialUsersCount: 0,
}

const server = setupServer()
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/plan/gh/codecov']}>
      <Route path="/plan/:provider/:owner">{children}</Route>
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

interface SetupArgs {
  trialFlag?: boolean
  trialStatus?: string | null
  planValue?: string
}

describe('ProPlanSubheading', () => {
  function setup({
    trialFlag = false,
    trialStatus = TrialStatuses.NOT_STARTED,
    planValue = 'users-basic',
  }: SetupArgs) {
    mockedUseFlags.mockReturnValue({
      codecovTrialMvp: trialFlag,
    })

    server.use(
      graphql.query('GetPlanData', (req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.data({
            owner: {
              plan: {
                ...mockResponse,
                trialStatus,
                planName: planValue,
              },
            },
          })
        )
      )
    )
  }

  describe('flag is set to false', () => {
    it('renders nothing', () => {
      setup({ trialFlag: false })

      const { container } = render(<ProPlanSubheading />, { wrapper })

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('flag is set to true', () => {
    describe('user is not eligible for a trial', () => {
      it('renders nothing', async () => {
        setup({ trialFlag: true, trialStatus: TrialStatuses.CANNOT_TRIAL })

        const { container } = render(<ProPlanSubheading />, { wrapper })

        await waitFor(() => queryClient.isFetching)
        await waitFor(() => !queryClient.isFetching)

        expect(container).toBeEmptyDOMElement()
      })
    })

    describe('user is on a free plan', () => {
      it('renders correct text', async () => {
        setup({ trialFlag: true, trialStatus: TrialStatuses.NOT_STARTED })

        render(<ProPlanSubheading />, { wrapper })

        const text = await screen.findByText(/Includes 14-day free trial/)
        expect(text).toBeInTheDocument()
      })

      it('renders faq link', async () => {
        setup({ trialFlag: true, trialStatus: TrialStatuses.NOT_STARTED })

        render(<ProPlanSubheading />, { wrapper })

        const faqLink = await screen.findByRole('link', { name: /FAQ/ })
        expect(faqLink).toBeInTheDocument()
        expect(faqLink).toHaveAttribute(
          'href',
          'https://docs.codecov.com/docs/free-trial-faqs'
        )
      })
    })

    describe('user is currently on a trial', () => {
      it('renders correct text', async () => {
        setup({
          trialFlag: true,
          trialStatus: TrialStatuses.ONGOING,
          planValue: 'users-trial',
        })

        render(<ProPlanSubheading />, { wrapper })

        const text = await screen.findByText(/Current trial/)
        expect(text).toBeInTheDocument()
      })

      it('renders link to faqs', async () => {
        setup({
          trialFlag: true,
          trialStatus: TrialStatuses.ONGOING,
          planValue: 'users-trial',
        })

        render(<ProPlanSubheading />, { wrapper })

        const faqLink = await screen.findByRole('link', { name: /FAQ/ })
        expect(faqLink).toBeInTheDocument()
        expect(faqLink).toHaveAttribute(
          'href',
          'https://docs.codecov.com/docs/free-trial-faqs'
        )
      })
    })

    describe('users trial has expired', () => {
      it('renders correct text', async () => {
        setup({
          trialFlag: true,
          trialStatus: TrialStatuses.EXPIRED,
        })

        render(<ProPlanSubheading />, { wrapper })

        const text = await screen.findByText(/Your org trialed this plan/)
        expect(text).toBeInTheDocument()
      })
    })
  })
})