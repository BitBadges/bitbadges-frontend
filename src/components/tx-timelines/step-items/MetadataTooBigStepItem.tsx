import { Divider, Typography } from "antd"
import { PRIMARY_TEXT } from "../../../constants"
import { EmptyStepItem } from "../TxTimeline"

export const MetadataTooBigStepItem = (
    size: number
) => {


    function formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return '0 Bytes'

        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }


    return size > 1048576 ? {
        title: 'Metadata Too Large',
        description: ``,
        node: <div>
            <div style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <Typography.Text style={{ color: PRIMARY_TEXT, fontSize: 16 }}>{`Oops! Your metadata is too large (${formatBytes(size)}). Please reduce the size of the metadata to under 1MB and try again.`}</Typography.Text>
                <Divider />
                <Typography.Text style={{ color: PRIMARY_TEXT, fontSize: 16 }}>{`
                    Some recommended ways to reduce the size of your metadata are:
                `}</Typography.Text>
                <br />
                <Typography.Text style={{ color: PRIMARY_TEXT, fontSize: 16 }}>{`
                    - Reduce the size of your images.
                `}</Typography.Text>
                <br />
                <Typography.Text style={{ color: PRIMARY_TEXT, fontSize: 16 }}>{`
                    - Reduce the number of badges with unique metadata. If two badges have the same exact metadata, that metadata is only stored once.
                `}</Typography.Text>
                <br />
                <Typography.Text style={{ color: PRIMARY_TEXT, fontSize: 16 }}>{`
                    - Reduce the number of badges in your collection.
                `}</Typography.Text>
            </div>
        </div>,
        disabled: true
    } : EmptyStepItem
}