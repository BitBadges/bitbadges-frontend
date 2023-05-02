import { GiftOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { faSnowflake, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Row, Tooltip, Typography } from "antd";
import { AddBalancesForIdRanges, AllAddressesTransferMapping, BitBadgeCollection, UserBalance, getIdRangesForAllBadgeIdsInCollection } from "bitbadgesjs-utils";
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { PRIMARY_TEXT } from '../../constants';
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { MetadataDisplay } from "../badges/MetadataInfoDisplay";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { ButtonDisplay } from "../display/ButtonDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";
import { BalanceOverview } from "./BalancesInfo";
import { PermissionsOverview } from "./PermissionsInfo";


const mdParser = new MarkdownIt(/* Markdown-it options */);

export function OverviewTab({
  collection,
  refreshUserBalance,
  userBalance,
  setTab,
  isPreview
}: {
  collection: BitBadgeCollection | undefined;
  refreshUserBalance: () => Promise<void>;
  userBalance: UserBalance | undefined;
  setTab: (tab: string) => void;
  isPreview?: boolean;
}) {
  if (!collection) return <></>;
  const collectionMetadata = collection?.collectionMetadata;


  const isTransferable = !collection.disallowedTransfers?.length;
  const isNonTransferable = collection.disallowedTransfers?.length === 1
    && JSON.stringify(collection.disallowedTransfers[0].to) === JSON.stringify(AllAddressesTransferMapping.to)
    && JSON.stringify(collection.disallowedTransfers[0].from) === JSON.stringify(AllAddressesTransferMapping.from);

  let claimableBalances: UserBalance = {
    balances: [],
    approvals: []
  };

  for (const claim of collection.claims) {
    for (const balance of claim.balances) {
      claimableBalances = AddBalancesForIdRanges(claimableBalances, balance.badgeIds, balance.balance);
    }
  }

  const activeClaims = collection ? collection?.claims.filter((x, _idx) => {
    if (x.balances.length > 0) {
      return true;
    }
    return false;
  }) : [];

  // EXPERIMENTAL STANDARD
  const isUserList = collection && collection.standard === 1;

  const HtmlToReactParser = HtmlToReact.Parser();
  const reactElement = HtmlToReactParser.parse(mdParser.render(collectionMetadata?.description));


  return <>
    {<>
      <div style={{ paddingRight: 4, paddingLeft: 4 }}>
        <InformationDisplayCard
          title="Badges in Collection"
        >
          <BadgeAvatarDisplay
            showIds
            size={75}
            collection={collection}
            userBalance={userBalance}
            badgeIds={getIdRangesForAllBadgeIdsInCollection(collection)}
            maxWidth={'100%'}
          />
        </InformationDisplayCard>
      </div>
      <br />
    </>}


    <br />
    <Row
      style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Col md={12} sm={24} xs={24} style={{ paddingRight: 4, paddingLeft: 4 }}>
        <MetadataDisplay
          collection={collection}
          metadata={collectionMetadata}
          isCollectionInfo
          span={24}
        />
        {!isUserList && <>
          <br />
          <InformationDisplayCard
            title={<>
              Transferability
              <Tooltip title="Which badge owners can transfer to which badge owners?">
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
              {!collection.permissions.CanUpdateDisallowed ?
                <Tooltip title="The transferability is frozen and can never be changed.">
                  <FontAwesomeIcon style={{ marginLeft: 4 }} icon={faSnowflake} />
                </Tooltip> :
                <Tooltip title="Note that the manager can change the transferability.">
                  <FontAwesomeIcon style={{ marginLeft: 4 }} icon={faUserPen} />

                </Tooltip>
              }
            </>}
          >
            <div style={{ margin: 8 }}>
              {
                isTransferable ? <Typography.Text style={{ fontSize: 20, color: PRIMARY_TEXT }}>Transferable</Typography.Text> : <>
                  {isNonTransferable ? <Typography.Text style={{ fontSize: 20, color: PRIMARY_TEXT }}>Non-Transferable</Typography.Text>
                    : <>                                        {
                      collection.disallowedTransfers.map((transfer) => {
                        return <>
                          The addresses with account IDs {transfer.from.accountIds.map((range, index) => {
                            return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                          })} {transfer.from.options === 1 ? '(including the manager)' : transfer.from.options === 2 ? '(excluding the manager)' : ''} cannot
                          transfer to the addresses with account IDs {transfer.to.accountIds.map((range, index) => {
                            return <span key={index}>{index > 0 && ','} {range.start} to {range.end}</span>
                          })} {transfer.to.options === 1 ? '(including the manager)' : transfer.to.options === 2 ? '(excluding the manager)' : ''}.
                          <br />
                        </>
                      })
                    }
                    </>
                  }
                </>
              }
            </div>
          </InformationDisplayCard>
        </>}
        <br />
        <PermissionsOverview
          collection={collection}
          span={24}
          isUserList={isUserList}
        />
      </Col>

      <Col md={12} sm={24} xs={24} style={{ paddingRight: 4, paddingLeft: 4 }}>
        {collectionMetadata?.description && <>
          <InformationDisplayCard
            title={<>About</>}
            span={24}
          >
            <div style={{ maxHeight: 400, overflow: 'auto', textAlign: 'left' }} >
              <div className='custom-html-style' id="description" style={{ color: PRIMARY_TEXT }} >

                {reactElement}
              </div>
            </div>
          </InformationDisplayCard>
          <br />
        </>}
        <Col md={0} sm={24} xs={24} style={{ height: 20 }} />
        {<>
          <InformationDisplayCard
            title={<>Distribution</>}
            span={24}
          >
            <TableRow label={"Number of Badges"} value={collection.nextBadgeId - 1} labelSpan={12} valueSpan={12} />
            {collection && <TableRow label={"Badge Supplys"} value={
              <div style={{ float: 'right' }}>
                <BalanceDisplay
                  hideBadges
                  floatToRight
                  collection={collection}
                  hideMessage
                  balance={{
                    balances: collection.maxSupplys, approvals: []
                  }}
                />
              </div>
            } labelSpan={12} valueSpan={12} />
            }
            {!isUserList && <>
              {collection && <TableRow label={"Unminted"} value={
                <div style={{ float: 'right' }}>
                  <BalanceDisplay
                    floatToRight
                    hideBadges
                    collection={collection}
                    hideMessage
                    balance={{
                      balances: collection.unmintedSupplys, approvals: []
                    }} />
                </div>
              } labelSpan={12} valueSpan={12} />}
              {collection && <TableRow label={"Claimable"} value={
                <div style={{ float: 'right' }}>
                  <BalanceDisplay
                    hideBadges
                    floatToRight
                    collection={collection}
                    hideMessage
                    balance={claimableBalances} />

                </div>
              } labelSpan={12} valueSpan={12} />}

              {activeClaims.length > 0 && <div>
                <ButtonDisplay buttons={[{
                  name: <>Claim ({`${activeClaims.length}`})</>,
                  icon: <GiftOutlined />,
                  onClick: () => {
                    setTab('claims')
                  },
                  // count: hasViewedClaimTab ? undefined : activeClaimIds.length,
                  tooltipMessage: `Claim this badge!`,
                  disabled: isPreview
                }]} />
              </div>}
            </>}
          </InformationDisplayCard>
          <br />
          <InformationDisplayCard
            title={<>Balance Checker</>}
            span={24}
          >
            <div style={{ display: 'flex' }}>
              <BalanceOverview
                collection={collection}
                refreshUserBalance={refreshUserBalance}
                balance={userBalance}
                setTab={setTab}
                isPreview={isPreview}
              />
            </div>
          </InformationDisplayCard>
        </>}
      </Col>
    </Row >
  </>
}