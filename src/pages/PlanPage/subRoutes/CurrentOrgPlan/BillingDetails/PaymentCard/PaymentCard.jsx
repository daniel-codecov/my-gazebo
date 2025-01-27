import PropTypes from 'prop-types'
import { useState } from 'react'

import { subscriptionDetailType } from 'services/account'
import A from 'ui/A'
import Button from 'ui/Button'
import Icon from 'ui/Icon'

import CardInformation from './CardInformation'
import CreditCardForm from './CreditCardForm'
import { useEnterpriseCloudPlanSupport } from './hooks'

const defaultProPlans = [
  'users-pr-inappm',
  'users-pr-inappy',
  'users-inappm',
  'users-inappy',
]
function PaymentCard({ subscriptionDetail, provider, owner }) {
  const { plans: proPlans } = useEnterpriseCloudPlanSupport({
    plans: defaultProPlans,
  })
  const isPayingCustomer = proPlans.includes(subscriptionDetail?.plan?.value)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const card = subscriptionDetail?.defaultPaymentMethod?.card

  if (!card && !isPayingCustomer) return null

  return (
    <div className="flex flex-col gap-2 border-t p-4">
      <div className="flex justify-between">
        <h4 className="font-semibold">Payment method</h4>
        {!isFormOpen && (
          <A
            variant="semibold"
            onClick={() => setIsFormOpen(true)}
            hook="edit-card"
          >
            Edit card <Icon name="chevronRight" size="sm" variant="solid" />
          </A>
        )}
      </div>
      {isFormOpen ? (
        <CreditCardForm
          provider={provider}
          owner={owner}
          closeForm={() => setIsFormOpen(false)}
        />
      ) : card ? (
        <CardInformation card={card} subscriptionDetail={subscriptionDetail} />
      ) : (
        <div className="flex flex-col gap-4 text-ds-gray-quinary">
          <p>
            No credit card set. Please contact support if you think it’s an
            error or set it yourself.
          </p>
          <div className="flex self-start">
            <Button
              hook="open-modal"
              variant="primary"
              onClick={() => setIsFormOpen(true)}
            >
              Set card
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

PaymentCard.propTypes = {
  subscriptionDetail: subscriptionDetailType,
  provider: PropTypes.string.isRequired,
  owner: PropTypes.string.isRequired,
}

export default PaymentCard
