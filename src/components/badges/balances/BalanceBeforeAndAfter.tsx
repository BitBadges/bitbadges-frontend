import { Col, Row } from "antd";
import { Balance } from "bitbadgesjs-proto";
import { BalanceDisplay } from "./BalanceDisplay";

export function BalanceBeforeAndAfter({
  balances,
  newBalances,
  partyString,
  hideTitle,
  beforeMessage,
  afterMessage,
  collectionId,

}: {
  balances: Balance<bigint>[];
  newBalances: Balance<bigint>[]
  partyString: string;
  hideTitle?: boolean;
  collectionId: bigint;
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
      <Col style={{ padding: 20 }} xs={24} sm={24} md={12} lg={12} xl={12}>
        <BalanceDisplay
          collectionId={collectionId}
          balances={balances}
          message={beforeMessage ? beforeMessage : 'Before'}

        />
      </Col>
      <Col style={{ padding: 20 }} xs={24} sm={24} md={12} lg={12} xl={12}>
        <BalanceDisplay
          collectionId={collectionId}
          balances={newBalances}
          message={afterMessage ? afterMessage : 'After'}

        />
      </Col>
    </Row>
  </>
}