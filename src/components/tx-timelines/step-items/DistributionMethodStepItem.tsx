import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { BitBadgesCollection, validateCollectionApprovalsUpdate } from "bitbadgesjs-utils";
import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { TransferabilityTab } from "../../collection-page/TransferabilityTab";
import IconButton from "../../display/IconButton";
import { CreateClaims } from "../form-items/CreateClaims";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { deepCopy } from "bitbadgesjs-proto";
import { getNonMintApprovals } from "../../../bitbadges-api/utils/mintVsNonMint";

export function DistributionMethodStepItem() {

  const collections = useCollectionsContext();
  const collection = collections.getCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const updateCollectionApprovals = txTimelineContext.updateCollectionApprovals;
  const setUpdateCollectionApprovals = txTimelineContext.setUpdateCollectionApprovals;
  const isOffChainBalances = collection?.balancesType === "Off-Chain";

  const [visible, setVisible] = useState(false);
  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const DistributionComponent = <div>
    {<>
      {!isOffChainBalances &&
        <div className='flex-center full-width' style={{ textAlign: 'center' }}>
          <TransferabilityTab
            onDelete={(approvalId: string) => {
              const approvalsToAdd = txTimelineContext.approvalsToAdd;
              const postApprovalsToAdd = approvalsToAdd.filter(x => x.approvalId !== approvalId);

              let hasValidateUpdateError = null;
              if (startingCollection) {
                hasValidateUpdateError = validateCollectionApprovalsUpdate(startingCollection.collectionApprovals, postApprovalsToAdd, startingCollection.collectionPermissions.canUpdateCollectionApprovals);
              }

              if (hasValidateUpdateError && !confirm("This update is disallowed by the collection permissions. See the current permissions by clicking Permission at the top of the page. Please confirm this action was intended. Details: " + hasValidateUpdateError.message)) {
                return;
              }

              //Overwrite duplicate approval IDs
              txTimelineContext.setApprovalsToAdd(approvalsToAdd.filter(x => x.approvalId !== approvalId));
            }}
            // onEdit={(approval: CollectionApprovalWithDetails<bigint>) => {
            //   const approvalsToAdd = txTimelineContext.approvalsToAdd;
            //   const approval = approvalsToAdd.find(x => x.approvalId === approvalId);
            //   if (approval) {
            //     txTimelineContext.setApprovalsToAdd(approvalsToAdd.filter(x => x.approvalId !== approvalId));
            //     setVisible(true);
            //   }
            // }}
            showDeletedGrayedOut
            collectionId={NEW_COLLECTION_ID}
            onlyShowFromMint
            hideHelperMessage
            addMoreNode={<>
              <div className='flex-center'>
                <IconButton
                  src={visible ? <CloseOutlined /> : <PlusOutlined />}
                  onClick={() => {
                    setVisible(!visible);
                  }}
                  text={visible ? 'Cancel' : 'Add'}
                />
              </div>

              {visible &&
                <>
                  <CreateClaims
                    setVisible={setVisible}
                  />
                </>}
            </>}
          />
        </div>}
    </>}
  </div>

  return {
    title: `Transferability - Minting`,
    description: 'You previously created badges which have been sent to the Mint address. Here, you decide who can transfer from the Mint address.',
    node: <>
      {
        collection?.balancesType === "Off-Chain" ? DistributionComponent :
          <UpdateSelectWrapper
            setErr={(err) => { setErr(err) }}
            updateFlag={updateCollectionApprovals}
            setUpdateFlag={setUpdateCollectionApprovals}
            jsonPropertyPath='collectionApprovals'
            permissionName='canUpdateCollectionApprovals'
            customRevertFunction={() => {
              const nonMintApprovals = getNonMintApprovals(deepCopy(collection) as BitBadgesCollection<bigint>);
              txTimelineContext.setApprovalsToAdd(nonMintApprovals);
            }}
            mintOnly
            node={DistributionComponent}
          />
      }
    </>,
    disabled: !collection || !!err
  }
}