import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { useAccountDetails, usePlans } from 'services/account'

import UpgradePlan from './UpgradePlan'

jest.mock('services/account')
jest.mock('./UpgradePlanForm', () => () => 'UpgradePlanForm')

const provider = 'gh'
const owner = 'codecov'

describe('UpgradePlanPage', () => {
  function setup() {
    useAccountDetails.mockReturnValue({
      data: {
        plan: null,
        activatedUserCount: 2,
        inactiveUserCount: 1,
      },
    })
    usePlans.mockReturnValue({
      data: getPlans(),
    })
    render(<UpgradePlan provider={provider} owner={owner} />, {
      wrapper: MemoryRouter,
    })
  }

  describe('when rendered', () => {
    beforeEach(() => {
      setup()
    })

    it('renders the basic plan title', () => {
      const title = screen.getAllByText(/Pro Team/)[0]
      expect(title).toBeInTheDocument()
    })

    it('renders a cancel plan link', () => {
      const cancelLink = screen.getByText('Cancel plan')
      expect(cancelLink).toBeInTheDocument()
    })
  })
})

function getPlans() {
  return [
    {
      marketingName: 'Basic',
      value: 'users-free',
      billingRate: null,
      baseUnitPrice: 0,
      benefits: [
        'Up to 5 users',
        'Unlimited public repositories',
        'Unlimited private repositories',
      ],
    },
    {
      marketingName: 'Pro Team',
      value: 'users-pr-inappm',
      billingRate: 'monthly',
      baseUnitPrice: 12,
      benefits: [
        'Configurable # of users',
        'Unlimited public repositories',
        'Unlimited private repositories',
        'Priorty Support',
      ],
    },
    {
      marketingName: 'Pro Team',
      value: 'users-pr-inappy',
      billingRate: 'annually',
      baseUnitPrice: 10,
      benefits: [
        'Configurable # of users',
        'Unlimited public repositories',
        'Unlimited private repositories',
        'Priorty Support',
      ],
    },
    {
      marketingName: 'Pro Team',
      value: 'users-enterprisem',
      billingRate: 'monthly',
      baseUnitPrice: 12,
      benefits: [
        'Configurable # of users',
        'Unlimited public repositories',
        'Unlimited private repositories',
        'Priorty Support',
      ],
    },
    {
      marketingName: 'Pro Team',
      value: 'users-enterprisey',
      billingRate: 'annually',
      baseUnitPrice: 10,
      benefits: [
        'Configurable # of users',
        'Unlimited public repositories',
        'Unlimited private repositories',
        'Priorty Support',
      ],
    },
  ]
}
