import { DeleteOutlined } from "@ant-design/icons";
import { Avatar, Col, Empty, Row, Tooltip, Typography } from "antd";
import { Numberify, TransferWithIncrements } from "bitbadgesjs-utils";
import { useEffect, useRef, useState } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { AddressDisplayList } from "../address/AddressDisplayList";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { Pagination } from "../common/Pagination";

const { Text } = Typography

//TransferDisplay handles normal Transfers[] as well as TransferWithIncrements[] for the mint proces
export function TransferDisplay({
  transfers,
  collectionId,
  from,
  hideAddresses,
  hideBalances,
  setTransfers,
  deletable,

}: {
  collectionId: bigint;
  from: string[],
  transfers: TransferWithIncrements<bigint>[],
  hideAddresses?: boolean;
  hideBalances?: boolean;
  setTransfers?: (transfers: TransferWithIncrements<bigint>[]) => void;
  deletable?: boolean;
}) {
  const accounts = useAccountsContext();
  const accountsRef = useRef(accounts);
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

  const [page, setPage] = useState(0);

  const transfer = transfers[page];

  useEffect(() => {
    accountsRef.current.fetchAccounts(transfer.toAddresses);
  }, [transfer.toAddresses]);


  const toLength = transfer.toAddressesLength ? transfer.toAddressesLength : BigInt(transfer.toAddresses.length);

  return <div style={{ marginTop: 4 }}    >
    {
      transfers.length === 0 ? <div style={{ textAlign: 'center' }}>
        <Empty description='None'
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 20 }} className='primary-text'
        />
      </div> : <Pagination currPage={page} onChange={setPage} total={transfers.length} pageSize={1} />
    }
    <br />

    <div >
      {!hideBalances && <div>
        {collection &&
          <BalanceDisplay
            message={'Badges Transferred'}
            collectionId={collectionId}
            balance={{
              balances: transfer.balances,
              approvals: []
            }}
            numIncrements={toLength}
            incrementIdsBy={transfer.incrementIdsBy}

          />}
      </div>}

      {
        !hideAddresses && <div>
          <br />
          <Row>
            <Col md={11} sm={24} xs={24} style={{ textAlign: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <AddressDisplayList
                users={from}
                toLength={Numberify(toLength)}
                title={'From'}
                fontSize={18}
                center
              />
            </Col>
            <Col md={2} xs={1} sm={1} style={{ textAlign: 'center', justifyContent: 'center', minHeight: 20 }}>
              {/* <FontAwesomeIcon icon={faArrowRight} /> */}
            </Col>

            <Col md={11} sm={24} xs={24} style={{ textAlign: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <AddressDisplayList
                users={transfer.toAddresses}
                toLength={Numberify(toLength)}
                title={'To'}
                fontSize={18}
                center
              />
              {!!toLength && toLength > 0 &&
                <>
                  <Text strong>
                    {`First ${toLength} users to claim`}
                  </Text>
                </>}
            </Col>
          </Row>
        </div>
      }
    </div >
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

}