import { Col, Row } from "antd";
import { UserBalance } from "bitbadgesjs-proto";
import { BalanceDisplay } from "./BalanceDisplay";

export function BalanceBeforeAndAfter({
  balance,
  newBalance,
  partyString,
  hideTitle,
  beforeMessage,
  afterMessage,
  collectionId,

}: {
  balance: UserBalance<bigint>;
  newBalance: UserBalance<bigint>
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
      <Col style={{ margin: 20 }} xs={24} sm={24} md={12} lg={12} xl={12}>
        <BalanceDisplay
          collectionId={collectionId}
          balance={balance}
          message={beforeMessage ? beforeMessage : 'Before'}

        />
      </Col>
      <Col style={{ margin: 20 }} xs={24} sm={24} md={12} lg={12} xl={12}>
        <BalanceDisplay
          collectionId={collectionId}
          balance={newBalance}
          message={afterMessage ? afterMessage : 'After'}

        />
      </Col>
    </Row>
  </>
}