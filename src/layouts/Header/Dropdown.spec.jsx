import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Switch } from 'react-router-dom'

import config from 'config'

import { useImage } from 'services/image'

import Dropdown from './Dropdown'

const LOCAL_STORAGE_SESSION_TRACKING_KEY = 'tracking-session-expiry'

const currentUser = {
  user: {
    username: 'chetney',
    avatarUrl: 'http://127.0.0.1/avatar-url',
  },
}

jest.mock('services/image')
jest.mock('config')

const Wrapper =
  ({ provider }) =>
  ({ children }) =>
    (
      <MemoryRouter initialEntries={[`/${provider}`]}>
        <Switch>
          <Route path="/:provider" exact>
            {children}
          </Route>
        </Switch>
      </MemoryRouter>
    )

describe('Dropdown', () => {
  function setup({ selfHosted } = { selfHosted: false }) {
    useImage.mockReturnValue({ src: 'imageUrl', isLoading: false, error: null })
    config.IS_SELF_HOSTED = selfHosted
    const mockRemoveItem = jest.spyOn(
      window.localStorage.__proto__,
      'removeItem'
    )

    return {
      user: userEvent.setup(),
      mockRemoveItem,
    }
  }

  describe('when rendered', () => {
    beforeEach(() => setup())

    it('renders the users avatar', () => {
      render(<Dropdown currentUser={currentUser} />, {
        wrapper: Wrapper({ provider: 'gh' }),
      })

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('alt', 'avatar')
    })
  })

  describe('when on GitHub', () => {
    afterEach(() => {
      jest.resetAllMocks()
    })
    describe('when the avatar is clicked', () => {
      it('shows settings link', async () => {
        const { user } = setup()
        render(<Dropdown currentUser={currentUser} />, {
          wrapper: Wrapper({ provider: 'gh' }),
        })

        expect(screen.queryByText('Settings')).not.toBeInTheDocument()

        const openSelect = screen.getByRole('combobox')
        await user.click(openSelect)

        const link = screen.getByText('Settings')
        expect(link).toBeVisible()
        expect(link).toHaveAttribute('href', '/account/gh/chetney')
      })

      it('shows sign out link', async () => {
        const { user } = setup()
        render(<Dropdown currentUser={currentUser} />, {
          wrapper: Wrapper({ provider: 'gh' }),
        })

        expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()

        const openSelect = screen.getByRole('combobox')
        await user.click(openSelect)

        const link = screen.getByText('Sign Out')
        expect(link).toBeVisible()
        expect(link).toHaveAttribute(
          'href',
          '/logout/gh?to=http%3A%2F%2Flocalhost%2Flogin'
        )
      })

      it('removes session expiry tracking key on sign out', async () => {
        const { user, mockRemoveItem } = setup()

        jest.spyOn(console, 'error').mockImplementation()
        render(<Dropdown currentUser={currentUser} />, {
          wrapper: Wrapper({ provider: 'gh' }),
        })

        const openSelect = screen.getByRole('combobox')
        await user.click(openSelect)

        const link = screen.getByText('Sign Out')
        expect(link).toBeVisible()
        await user.click(link)

        expect(mockRemoveItem).toHaveBeenCalledWith(
          LOCAL_STORAGE_SESSION_TRACKING_KEY
        )
      })

      it('shows manage app access link', async () => {
        const { user } = setup()
        render(<Dropdown currentUser={currentUser} />, {
          wrapper: Wrapper({ provider: 'gh' }),
        })

        expect(
          screen.queryByText('Install Codecov app')
        ).not.toBeInTheDocument()

        const openSelect = screen.getByRole('combobox')
        await user.click(openSelect)

        const link = screen.getByText('Install Codecov app')
        expect(link).toBeVisible()
        expect(link).toHaveAttribute(
          'href',
          'https://github.com/apps/codecov/installations/new'
        )
      })
    })
  })
  describe('when not on GitHub', () => {
    describe('when the avatar is clicked', () => {
      it('shows settings link', async () => {
        const { user } = setup()
        render(<Dropdown currentUser={currentUser} />, {
          wrapper: Wrapper({ provider: 'gl' }),
        })

        expect(screen.queryByText('Settings')).not.toBeInTheDocument()

        const openSelect = screen.getByRole('combobox')
        await user.click(openSelect)

        const link = screen.getByText('Settings')
        expect(link).toBeVisible()
        expect(link).toHaveAttribute('href', '/account/gl/chetney')
      })

      it('shows sign out link', async () => {
        const { user } = setup()
        render(<Dropdown currentUser={currentUser} />, {
          wrapper: Wrapper({ provider: 'gl' }),
        })

        expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()

        const openSelect = screen.getByRole('combobox')
        await user.click(openSelect)

        const link = screen.getByText('Sign Out')
        expect(link).toBeVisible()
        expect(link).toHaveAttribute(
          'href',
          '/logout/gl?to=http%3A%2F%2Flocalhost%2Flogin'
        )
      })

      it('does not show manage app access link', async () => {
        const { user } = setup()
        render(<Dropdown currentUser={currentUser} />, {
          wrapper: Wrapper({ provider: 'gl' }),
        })

        expect(
          screen.queryByText('Install Codecov app')
        ).not.toBeInTheDocument()

        const openSelect = screen.getByRole('combobox')
        await user.click(openSelect)

        expect(
          screen.queryByText('Install Codecov app')
        ).not.toBeInTheDocument()
      })
    })
  })
})
