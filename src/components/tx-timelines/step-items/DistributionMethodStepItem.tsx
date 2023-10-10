import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Avatar, Divider } from "antd";
import { useState } from "react";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { TransferabilityTab } from "../../collection-page/TransferabilityTab";
import { CreateClaims } from "../form-items/CreateClaims";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function DistributionMethodStepItem() {

  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];

  const txTimelineContext = useTxTimelineContext();
  // const approvals = txTimelineContext.approvalsToAdd;
  // const transfers = txTimelineContext.transfers;
  const updateCollectionApprovals = txTimelineContext.updateCollectionApprovals;
  const setUpdateCollectionApprovals = txTimelineContext.setUpdateCollectionApprovals;

  const isOffChainBalances = collection?.balancesType === "Off-Chain";

  const [visible, setVisible] = useState(false);
  if (!collection) return EmptyStepItem;

  const DistributionComponent = <div>
    {<>
      {!isOffChainBalances &&
        <div className='flex-center' style={{ textAlign: 'center' }}>
          <TransferabilityTab collectionId={MSG_PREVIEW_ID} onlyShowFromMint hideHelperMessage />
        </div>}
    </>}
    <Divider />
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
    // disabled: isOffChainBalances ? transfers.length === 0 : approvals.length === 0,
    node: <>
      {
        collection?.balancesType === "Off-Chain" ? DistributionComponent :
          <UpdateSelectWrapper
            updateFlag={updateCollectionApprovals}
            setUpdateFlag={setUpdateCollectionApprovals}
            jsonPropertyPath='collectionApprovals'
            permissionName='canUpdateCollectionApprovals'
            customRevertFunction={() => {
              txTimelineContext.resetApprovalsToAdd();
            }}
            mintOnly
            node={DistributionComponent}
          />
      }
    </>
  }
}