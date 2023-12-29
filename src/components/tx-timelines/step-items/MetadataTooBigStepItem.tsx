import { Divider, Typography } from "antd"
import { EmptyStepItem, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext"

export const MetadataTooBigStepItem = () => {
  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  const txTimelineContext = useTxTimelineContext();
  const size = txTimelineContext.metadataSize;

  //100 MB is too big. It will fail bc req is too big for API.
  return size > 1048576 * 100 ? {
    title: 'Metadata Too Large',
    description: ``,
    node: () => <div>
      <div style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <Typography.Text className='primary-text' style={{ fontSize: 16 }}>{`Oops! Your metadata is too large (${formatBytes(size)}). Please reduce the size of the metadata to under 1MB and try again.`}</Typography.Text>
        <Divider />
        <Typography.Text className='primary-text' style={{ fontSize: 16 }}>{`
                    Some recommended ways to reduce the size of your metadata are:
                `}</Typography.Text>
        <br />
        <Typography.Text className='primary-text' style={{ fontSize: 16 }}>{`
                    - Reduce the size of your images.
                `}</Typography.Text>
        <br />
        <Typography.Text className='primary-text' style={{ fontSize: 16 }}>{`
                    - Reduce the number of badges with unique metadata. If two badges have the same exact metadata, that metadata is only stored once.
                `}</Typography.Text>
        <br />
        <Typography.Text className='primary-text' style={{ fontSize: 16 }}>{`
                    - Reduce the number of badges in your collection.
                `}</Typography.Text>
      </div>
    </div>,
    disabled: true
  } : EmptyStepItem
}