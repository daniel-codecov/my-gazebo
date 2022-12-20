import { lazy, Suspense } from 'react'
import { Redirect, Switch, useParams } from 'react-router-dom'

import config from 'config'

import { SentryRoute } from 'sentry'

import SidebarLayout from 'layouts/SidebarLayout'
import LogoSpinner from 'old_ui/LogoSpinner'
import { useAccountDetails } from 'services/account'
import { useIsCurrentUserAnAdmin, useUser } from 'services/user'
import { useFlags } from 'shared/featureFlags'
import { isEnterprisePlan } from 'shared/utils/billing'

import AccountSettingsSideMenu from './AccountSettingsSideMenu'
import Header from './shared/Header'
import OrgUploadToken from './tabs/OrgUploadToken'

const AccessTab = lazy(() => import('./tabs/Access'))
const AdminTab = lazy(() => import('./tabs/Admin'))
const NotFound = lazy(() => import('../NotFound'))
const Profile = lazy(() => import('./tabs/Profile'))
const YAMLTab = lazy(() => import('./tabs/YAML'))

const Loader = (
  <div className="h-full w-full flex items-center justify-center">
    <LogoSpinner />
  </div>
)

// eslint-disable-next-line complexity
function AccountSettings() {
  const { provider, owner } = useParams()
  const isAdmin = useIsCurrentUserAnAdmin({ owner })
  const { data: currentUser } = useUser()

  const isViewingPersonalSettings =
    currentUser?.user?.username?.toLowerCase() === owner?.toLowerCase()

  const yamlTab = `/account/${provider}/${owner}/yaml/`
  const { orgUploadToken } = useFlags({ orgUploadToken: false })

  const { data: accountDetails } = useAccountDetails({ owner, provider })
  const showOrgUploadToken =
    orgUploadToken && isEnterprisePlan(accountDetails?.plan?.value)

  return (
    <>
      <Header />
      <SidebarLayout sidebar={<AccountSettingsSideMenu />}>
        <Suspense fallback={Loader}>
          <Switch>
            <SentryRoute path="/account/:provider/:owner/" exact>
              {config.IS_SELF_HOSTED && isViewingPersonalSettings ? (
                <Profile provider={provider} owner={owner} />
              ) : !config.IS_SELF_HOSTED && isAdmin ? (
                <AdminTab provider={provider} owner={owner} />
              ) : (
                <Redirect to={yamlTab} />
              )}
            </SentryRoute>
            <SentryRoute path="/account/:provider/:owner/yaml/" exact>
              <YAMLTab provider={provider} owner={owner} />
            </SentryRoute>
            {!config.IS_SELF_HOSTED && (
              <SentryRoute path="/account/:provider/:owner/access/" exact>
                <AccessTab provider={provider} />
              </SentryRoute>
            )}
            {showOrgUploadToken && (
              <SentryRoute
                path="/account/:provider/:owner/orgUploadToken"
                exact
              >
                <OrgUploadToken />
              </SentryRoute>
            )}
            <SentryRoute path="/account/:provider/:owner/*">
              <NotFound />
            </SentryRoute>
          </Switch>
        </Suspense>
      </SidebarLayout>
    </>
  )
}

export default AccountSettings
