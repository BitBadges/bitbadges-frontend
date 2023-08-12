import { Col, Row } from "antd";
import { getUintRangesForAllBadgeIdsInCollection } from "bitbadgesjs-utils";
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { DistributionOverview } from "../badges/DistributionCard";
import { MetadataDisplay } from "../badges/MetadataInfoDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { BalanceOverview } from "./BalancesInfo";
import { PermissionsOverview } from "./PermissionsInfo";

const mdParser = new MarkdownIt(/* Markdown-it options */);

export function OverviewTab({
  collectionId,
  addressOrUsername,
}: {
  collectionId: bigint,
  addressOrUsername?: string,
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]

  if (!collection) return <></>;
  const collectionMetadata = collection?.cachedCollectionMetadata;

  const HtmlToReactParser = HtmlToReact.Parser();
  const reactElement = HtmlToReactParser.parse(mdParser.render(collectionMetadata?.description ?? ''));

  return <>
    {<>
      <div style={{ paddingRight: 4, paddingLeft: 4 }}>
        <InformationDisplayCard
          title="Badges"
        >
          <BadgeAvatarDisplay
            showIds
            size={75}
            collectionId={collectionId}
            addressOrUsernameToShowBalance={addressOrUsername}
            badgeIds={getUintRangesForAllBadgeIdsInCollection(collection)}
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
        {/* {!isOffChainBalances && <>
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
        </>} */}
        <br />
        <PermissionsOverview
          collectionId={collectionId}
          span={24}
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
          <DistributionOverview
            collectionId={collectionId}
            span={24}
          />
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