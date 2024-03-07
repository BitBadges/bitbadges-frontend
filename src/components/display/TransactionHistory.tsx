import { ClockCircleOutlined } from '@ant-design/icons';
import { Divider, Typography } from 'antd';
import { EXPLORER_URL } from '../../constants';

export function TxHistory({
  tx,
  creationTx
}: {
  tx: {
    block: bigint;
    blockTimestamp: bigint;
    txHash: string;
  };
  creationTx: boolean;
}) {
  return (
    <div style={{ textAlign: 'left' }} className="primary-text">
      <Typography.Text strong className="primary-text" style={{ fontSize: '1.2em' }}>
        <ClockCircleOutlined style={{ marginRight: '5px' }} />
        {creationTx ? 'Created' : 'Updated'} at {new Date(Number(tx.blockTimestamp)).toLocaleString()} (Block #{tx.block.toString()})
      </Typography.Text>
      {tx.txHash && (
        <p>
          <a
            href={EXPLORER_URL + '/BitBadges/tx/' + tx.txHash}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-500 hover:underline"
          >
            See Blockchain Transaction
          </a>
        </p>
      )}
      <Divider />
    </div>
  );
}
