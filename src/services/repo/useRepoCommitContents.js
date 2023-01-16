import { useQuery } from '@tanstack/react-query'

import Api from 'shared/api'

const query = `
  query CommitPathContents(
    $name: String!
    $commit: String!
    $repo: String!
    $path: String!
    $filters: PathContentsFilters!
  ) {
    owner(username: $name) {
      username
      repository(name: $repo) {
        commit(id: $commit) {
          pathContents(path: $path, filters: $filters) {
            ... on PathContents {
              results {
                __typename
                hits
                misses
                partials
                lines
                name
                path
                percentCovered
                ... on PathContentFile {
                  isCriticalFile
                }
              }
              __typename
            }
          }
        }
      }
    }
  }
`

export const useRepoCommitContents = ({
  provider,
  owner,
  repo,
  commit,
  path,
  filters,
  opts = {},
}) => {
  return useQuery(
    ['CommitPathContents', provider, owner, repo, commit, path, filters],
    ({ signal }) =>
      Api.graphql({
        provider,
        query,
        signal,
        variables: {
          name: owner,
          repo,
          commit,
          path,
          filters,
        },
      }).then((res) => res?.data?.owner?.repository?.commit?.pathContents),
    opts
  )
}
