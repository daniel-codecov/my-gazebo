import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

import { useUpdateBillingEmail } from './useUpdateBillingEmail'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})
const server = setupServer()

const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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

const provider = 'gh'
const owner = 'codecov'

const accountDetails = {
  plan: {
    marketingName: 'Pro Team',
    baseUnitPrice: 12,
    benefits: ['Configurable # of users', 'Unlimited repos'],
    quantity: 5,
    value: 'users-inappm',
  },
  subscription_detail: {
    latest_invoice: {
      id: 'in_1JnNyfGlVGuVgOrkkdkCYayW',
    },
    default_payment_method: {
      card: {
        brand: 'mastercard',
        exp_month: 4,
        exp_year: 2023,
        last4: '8091',
      },
      billing_details: {
        email: null,
        name: null,
        phone: null,
      },
    },
    cancel_at_period_end: false,
    current_period_end: 1636479475,
  },
  activatedUserCount: 2,
  inactiveUserCount: 1,
}

describe('useUpdateBillingEmail', () => {
  const mockBody = jest.fn()

  function setup() {
    server.use(
      rest.patch(
        `/internal/${provider}/${owner}/account-details/update_email`,
        async (req, res, ctx) => {
          const body = await req.json()
          mockBody(body)

          return res(ctx.status(200), ctx.json(accountDetails))
        }
      )
    )
  }

  describe('when called', () => {
    beforeEach(() => {
      setup()
    })

    it('calls with the correct body', async () => {
      const { result } = renderHook(
        () => useUpdateBillingEmail({ provider, owner }),
        {
          wrapper,
        }
      )

      result.current.mutate({ newEmail: 'test@gmail.com' })

      await waitFor(() => result.current.isLoading)
      await waitFor(() => !result.current.isLoading)

      await waitFor(() => expect(mockBody).toBeCalled())
      await waitFor(() =>
        expect(mockBody).toHaveBeenCalledWith({
          new_email: 'test@gmail.com',
        })
      )
    })
  })
})
