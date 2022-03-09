import { renderHook } from '@testing-library/react-hooks'
import Cookie from 'js-cookie'

import { useLegacyRedirects } from './hooks'

describe('useLegacyRedirects', () => {
  let getSpy
  function setup({ cookieName, selectedOldUI, uri, cookiePath }) {
    renderHook(() =>
      useLegacyRedirects({ cookieName, selectedOldUI, uri, cookiePath })
    )
  }

  describe('when the old UI is selected', () => {
    let props
    beforeEach(() => {
      getSpy = jest.spyOn(Cookie, 'set')
      props = {
        cookieName: 'cookie-monster',
        selectedOldUI: true,
        uri: '/gh/codecov/test-repo/commit/123',
        cookiePath: '/gh/codecov/',
      }
      setup(props)
    })

    afterEach(() => {
      getSpy.mockRestore()
    })

    it('sets the cookie with old name, expiration of 90 days and path of pathname', () => {
      expect(getSpy).toHaveBeenCalledWith('cookie-monster', 'old', {
        domain: '.codecov.io',
        expires: 90,
        path: '/gh/codecov/',
      })
    })
  })

  describe('when cookie is set to old', () => {
    beforeEach(() => {
      const props = {
        cookieName: 'cookie-monster',
        selectedOldUI: false,
        uri: '/gh/codecov/test-repo/commit/123',
        cookiePath: '/gh/codecov/',
      }
      delete global.window.location
      global.window = Object.create(window)
      global.window.location = {
        replace: jest.fn(),
      }
      Cookie.set(props.cookieName, 'old')
      setup(props)
    })

    afterEach(() => {
      delete global.window.location
    })

    it('changes window location', () => {
      expect(window.location.replace).toHaveBeenCalled()
    })
  })
})
