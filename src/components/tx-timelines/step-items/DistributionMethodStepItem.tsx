import { Avatar, Col, Divider, Empty, Row } from "antd";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { TransferabilityTab } from "../../collection-page/TransferabilityTab";
import { CreateClaims } from "../form-items/CreateClaims";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { InfoCircleOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { getFirstMatchForCollectionApprovedTransfers, isInAddressMapping, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";

export function DistributionMethodStepItem() {

  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];

  const txTimelineContext = useTxTimelineContext();
  // const approvedTransfers = txTimelineContext.approvedTransfersToAdd;
  // const transfers = txTimelineContext.transfers;
  const updateCollectionApprovedTransfers = txTimelineContext.updateCollectionApprovedTransfers;
  const setUpdateCollectionApprovedTransfers = txTimelineContext.setUpdateCollectionApprovedTransfers;

  const isOffChainBalances = collection?.balancesType === "Off-Chain";

  const [visible, setVisible] = useState(false);

  if (!collection) return EmptyStepItem;

  let firstMatches = getFirstMatchForCollectionApprovedTransfers(collection?.collectionApprovedTransfers || [], true);
  const maxBadgeId = getTotalNumberOfBadges(collection);
  let unhandledBadges = [{ start: 1n, end: maxBadgeId }]

  for (const match of firstMatches) {
    if (match.allowedCombinations[0].isApproved && isInAddressMapping(match.fromMapping, 'Mint')) {
      const [remaining] = removeUintRangeFromUintRange(match.badgeIds, unhandledBadges);
      unhandledBadges = remaining;
    }
  }

  unhandledBadges = sortUintRangesAndMergeIfNecessary(unhandledBadges);

  let doubledUpBadges = [];
  for (let i = 0; i < firstMatches.length; i++) {
    for (let j = i + 1; j < firstMatches.length; j++) {
      if (firstMatches[i].allowedCombinations[0].isApproved && firstMatches[j].allowedCombinations[0].isApproved
        && isInAddressMapping(firstMatches[i].fromMapping, 'Mint') && isInAddressMapping(firstMatches[j].fromMapping, 'Mint')
      ) {
        const [, removed] = removeUintRangeFromUintRange(firstMatches[i].badgeIds, firstMatches[j].badgeIds);

        if (removed.length > 0) {
          doubledUpBadges.push(...removed);
        }
      }
    }
  }
  doubledUpBadges = sortUintRangesAndMergeIfNecessary(doubledUpBadges);



  const DistributionComponent = <div>
    {
      <>
        <Row className="full-width primary-text flex-center">
          {unhandledBadges.length > 0 && <Col md={12} sm={24}>
            <br />
            <div className='flex-center primary-text'>
              <b>Badges with 0 Distributions
              </b>


            </div>
            <br /> <div className='flex-center primary-text'>
              <InfoCircleOutlined style={{ marginRight: 4 }} />
              The following badges are not distributed according to the current distributions selected.
            </div>
            <br />
            <div className='flex-center'>

              <BadgeAvatarDisplay
                collectionId={MSG_PREVIEW_ID}
                badgeIds={
                  unhandledBadges
                }
                showIds
              />
              {unhandledBadges.length == 0 && <Empty
                className="primary-text"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description='All badges are handled.' />}
            </div>
          </Col>}
          {doubledUpBadges.length > 0 && <Col md={12} sm={24}>
            <br />
            <div className='flex-center primary-text'>
              <b>Badges with 2+ Distributions</b>
            </div>
            <br /> <div className='flex-center primary-text'>
              <InfoCircleOutlined style={{ marginRight: 4 }} />
              The following badges are distributed in more than one way. This is typically not recommended.
              If this is intentional, it is your responsibility to ensure that there are sufficient balances for all distributions and that the distributions will not conflict in undesired ways.
            </div>
            <br />
            <div className='flex-center'>

              <BadgeAvatarDisplay
                collectionId={MSG_PREVIEW_ID}
                badgeIds={
                  doubledUpBadges
                }
                showIds
              />
              {doubledUpBadges.length == 0 && <Empty
                className="primary-text"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description='No badges have 2+ distributions.' />}
            </div>
          </Col>}

        </Row>
        {unhandledBadges.length > 0 || doubledUpBadges.length > 0 && <hr />}
      </>}
    {<>


      {!isOffChainBalances &&
        <div className='flex-center' style={{ textAlign: 'center' }}>
          <TransferabilityTab collectionId={MSG_PREVIEW_ID} isClaimSelect showOnlyTxApprovedTransfersToAdd hideHelperMessage />
        </div>}
    </>}
    <div className='flex-center'>
      <Avatar
        style={{ cursor: 'pointer' }}
        onClick={() => {
          setVisible(!visible);
        }}
        src={visible ? <MinusOutlined /> : <PlusOutlined />}
        className='styled-button'
      >
      </Avatar>
    </div>

    {visible &&
      <>
        <Divider />

        <CreateClaims
          setVisible={setVisible}
        />
      </>}


  </div>

  return {
    title: `Distribution Method`,
    description: '',
    // disabled: isOffChainBalances ? transfers.length === 0 : approvedTransfers.length === 0,
    node: <>
      {
        collection?.balancesType === "Off-Chain" ? DistributionComponent :
          <UpdateSelectWrapper
            updateFlag={updateCollectionApprovedTransfers}
            setUpdateFlag={setUpdateCollectionApprovedTransfers}
            jsonPropertyPath='collectionApprovedTransfers'
            permissionName='canUpdateCollectionApprovedTransfers'
            customRevertFunction={() => {
              txTimelineContext.resetApprovedTransfersToAdd();
            }}
            mintOnly
            node={DistributionComponent}
          />
      }
    </>
  }
}