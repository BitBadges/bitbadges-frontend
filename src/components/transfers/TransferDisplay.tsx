import { DeleteOutlined } from "@ant-design/icons";
import { Avatar, Empty, Tooltip, Typography } from "antd";
import { TransferWithIncrements } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { AddressDisplayList } from "../address/AddressDisplayList";
import { BalanceDisplay } from "../badges/balances/BalanceDisplay";
import { Pagination } from "../common/Pagination";

const { Text } = Typography

//TransferDisplay handles normal Transfers[] as well as TransferWithIncrements[] for the mint proces
export function TransferDisplay({
  transfers,
  collectionId,
  hideAddresses,
  hideBalances,
  setTransfers,
  initiatedBy,
  deletable,
}: {
  collectionId: bigint;
  transfers: TransferWithIncrements<bigint>[],
  hideAddresses?: boolean;
  hideBalances?: boolean;
  setTransfers?: (transfers: TransferWithIncrements<bigint>[]) => void;
  deletable?: boolean;
  initiatedBy?: string
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]

  const [page, setPage] = useState(0);


  const transfer = transfers.length > 0 ? transfers[page] : undefined;
  const toLength = transfer?.toAddressesLength ? transfer.toAddressesLength : BigInt(transfer?.toAddresses.length ?? 0n);

  return <><div style={{ marginTop: 4 }}    >
    {
      transfers.length === 0 ? <div style={{ textAlign: 'center' }}>
        <Empty description='None'
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 20 }} className='primary-text'
        />
      </div> : <Pagination currPage={page} onChange={setPage} total={transfers.length} pageSize={1} />
    }
    <br />

    {!hideBalances && transfer && <div>
      {collection &&
        <BalanceDisplay
          message={'Badges Transferred'}
          collectionId={collectionId}
          // balances={[{ amount: 1n, badgeIds: [{ start: 1n, end: 1n }], ownershipTimes: [{ start: 1n, end: 1n }] }]}
          balances={transfer.balances}
          numIncrements={toLength}
          incrementBadgeIdsBy={transfer.incrementBadgeIdsBy}
          incrementOwnershipTimesBy={transfer.incrementOwnershipTimesBy}
        />}
    </div>}


    {
      !hideAddresses && transfer && <div className="full-width">
        <br />
        <div className="flex-center flex-wrap">
          <div style={{ minWidth: 250, textAlign: 'center', justifyContent: 'center', flexDirection: 'column', }} className='primary-text'>
            <AddressDisplayList
              users={[transfer.from]}
              // toLength={Numberify(toLength)}
              title={'From'}
              fontSize={15}
              center
            />
            {initiatedBy && transfer.from !== initiatedBy && <>
              <br />
              <AddressDisplayList
                users={[initiatedBy]}
                // toLength={Numberify(toLength)}
                title={'Initiated By'}
                fontSize={15}
                center
              /><br /></>}
          </div>

          <div style={{ minWidth: 250, textAlign: 'center', justifyContent: 'center', flexDirection: 'column', }} className='primary-text'>
            <AddressDisplayList
              users={transfer.toAddresses}
              // toLength={Numberify(toLength)}
              title={'To'}
              fontSize={15}
              center
            />
            {!!transfer?.toAddressesLength && transfer?.toAddressesLength > 0 &&
              <>
                <Text strong className='secondary-text' style={{ fontSize: 14 }}>
                  {`${toLength} Claimees`}
                </Text>
              </>}
          </div>
        </div>
      </div>
    }
    {deletable && setTransfers && transfers.length > 0 && <div style={{ textAlign: 'center' }}>
      <br />
      <Avatar
        className='screen-button'
        style={{ cursor: 'pointer', fontSize: 14 }}
        onClick={() => {
          setTransfers(transfers.filter((_, index) => index !== page));
        }}>
        <Tooltip title='Delete Transfer'>
          <DeleteOutlined />
        </Tooltip>
      </Avatar>
      <br />
    </div>}
  </div>
  </>

}