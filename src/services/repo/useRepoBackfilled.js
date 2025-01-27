import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import Api from 'shared/api'

function fetchRepoBackfilledContents({ provider, owner, repo, signal }) {
  const query = `
      query BackfillFlagMemberships($name: String!, $repo: String!) {
        config {
          isTimescaleEnabled
        }
        owner(username:$name){
          repository: repositoryDeprecated(name:$repo){
            flagsMeasurementsActive
            flagsMeasurementsBackfilled
            flagsCount
          }
        }
      }
    `

  return Api.graphql({
    provider,
    repo,
    query,
    signal,
    variables: {
      name: owner,
      repo,
    },
  }).then((res) => {
    return {
      ...res?.data?.config,
      ...res?.data?.owner?.repository,
    }
  })
}

export function useRepoBackfilled() {
  const { provider, owner, repo } = useParams()
  return useQuery({
    queryKey: ['BackfillFlagMemberships', provider, owner, repo],
    queryFn: ({ signal }) =>
      fetchRepoBackfilledContents({ provider, owner, repo, signal }),
  })
}
