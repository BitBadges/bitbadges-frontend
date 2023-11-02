import { Col, Row } from "antd";
import { getUintRangesForAllBadgeIdsInCollection } from "bitbadgesjs-utils";
import HtmlToReact from 'html-to-react';
import MarkdownIt from 'markdown-it';

import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { DistributionOverview } from "../badges/DistributionCard";
import { MetadataDisplay } from "../badges/MetadataInfoDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { BalanceOverview } from "./BalancesInfo";
import { PermissionsOverview } from "./PermissionsInfo";
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext";

const mdParser = new MarkdownIt(/* Markdown-it options */);

export function OverviewTab({
  collectionId,
}: {
  collectionId: bigint,
}) {

  const collection = useCollection(collectionId)

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
            badgeIds={getUintRangesForAllBadgeIdsInCollection(collection)}
            maxWidth={'100%'}
          // doNotAdaptToWidth
          />
        </InformationDisplayCard>
      </div>
      <br />
    </>}

    <Row
      style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Col md={12} sm={24} xs={24} style={{ paddingRight: 4, paddingLeft: 4 }}>
        {collectionMetadata?.description && <>
          <InformationDisplayCard
            title={<>About</>}
            span={24}
          >
            <div style={{ maxHeight: 400, overflow: 'auto', }} >
              <div className='custom-html-style primary-text' id="description" >
                {reactElement}
              </div>
            </div>
          </InformationDisplayCard>
          <br />
        </>}
        <MetadataDisplay
          collectionId={collectionId}
          span={24}
        />
        <br />
        <PermissionsOverview
          collectionId={collectionId}
          span={24}
        />
      </Col>

      <Col md={12} sm={24} xs={24} style={{ paddingRight: 4, paddingLeft: 4 }}>

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