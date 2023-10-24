import { Divider, Typography } from "antd";
import React from "react";
import { NODE_URL } from "../../constants";
import { ClockCircleOutlined } from '@ant-design/icons';


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

  return <div style={{ textAlign: 'left' }} className='primary-text'>

    <Typography.Text strong className='primary-text' style={{ fontSize: '1.2em' }}>
      <ClockCircleOutlined style={{ marginRight: '5px' }} />
      {creationTx ? 'Created' : 'Updated'
      } at{' '}
      {new Date(Number(tx.blockTimestamp)).toLocaleString()}
      {' '}(Block #{tx.block.toString()})

    </Typography.Text>
    <p>Transaction Hash: <a href={NODE_URL + '/cosmos/tx/v1beta1/txs/' + tx.txHash} target='_blank' rel='noopener noreferrer'>
      {tx.txHash}
    </a></p>
    <Divider />
  </div>
}