import { useLayoutEffect } from 'react'
import { useParams } from 'react-router-dom'

import { useAccountDetails, usePlans } from 'services/account'
import { isFreePlan } from 'shared/utils/billing'
import A from 'ui/A'
import Card from 'ui/Card'
import Icon from 'ui/Icon'

import { useProPlans } from './hooks'
import parasolImg from './parasol.png'
import UpgradePlanForm from './UpgradePlanForm'

import { useSetCrumbs } from '../context'
import BenefitList from '../shared/BenefitList'

function shouldRenderCancelLink(accountDetails, plan) {
  // cant cancel a free plan
  if (isFreePlan(plan?.value)) return false

  // plan is already set for cancellation
  if (accountDetails?.subscriptionDetail?.cancelAtPeriodEnd) return false

  return true
}

function UpgradePlan() {
  const { provider, owner } = useParams()
  const setCrumbs = useSetCrumbs()

  useLayoutEffect(() => {
    setCrumbs({
      pageName: 'upgradeOrgPlan',
      text: 'Manage Plan',
    })
  }, [setCrumbs])

  const { data: accountDetails } = useAccountDetails({ provider, owner })
  const { data: plans } = usePlans(provider)
  const { proPlanMonth, proPlanYear } = useProPlans({ plans })

  const plan = accountDetails?.rootOrganization?.plan ?? accountDetails?.plan

  return (
    <>
      {/* TODO: Refactor this layout to be it's own reusable component (also used in CurrentPlanCard and the CancelPlan card) */}
      <div className="flex gap-8 mt-6">
        <Card variant="large">
          <div className="flex flex-col gap-4">
            <div className="-mt-16">
              <img src={parasolImg} alt="parasol" />
            </div>
            <h3 className="text-2xl text-ds-pink-quinary bold">
              {proPlanYear?.marketingName}
            </h3>
            <h2 className="text-5xl bold">${proPlanYear?.baseUnitPrice}*</h2>
            <BenefitList
              benefits={proPlanYear?.benefits}
              iconName="check"
              iconColor="text-ds-pink-quinary"
            />
            <p className="text-ds-gray-quaternary">
              *${proPlanMonth?.baseUnitPrice} per user / month if paid monthly
            </p>
            {shouldRenderCancelLink(accountDetails, plan) && (
              <A
                to={{ pageName: 'cancelPlan' }}
                variant="grayQuinary"
                hook="cancel-plan"
              >
                Cancel plan{' '}
                <Icon name="chevronRight" size="sm" variant="solid" />
              </A>
            )}
          </div>
        </Card>
        <Card variant="large">
          <UpgradePlanForm
            proPlanYear={proPlanYear}
            proPlanMonth={proPlanMonth}
            accountDetails={accountDetails}
            provider={provider}
            owner={owner}
          />
        </Card>
      </div>
    </>
  )
}

export default UpgradePlan
