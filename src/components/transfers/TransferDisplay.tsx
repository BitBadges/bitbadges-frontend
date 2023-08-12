import { DeleteOutlined } from "@ant-design/icons";
import { Avatar, Empty, Tooltip, Typography } from "antd";
import { Numberify, TransferWithIncrements } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { INFINITE_LOOP_MODE } from "../../constants";
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
  deletable,
}: {
  collectionId: bigint;
  transfers: TransferWithIncrements<bigint>[],
  hideAddresses?: boolean;
  hideBalances?: boolean;
  setTransfers?: (transfers: TransferWithIncrements<bigint>[]) => void;
  deletable?: boolean;
}) {
  const accounts = useAccountsContext();

  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]

  const [page, setPage] = useState(0);


  const transfer = transfers.length > 0 ? transfers[page] : undefined;


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: transfer display, fetch accounts ');
    if (!transfer) return;

    accounts.fetchAccounts(transfer.toAddresses);
  }, [transfer]);


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
          balances={[{ amount: 1n, badgeIds: [{ start: 1n, end: 1n }], ownershipTimes: [{ start: 1n, end: 1n }] }]}
          numIncrements={toLength}
          incrementBadgeIdsBy={transfer.incrementBadgeIdsBy}
          incrementOwnershipTimesBy={transfer.incrementOwnershipTimesBy}

        />}
    </div>}


    {
      !hideAddresses && transfer && <div className="full-width">
        <br />
        <div className="flex-center flex-wrap">
          <div style={{ minWidth: 250, textAlign: 'center', justifyContent: 'center', flexDirection: 'column', margin: 20 }} className='primary-text'>
            <AddressDisplayList
              users={[transfer.from]}
              toLength={Numberify(toLength)}
              title={'From'}
              fontSize={15}
              center
            />
          </div>

          <div style={{ minWidth: 250, textAlign: 'center', justifyContent: 'center', flexDirection: 'column', margin: 20 }} className='primary-text'>
            <AddressDisplayList
              users={transfer.toAddresses}
              toLength={Numberify(toLength)}
              title={'To'}
              fontSize={15}
              center
            />
            {!!transfer?.toAddressesLength && transfer?.toAddressesLength > 0 &&
              <>
                <Text strong className='secondary-text' style={{ fontSize: 14 }}>
                  {`First ${toLength} to Claim`}
                </Text>
              </>}
          </div>
        </div>
      </div>
    }
    {deletable && setTransfers && <div style={{ textAlign: 'center' }}>
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