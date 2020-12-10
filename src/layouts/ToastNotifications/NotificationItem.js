import PropType from 'prop-types'
import { useCallback, useEffect } from 'react'

import Icon from 'ui/Icon'
import { notificationPropType } from 'services/toastNotification'

const typeToStyle = {
  success: {
    text: 'text-success-900',
    background: 'bg-success-500',
    backgroundIcon: 'bg-success-100',
    icon: 'check',
  },
  warning: {
    text: 'text-warning-900',
    background: 'bg-codecov-orange',
    backgroundIcon: 'bg-error-100',
    icon: 'exclamationCircle',
  },
  info: {
    text: 'text-info-900',
    background: 'bg-info-500',
    backgroundIcon: 'bg-info-100',
    icon: 'infoCircle',
  },
  error: {
    text: 'text-error-900',
    background: 'bg-error-500',
    backgroundIcon: 'bg-error-100',
    icon: 'ban',
  },
}

function NotificationItem({ notification, removeNotification }) {
  const style = typeToStyle[notification.type]

  const close = useCallback(() => {
    return removeNotification(notification.id)
  }, [notification.id, removeNotification])

  // remove notification after the delay
  useEffect(() => {
    // infinite notification
    if (notification.disappearAfter === 0) return

    const timeout = setTimeout(close, notification.disappearAfter)

    // cleanup if unmounted before the time
    return () => clearTimeout(timeout)
  }, [close, notification])

  const className = [
    'rounded-full p-2 flex w-full max-w-lg mx-auto flex items-center mt-4',
    style.text,
    style.background,
  ].join(' ')

  return (
    <div className={className}>
      <div className={`rounded-full mr-2 ${style.backgroundIcon}`}>
        <Icon name={style.icon} />
      </div>
      {notification.text}
      <button
        data-testid="close-notification"
        onClick={close}
        className="ml-auto inline-flex items-center"
      >
        <Icon name="times" />
      </button>
    </div>
  )
}

NotificationItem.propTypes = {
  notification: notificationPropType.isRequired,
  removeNotification: PropType.func.isRequired,
}

export default NotificationItem