import { GiftOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { faSnowflake, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Row, Tooltip, Typography } from "antd";
import { UserBalance } from "bitbadgesjs-proto";
import { AllAddressesTransferMapping, getIdRangesForAllBadgeIdsInCollection } from "bitbadgesjs-utils";
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { MetadataDisplay } from "../badges/MetadataInfoDisplay";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { ButtonDisplay } from "../display/ButtonDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { TableRow } from "../display/TableRow";
import { BalanceOverview } from "./BalancesInfo";
import { PermissionsOverview } from "./PermissionsInfo";
import { MSG_PREVIEW_ID } from "../tx-timelines/TxTimeline";

const mdParser = new MarkdownIt(/* Markdown-it options */);

export function OverviewTab({
  collectionId,
  addressOrUsername,
  setTab
}: {
  collectionId: bigint,
  addressOrUsername?: string,
  setTab: (tab: string) => void;
}) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);
  const isPreview = collectionId === MSG_PREVIEW_ID;

  if (!collection) return <></>;
  const collectionMetadata = collection?.collectionMetadata;

  const isNonTransferable = !collection.allowedTransfers?.length;
  const isTransferable = collection.allowedTransfers?.length === 1
    && JSON.stringify(collection.allowedTransfers[0].to) === JSON.stringify(AllAddressesTransferMapping.to)
    && JSON.stringify(collection.allowedTransfers[0].from) === JSON.stringify(AllAddressesTransferMapping.from);

  let claimableBalances: UserBalance<bigint> = {
    balances: [],
    approvals: []
  };

  // EXPERIMENTAL STANDARD
  const isOffChainBalances = collection && collection.balancesUri ? true : false;

  const HtmlToReactParser = HtmlToReact.Parser();
  const reactElement = HtmlToReactParser.parse(mdParser.render(collectionMetadata?.description ?? ''));


  return <>
    {<>
      <div style={{ paddingRight: 4, paddingLeft: 4 }}>
        <InformationDisplayCard
          title="Badges in Collection"
        >
          <BadgeAvatarDisplay
            showIds
            size={75}
            collectionId={collectionId}
            addressOrUsernameToShowBalance={addressOrUsername}
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
          collectionId={collectionId}
          span={24}
        />
        {!isOffChainBalances && <>
          <br />
          <InformationDisplayCard
            title={<>
              Transferability
              <Tooltip title="Which badge owners can transfer to which badge owners?">
                <InfoCircleOutlined style={{ marginLeft: 4 }} />
              </Tooltip>
              {!collection.permissions.CanUpdateAllowed ?
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
                isTransferable ? <Typography.Text className='primary-text' style={{ fontSize: 20 }}>Transferable</Typography.Text> : <>
                  {isNonTransferable ? <Typography.Text className='primary-text' style={{ fontSize: 20 }}>Non-Transferable</Typography.Text>
                    : <>{
                      collection.allowedTransfers.map((transfer) => {
                        return <>
                          The addresses {transfer.from.addresses.map((range, index) => {
                            return <span key={index}>{index > 0 && ','} {range}</span>
                          })} {transfer.from.managerOptions === 1n ? '(including the manager)' : transfer.from.managerOptions === 2n ? '(excluding the manager)' : ''} cannot
                          transfer to the addresses with account IDs {transfer.to.addresses.map((range, index) => {
                            return <span key={index}>{index > 0 && ','} {range}</span>
                          })} {transfer.to.managerOptions === 1n ? '(including the manager)' : transfer.to.managerOptions === 2n ? '(excluding the manager)' : ''}.
                          <br />
                        </>
                      })
                    }</>
                  }
                </>
              }
            </div>
          </InformationDisplayCard>
        </>}
        <br />
        <PermissionsOverview
          collectionId={collectionId}
          span={24}
          isOffChainBalances={isOffChainBalances}
        />
      </Col>

      <Col md={12} sm={24} xs={24} style={{ paddingRight: 4, paddingLeft: 4 }}>
        {collectionMetadata?.description && <>
          <InformationDisplayCard
            title={<>About</>}
            span={24}
          >
            <div style={{ maxHeight: 400, overflow: 'auto', textAlign: 'left' }} >
              <div className='custom-html-style primary-text' id="description" >
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
            <TableRow label={"Number of Badges"} value={`${collection.nextBadgeId - 1n}`} labelSpan={12} valueSpan={12} />
            {collection && <TableRow label={"Badge Supplys"} value={
              <div style={{ float: 'right' }}>
                <BalanceDisplay
                  hideBadges
                  floatToRight
                  collectionId={collectionId}
                  hideMessage
                  balance={{
                    balances: collection.maxSupplys, approvals: []
                  }}
                />
              </div>
            } labelSpan={12} valueSpan={12} />
            }
            {!isOffChainBalances && <>
              {collection && <TableRow label={"Unminted"} value={
                <div style={{ float: 'right' }}>
                  <BalanceDisplay
                    floatToRight
                    hideBadges
                    collectionId={collectionId}
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
                    collectionId={collectionId}
                    hideMessage
                    balance={claimableBalances} />
                </div>
              } labelSpan={12} valueSpan={12} />}

              <div>
                <ButtonDisplay buttons={[{
                  name: <>Claim</>,
                  icon: <GiftOutlined />,
                  onClick: () => {
                    setTab('claims')
                  },
                  tooltipMessage: `Claim this badge!`,
                  disabled: isPreview
                }]} />
              </div>
            </>}
          </InformationDisplayCard>
          <br />
          <InformationDisplayCard
            title={<>Balance Checker</>}
            span={24}
          >
            <div className='flex'>
              <BalanceOverview
                collectionId={collectionId}
              />
            </div>
          </InformationDisplayCard>
        </>}
      </Col>
    </Row >
  </>
}