import PropTypes from 'prop-types'
import { useParams } from 'react-router-dom'

import { useFileWithMainCoverage } from 'services/file/hooks'
import FileViewer from 'shared/FileViewer'
import Breadcrumb from 'ui/Breadcrumb'

function CommitFileView({ diff }) {
  const { owner, repo, provider, commit, path } = useParams()
  const { data } = useFileWithMainCoverage({
    provider,
    owner,
    repo,
    ref: commit,
    path: path,
  })

  const change = diff?.headCoverage?.coverage - diff?.baseCoverage?.coverage

  return (
    <FileViewer
      coverage={data?.coverage}
      content={data?.content}
      totals={data?.totals}
      treePaths={[]}
      change={change}
      flagNames={data?.flagNames}
      fileName={path}
      title={
        <Breadcrumb
          paths={[
            {
              pageName: 'commit',
              text: 'Impacted files',
              options: { commit: commit },
            },
            { pageName: 'path', text: path.split('/').pop() },
          ]}
        />
      }
    />
  )
}

CommitFileView.propTypes = {
  diff: PropTypes.shape({
    baseCoverage: PropTypes.shape({
      coverage: PropTypes.number,
    }),
    headCoverage: PropTypes.shape({
      coverage: PropTypes.number,
    }),
  }),
}

export default CommitFileView
