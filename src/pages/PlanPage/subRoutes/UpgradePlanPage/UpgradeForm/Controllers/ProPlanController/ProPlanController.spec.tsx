import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { graphql, rest } from 'msw'
import { setupServer } from 'msw/node'
import { Suspense } from 'react'
import { MemoryRouter, Route } from 'react-router-dom'

import { TrialStatuses } from 'services/account'
import { useAddNotification } from 'services/toastNotification'
import { Plans } from 'shared/utils/billing'

import ProPlanController from './ProPlanController'

jest.mock('services/toastNotification')
jest.mock('@stripe/react-stripe-js')

const basicPlan = {
  marketingName: 'Basic',
  value: 'users-basic',
  billingRate: null,
  baseUnitPrice: 0,
  benefits: [
    'Up to 1 user',
    'Unlimited public repositories',
    'Unlimited private repositories',
  ],
  monthlyUploadLimit: 250,
}

const proPlanMonth = {
  marketingName: 'Pro',
  value: Plans.USERS_PR_INAPPM,
  billingRate: 'monthly',
  baseUnitPrice: 12,
  benefits: [
    'Configurable # of users',
    'Unlimited public repositories',
    'Unlimited private repositories',
    'Priority Support',
  ],
  quantity: 10,
  monthlyUploadLimit: null,
}

const proPlanYear = {
  marketingName: 'Pro',
  value: Plans.USERS_PR_INAPPY,
  billingRate: 'annually',
  baseUnitPrice: 10,
  benefits: [
    'Configurable # of users',
    'Unlimited public repositories',
    'Unlimited private repositories',
    'Priority Support',
  ],
  monthlyUploadLimit: null,
  quantity: 13,
}

const trialPlan = {
  marketingName: 'Pro Trial Team',
  value: 'users-trial',
  billingRate: null,
  baseUnitPrice: 12,
  benefits: ['Configurable # of users', 'Unlimited repos'],
  monthlyUploadLimit: null,
}

const mockAccountDetailsBasic = {
  plan: basicPlan,
  activatedUserCount: 1,
  inactiveUserCount: 0,
}

const mockAccountDetailsProMonthly = {
  plan: proPlanMonth,
  activatedUserCount: 7,
  inactiveUserCount: 0,
  subscriptionDetail: {
    latestInvoice: {
      periodStart: 1595270468,
      periodEnd: 1597948868,
      dueDate: '1600544863',
      amountPaid: 9600.0,
      amountDue: 9600.0,
      amountRemaining: 0.0,
      total: 9600.0,
      subtotal: 9600.0,
      invoicePdf:
        'https://pay.stripe.com/invoice/acct_14SJTOGlVGuVgOrk/invst_Hs2qfFwArnp6AMjWPlwtyqqszoBzO3q/pdf',
    },
  },
}

const mockAccountDetailsProYearly = {
  plan: proPlanYear,
  activatedUserCount: 11,
  inactiveUserCount: 0,
}

const mockAccountDetailsTrial = {
  plan: trialPlan,
  activatedUserCount: 28,
  inactiveUserCount: 0,
}

const mockPlanDataResponseMonthly = {
  baseUnitPrice: 10,
  benefits: [],
  billingRate: 'monthly',
  marketingName: 'Pro Team',
  monthlyUploadLimit: 250,
  value: 'test-plan',
  trialStatus: TrialStatuses.NOT_STARTED,
  trialStartDate: '',
  trialEndDate: '',
  trialTotalDays: 0,
  pretrialUsersCount: 0,
  planUserCount: 1,
}

const mockPlanDataResponseYearly = {
  baseUnitPrice: 10,
  benefits: [],
  billingRate: 'yearly',
  marketingName: 'Pro Team',
  monthlyUploadLimit: 250,
  value: 'test-plan',
  trialStatus: TrialStatuses.NOT_STARTED,
  trialStartDate: '',
  trialEndDate: '',
  trialTotalDays: 0,
  pretrialUsersCount: 0,
  planUserCount: 1,
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true,
      retry: false,
    },
  },
  logger: {
    error: () => null,
    warn: () => null,
    log: () => null,
  },
})
const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  queryClient.clear()
  server.resetHandlers()
})
afterAll(() => server.close())

type WrapperClosure = (
  initialEntries?: string[]
) => React.FC<React.PropsWithChildren>
const wrapper: WrapperClosure =
  (initialEntries = ['/gh/codecov']) =>
  ({ children }) =>
    (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Route path="/:provider/:owner">
            <Suspense fallback={null}>{children}</Suspense>
          </Route>
        </MemoryRouter>
      </QueryClientProvider>
    )

interface SetupArgs {
  planValue: string
  errorDetails?: string
  monthlyPlan?: boolean
}

describe('ProPlanController', () => {
  function setup(
    { planValue = Plans.USERS_BASIC, monthlyPlan = true }: SetupArgs = {
      planValue: Plans.USERS_BASIC,
      monthlyPlan: true,
    }
  ) {
    const addNotification = jest.fn()
    const user = userEvent.setup()

    //@ts-ignore
    useAddNotification.mockReturnValue(addNotification)

    server.use(
      rest.get(`/internal/gh/codecov/account-details/`, (req, res, ctx) => {
        if (planValue === Plans.USERS_BASIC) {
          return res(ctx.status(200), ctx.json(mockAccountDetailsBasic))
        } else if (planValue === Plans.USERS_PR_INAPPM) {
          return res(ctx.status(200), ctx.json(mockAccountDetailsProMonthly))
        } else if (planValue === Plans.USERS_PR_INAPPY) {
          return res(ctx.status(200), ctx.json(mockAccountDetailsProYearly))
        } else if (planValue === Plans.USERS_TRIAL) {
          return res(ctx.status(200), ctx.json(mockAccountDetailsTrial))
        }
      }),
      rest.patch(
        '/internal/gh/codecov/account-details/',
        async (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ success: false }))
        }
      ),
      graphql.query('GetAvailablePlans', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.data({
            owner: {
              availablePlans: [basicPlan, proPlanMonth, proPlanYear, trialPlan],
            },
          })
        )
      }),
      graphql.query('GetPlanData', (req, res, ctx) => {
        const planResponse = monthlyPlan
          ? mockPlanDataResponseMonthly
          : mockPlanDataResponseYearly
        return res(
          ctx.status(200),
          ctx.data({
            owner: {
              hasPrivateRepos: true,
              plan: planResponse,
            },
          })
        )
      })
    )

    return { addNotification, user }
  }

  describe('when rendered', () => {
    describe('when the user has a pro plan monthly', () => {
      const props = {
        setFormValue: jest.fn(),
        register: jest.fn(),
        newPlan: Plans.USERS_PR_INAPPM,
        seats: 10,
        errors: { seats: { message: '' } },
      }
      it('renders monthly option button', async () => {
        setup({ planValue: Plans.USERS_PR_INAPPM })
        render(<ProPlanController {...props} />, { wrapper: wrapper() })

        const optionBtn = await screen.findByRole('button', { name: 'Monthly' })
        expect(optionBtn).toBeInTheDocument()
      })

      it('renders annual option button', async () => {
        setup({ planValue: Plans.USERS_PR_INAPPM })
        render(<ProPlanController {...props} />, { wrapper: wrapper() })

        const optionBtn = await screen.findByRole('button', { name: 'Annual' })
        expect(optionBtn).toBeInTheDocument()
      })

      it('renders monthly option button as "selected"', async () => {
        setup({ planValue: Plans.USERS_PR_INAPPM })
        render(<ProPlanController {...props} />, { wrapper: wrapper() })

        const optionBtn = await screen.findByRole('button', { name: 'Monthly' })
        expect(optionBtn).toBeInTheDocument()
        expect(optionBtn).toHaveClass('bg-ds-primary-base')
      })

      it('has the price for the year', async () => {
        setup({ planValue: Plans.USERS_PR_INAPPM })
        render(<ProPlanController {...props} />, { wrapper: wrapper() })

        const price = await screen.findByText(/\$120/)
        expect(price).toBeInTheDocument()
      })

      it('shows the next billing date if available', async () => {
        setup({ planValue: Plans.USERS_PR_INAPPM })
        render(<ProPlanController {...props} />, { wrapper: wrapper() })

        const nextBillingDateTitle = await screen.findByText(
          /Next Billing Date/
        )
        expect(nextBillingDateTitle).toBeInTheDocument()
      })
    })

    describe('when the user has a pro plan yearly', () => {
      const props = {
        setFormValue: jest.fn(),
        register: jest.fn(),
        newPlan: Plans.USERS_PR_INAPPY,
        seats: 13,
        errors: { seats: { message: '' } },
      }

      it('renders monthly option button', async () => {
        setup({ planValue: Plans.USERS_PR_INAPPY, monthlyPlan: false })
        render(<ProPlanController {...props} />, { wrapper: wrapper() })

        const optionBtn = await screen.findByRole('button', { name: 'Monthly' })
        expect(optionBtn).toBeInTheDocument()
      })

      it('renders annual option button', async () => {
        setup({ planValue: Plans.USERS_PR_INAPPY, monthlyPlan: false })
        render(<ProPlanController {...props} />, { wrapper: wrapper() })

        const optionBtn = await screen.findByRole('button', { name: 'Annual' })
        expect(optionBtn).toBeInTheDocument()
      })

      it('renders annual option button as "selected"', async () => {
        setup({ planValue: Plans.USERS_PR_INAPPY, monthlyPlan: false })
        render(<ProPlanController {...props} />, { wrapper: wrapper() })

        const optionBtn = await screen.findByRole('button', { name: 'Annual' })
        expect(optionBtn).toBeInTheDocument()
        expect(optionBtn).toHaveClass('bg-ds-primary-base')
      })

      it('has the price for the year', async () => {
        setup({ planValue: Plans.USERS_PR_INAPPY, monthlyPlan: false })
        render(<ProPlanController {...props} />, { wrapper: wrapper() })

        const price = await screen.findByText(/\$130/)
        expect(price).toBeInTheDocument()
      })
    })
  })
})
