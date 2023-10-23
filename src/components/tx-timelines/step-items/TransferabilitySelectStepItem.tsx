import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Divider } from "antd";
import { deepCopy } from "bitbadgesjs-proto";
import { getReservedAddressMapping, validateCollectionApprovalsUpdate } from "bitbadgesjs-utils";
import { useState } from "react";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { approvalCriteriaHasNoAdditionalRestrictions, approvalCriteriaHasNoAmountRestrictions } from "../../../bitbadges-api/utils/claims";
import { getMintApprovals, getNonMintApprovals } from "../../../bitbadges-api/utils/mintVsNonMint";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { TransferabilityTab } from "../../collection-page/TransferabilityTab";
import IconButton from "../../display/IconButton";
import { CreateClaims } from "../form-items/CreateClaims";
import { ErrDisplay } from "../form-items/ErrDisplay";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function TransferabilitySelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const updateCollectionApprovals = txTimelineContext.updateCollectionApprovals;
  const setUpdateCollectionApprovals = txTimelineContext.setUpdateCollectionApprovals;
  const approvalsToAdd = txTimelineContext.approvalsToAdd;

  const [visible, setVisible] = useState<boolean>(false);
  if (!collection) return EmptyStepItem;

  const err = startingCollection ? validateCollectionApprovalsUpdate(startingCollection.collectionApprovals, collection.collectionApprovals, startingCollection.collectionPermissions.canUpdateCollectionApprovals) : undefined;

  const transferableApproval = {
    fromMappingId: 'AllWithoutMint',
    fromMapping: getReservedAddressMapping("AllWithoutMint"),
    toMappingId: "AllWithMint",
    toMapping: getReservedAddressMapping("AllWithMint"),
    initiatedByMappingId: "AllWithMint",
    initiatedByMapping: getReservedAddressMapping("AllWithMint"),
    transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
    approvalId: 'transferable',
    amountTrackerId: 'transferable',
    challengeTrackerId: 'transferable',
  }

  return {
    title: `Transferability - Post-Minting`,
    // description: 
    description: <>{`Excluding transfers from the Mint address, should badges be transferable or non-transferable?`}</>,
    node: <UpdateSelectWrapper
      updateFlag={updateCollectionApprovals}
      setUpdateFlag={setUpdateCollectionApprovals}
      jsonPropertyPath='collectionApprovals'
      permissionName='canUpdateCollectionApprovals'
      customRevertFunction={() => {
        const existingNonMint = startingCollection ? getNonMintApprovals(startingCollection) : [];

        collections.updateCollection({
          collectionId: MSG_PREVIEW_ID,
          collectionApprovals: [
            ...approvalsToAdd,
            ...existingNonMint
          ],
        });
      }}
      nonMintOnly
      node={
        <div className="primary-text">

          <ErrDisplay err={err} />
          <SwitchForm
            showCustomOption
            options={[
              {
                title: 'Non-Transferable',
                message: 'Badges cannot be transferred between users.',
                isSelected: getNonMintApprovals(collection).length === 0
              },
              {
                title: 'Transferable',
                message: `Badges can be transferred between users.`,
                isSelected: getNonMintApprovals(collection).length === 1 && approvalCriteriaHasNoAdditionalRestrictions(getNonMintApprovals(collection)[0].approvalCriteria)
                  && approvalCriteriaHasNoAmountRestrictions(getNonMintApprovals(collection)[0].approvalCriteria)
              },

            ]}
            onSwitchChange={(idx) => {
              if (idx === 0) {
                txTimelineContext.setApprovalsToAdd(getMintApprovals(collection));
              } else if (idx == 1) {
                txTimelineContext.setApprovalsToAdd([...getMintApprovals(collection), deepCopy(transferableApproval)]);
              }
            }}
          />
          <Divider />
          <div className='flex-center' style={{ textAlign: 'center' }}>
            <TransferabilityTab collectionId={0n} onlyShowNotFromMint
              hideHelperMessage
              showDeletedGrayedOut
              onDelete={(approvalId: string) => {
                const approvalsToAdd = txTimelineContext.approvalsToAdd;
                const postApprovalsToAdd = approvalsToAdd.filter(x => x.approvalId !== approvalId);

                let isValidUpdateError = null;
                if (startingCollection) {
                  isValidUpdateError = validateCollectionApprovalsUpdate(startingCollection.collectionApprovals, postApprovalsToAdd, startingCollection.collectionPermissions.canUpdateCollectionApprovals);
                }

                if (isValidUpdateError && !confirm("This update is disallowed by the collection permissions. See the current permissions by clicking Permission at the top of the page. Please confirm this action was intended. Details: " + isValidUpdateError.message)) {
                  return;
                }

                txTimelineContext.setApprovalsToAdd(approvalsToAdd.filter(x => x.approvalId !== approvalId));
              }}
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
                      nonMintApproval
                      setVisible={setVisible}
                    />
                  </>}
              </>}
            />
          </div>
        </div >
      }
    />,
    disabled: !!err,
  }
}