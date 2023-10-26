import { ClockCircleOutlined } from '@ant-design/icons';
import { Divider, Typography } from "antd";
import { NODE_URL } from "../../constants";


export function TxHistory({
  tx,
  creationTx
}: {
  tx: {
    block: bigint,
    blockTimestamp: bigint,
    txHash: string
  },
  creationTx: boolean
}) {

  return <div style={{ textAlign: 'left' }} className='dark:text-white'>

    <Typography.Text strong className='dark:text-white' style={{ fontSize: '1.2em' }}>
      <ClockCircleOutlined style={{ marginRight: '5px' }} />
      {creationTx ? 'Created' : 'Updated'
      } at{' '}
      {new Date(Number(tx.blockTimestamp)).toLocaleString()}
      {' '}(Block #{tx.block.toString()})

    </Typography.Text>
    <p><a href={NODE_URL + '/cosmos/tx/v1beta1/txs/' + tx.txHash} target='_blank' rel='noopener noreferrer' className="text-blue-600 dark:text-blue-500 hover:underline">
      See Blockchain Transaction
    </a>
    </p>
    <Divider />
  </div>
}