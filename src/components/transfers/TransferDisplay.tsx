import { Empty, Typography } from 'antd';
import { TransferWithIncrements } from 'bitbadgesjs-sdk';
import { useState } from 'react';

import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { AddressDisplayList } from '../address/AddressDisplayList';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { Pagination } from '../common/Pagination';
import { InformationDisplayCard } from '../display/InformationDisplayCard';

const { Text } = Typography;

//TransferDisplay handles normal Transfers[] as well as TransferWithIncrements[] for the mint proces
export function TransferDisplay({
  transfers,
  collectionId,
  initiatedBy
}: {
  collectionId: bigint;
  transfers: Array<TransferWithIncrements<bigint>>;
  initiatedBy?: string;
}) {
  const collection = useCollection(collectionId);
  const isBalanceUpdate = collection?.balancesType === 'Off-Chain - Indexed';

  const [page, setPage] = useState(1);

  const transfer = transfers.length > 0 ? transfers[page - 1] : undefined;
  const toLength = transfer?.toAddressesLength ? transfer.toAddressesLength : BigInt(transfer?.toAddresses.length ?? 0n);

  return (
    <InformationDisplayCard inheritBg noBorder title="">
      <div style={{ marginTop: 4 }}>
        {toLength <= 0 ? (
          <div style={{ textAlign: 'center' }}>
            <Empty description="No badges transferred." image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 20 }} className="primary-text" />
          </div>
        ) : (
          <Pagination currPage={page} onChange={setPage} total={transfers.length} pageSize={1} />
        )}

        {transfer && toLength > 0 && (
          <div className="full-width">
            {collection && (
              <BalanceDisplay
                message={'All Badges Transferred'}
                hideMessage
                collectionId={collectionId}
                balances={transfer.balances}
                numIncrements={toLength}
                incrementBadgeIdsBy={transfer.incrementBadgeIdsBy}
                incrementOwnershipTimesBy={transfer.incrementOwnershipTimesBy}
              />
            )}
          </div>
        )}

        {transfer && (
          <div className="full-width">
            <br />
            <div className="flex-center flex-wrap">
              {!isBalanceUpdate && (
                <div
                  style={{
                    minWidth: 250,
                    textAlign: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}
                  className="primary-text"
                >
                  <br />
                  <AddressDisplayList
                    users={[transfer.from]}
                    // toLength={Numberify(toLength)}
                    title={'From'}
                    fontSize={15}
                    center
                  />
                </div>
              )}

              <div
                style={{
                  minWidth: 250,
                  textAlign: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
                className="primary-text"
              >
                <br />{' '}
                <AddressDisplayList
                  users={transfer.toAddresses}
                  // toLength={Numberify(toLength)}
                  title={'To'}
                  fontSize={15}
                  center
                />
                {!!transfer?.toAddressesLength && transfer?.toAddressesLength > 0 && (
                  <>
                    <Text strong className="secondary-text" style={{ fontSize: 14 }}>
                      {`${toLength} Claimees`}
                    </Text>
                  </>
                )}
              </div>

              {initiatedBy && transfer.from !== initiatedBy && (
                <>
                  {' '}
                  <div
                    style={{
                      minWidth: 250,
                      textAlign: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}
                    className="primary-text"
                  >
                    <br />
                    <AddressDisplayList
                      users={[initiatedBy]}
                      // toLength={Numberify(toLength)}
                      title={'Initiated By'}
                      fontSize={15}
                      center
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </InformationDisplayCard>
  );
}
