import { waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { format, subDays, subMonths } from 'date-fns'
import { useParams } from 'react-router-dom'
import { act } from 'react-test-renderer'

import { useLocationParams } from 'services/navigation'
import { useRepo } from 'services/repo'
import { useRepoFlags } from 'services/repo/useRepoFlags'

import useRepoFlagsTable from './useRepoFlagsTable'

jest.mock('services/repo/useRepoFlags')
jest.mock('services/repo')

jest.mock('services/navigation', () => ({
  ...jest.requireActual('services/navigation'),
  useLocationParams: jest.fn(),
}))
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}))

const flagsData = [
  {
    node: {
      name: 'flag1',
      percentCovered: 93.26,
      measurements: [],
    },
  },
  {
    node: {
      name: 'flag2',
      percentCovered: 91.74,
      measurements: [],
    },
  },
]

const fetchNextPage = jest.fn()

const repoFlagsMock = {
  data: flagsData,
  isLoading: false,
  fetchNextPage: fetchNextPage,
  hasNextPage: true,
  isFetchingNextPage: false,
}

const emptyRepoFlagsMock = {
  data: [],
}

describe('useRepoFlagsTable', () => {
  let hookData
  function setup({
    repoData,
    useParamsValue = { search: '', historicalTrend: '' },
  }) {
    useParams.mockReturnValue({
      provider: 'gh',
      owner: 'codecov',
      repo: 'gazebo',
    })
    useRepo.mockReturnValue({
      data: {
        repository: { oldestCommitAt: '2020-06-11T18:28:52' },
      },
    })

    useRepoFlags.mockReturnValue(repoData)
    useLocationParams.mockReturnValue({
      params: useParamsValue,
    })

    hookData = renderHook(() => useRepoFlagsTable())
  }

  it('returns data accordingly', () => {
    setup({ repoData: repoFlagsMock })
    expect(hookData.result.current.data).toEqual(flagsData)
    expect(hookData.result.current.isLoading).toEqual(false)
    expect(hookData.result.current.hasNextPage).toEqual(true)
    expect(hookData.result.current.isFetchingNextPage).toEqual(false)
    expect(hookData.result.current.fetchNextPage).toEqual(fetchNextPage)
  })

  describe('when there is no data', () => {
    it('returns an empty array', () => {
      setup({ repoData: emptyRepoFlagsMock })
      expect(hookData.result.current.data).toEqual([])
    })
  })

  describe('when handleSort is triggered', () => {
    beforeEach(() => {
      setup({ repoData: emptyRepoFlagsMock })
    })

    it('calls useRepoContents with desc value', async () => {
      act(() => {
        hookData.result.current.handleSort([{ desc: true }])
      })

      await waitFor(() =>
        expect(useRepoFlags).toHaveBeenCalledWith({
          afterDate: '2020-06-11',
          beforeDate: format(new Date(), 'yyyy-MM-dd'),
          filters: { term: '' },
          interval: 'INTERVAL_30_DAY',
          orderingDirection: 'DESC',
        })
      )
    })

    it('calls useRepoContents with asc value when the array is empty', async () => {
      act(() => {
        hookData.result.current.handleSort([])
      })

      await waitFor(() =>
        expect(useRepoFlags).toHaveBeenCalledWith({
          afterDate: '2020-06-11',
          beforeDate: format(new Date(), 'yyyy-MM-dd'),
          filters: { term: '' },
          interval: 'INTERVAL_30_DAY',
          orderingDirection: 'ASC',
        })
      )
    })

    it('calls useRepoContents with asc value', async () => {
      act(() => {
        hookData.result.current.handleSort([{ desc: false }])
      })

      await waitFor(() =>
        expect(useRepoFlags).toHaveBeenCalledWith({
          afterDate: '2020-06-11',
          beforeDate: format(new Date(), 'yyyy-MM-dd'),
          filters: { term: '' },
          interval: 'INTERVAL_30_DAY',
          orderingDirection: 'ASC',
        })
      )
    })
  })

  describe('when there is search param', () => {
    it('calls useRepoContents with correct filters value', () => {
      setup({
        repoData: repoFlagsMock,
        useParamsValue: { search: 'flag1' },
      })

      expect(hookData.result.current.isSearching).toEqual(true)
      expect(useRepoFlags).toHaveBeenCalledWith({
        afterDate: '2020-06-11',
        beforeDate: format(new Date(), 'yyyy-MM-dd'),
        filters: { term: 'flag1' },
        interval: 'INTERVAL_30_DAY',
        orderingDirection: 'ASC',
      })
    })
  })

  describe('historical trend', () => {
    describe('when historical trend param is empty or all time is selected', () => {
      beforeEach(() => {
        setup({
          repoData: repoFlagsMock,
        })
      })

      it('calls useRepoContents with correct query params', () => {
        expect(useRepoFlags).toHaveBeenCalledWith({
          afterDate: '2020-06-11',
          beforeDate: format(new Date(), 'yyyy-MM-dd'),
          filters: { term: '' },
          interval: 'INTERVAL_30_DAY',
          orderingDirection: 'ASC',
        })
      })
    })

    describe('when 6 months is selected', () => {
      beforeEach(() => {
        setup({
          repoData: repoFlagsMock,
          useParamsValue: { historicalTrend: 'Last 6 months', search: '' },
        })
      })

      it('calls useRepoContents with correct query params', () => {
        const afterDate = format(subMonths(new Date(), 6), 'yyyy-MM-dd')
        expect(useRepoFlags).toHaveBeenCalledWith({
          afterDate,
          beforeDate: format(new Date(), 'yyyy-MM-dd'),
          filters: { term: '' },
          interval: 'INTERVAL_7_DAY',
          orderingDirection: 'ASC',
        })
      })
    })

    describe('when last 7 days is selected', () => {
      beforeEach(() => {
        setup({
          repoData: repoFlagsMock,
          useParamsValue: { historicalTrend: 'Last 7 days', search: '' },
        })
      })

      it('calls useRepoContents with correct query params', () => {
        const afterDate = format(subDays(new Date(), 7), 'yyyy-MM-dd')
        expect(useRepoFlags).toHaveBeenCalledWith({
          afterDate,
          beforeDate: format(new Date(), 'yyyy-MM-dd'),
          filters: { term: '' },
          interval: 'INTERVAL_1_DAY',
          orderingDirection: 'ASC',
        })
      })
    })
  })
})
