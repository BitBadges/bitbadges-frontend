import { BitBadgeCollection, UserBalance } from "bitbadgesjs-utils";
import { BalanceDisplay } from "./BalanceDisplay";
import { Col, Row } from "antd";

export function BalanceBeforeAndAfter({
  balance,
  newBalance,
  partyString,
  hideTitle,
  beforeMessage,
  afterMessage,
  collection,
  updateMetadataForBadgeIdsDirectlyFromUriIfAbsent
}: {
  balance: UserBalance;
  newBalance: UserBalance;
  partyString: string;
  hideTitle?: boolean;
  collection: BitBadgeCollection;
  updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => Promise<void>;
  beforeMessage?: string;
  afterMessage?: string;
}) {
  return <>
    {!hideTitle &&
      <div className='flex-center' style={{
        fontSize: 15
      }}>
        <b>{partyString} Badge Balances</b>
      </div>}

    <Row>
      <Col style={{ margin: 20 }} xs={24} sm={24} md={12} lg={12} xl={12}>
        <BalanceDisplay
          collection={collection}
          balance={balance}
          message={beforeMessage ? beforeMessage : 'Before'}
          updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
        />
      </Col>
      <Col style={{ margin: 20 }} xs={24} sm={24} md={12} lg={12} xl={12}>
        <BalanceDisplay
          collection={collection}
          balance={newBalance}
          message={afterMessage ? afterMessage : 'After'}
          updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
        />
      </Col>
    </Row>
  </>
}