import { Divider } from "antd";
import { DefaultPlaceholderMetadata, deepCopyBalances, removeBadgeMetadata, sortUintRangesAndMergeIfNecessary, updateBadgeMetadata } from "bitbadgesjs-utils";
import { useState } from "react";
import { NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { DistributionOverview } from "../../badges/DistributionCard";
import { DevMode } from "../../common/DevMode";
import { BalanceInput } from "../../inputs/BalanceInput";
import { validateUintRangeArr } from "../form-items/CustomJSONSetter";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function BadgeSupplySelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const badgesToCreate = txTimelineContext.badgesToCreate;
  const setBadgesToCreate = txTimelineContext.setBadgesToCreate;

  const balancesToShow = collection?.owners.find(x => x.cosmosAddress === "Total")?.balances || []
  const [err, setErr] = useState<Error | null>(null);
  const [updateFlag, setUpdateFlag] = useState<boolean>(true);

  const revertFunction = () => {
    if (!collection) return;

    const prevNumberOfBadges = startingCollection ? getTotalNumberOfBadges(startingCollection) : 0n;

    const newBadgeMetadata = removeBadgeMetadata(collection.cachedBadgeMetadata, [{
      start: prevNumberOfBadges + 1n,
      end: getTotalNumberOfBadges(collection)
    }]);

    collections.updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedBadgeMetadata: newBadgeMetadata
    });

    setBadgesToCreate([]);
  }

  return {
    title: `Create Badges`,
    description: 'Define the circulating supplys for badges in your collection. You can customize and distribute these badges in later steps.',
    node: <UpdateSelectWrapper
      setErr={(err) => { setErr(err) }}
      updateFlag={updateFlag}
      setUpdateFlag={setUpdateFlag}
      jsonPropertyPath=''
      permissionName='canCreateMoreBadges'
      customValue={badgesToCreate}
      customSetValueFunction={(val: any) => {
        //Check it is a valid balance sarray
        if (!Array.isArray(val)) throw new Error("Must be valid balances array");
        for (let i = 0; i < val.length; i++) {
          if (!val[i].badgeIds) throw new Error("Must specify badgeIds");
          if (!val[i].ownershipTimes) throw new Error("Must specify ownershipTimes");
          if (!val[i].amount || !BigInt(val[i].amount)) throw new Error("Must specify amount");

          if (!validateUintRangeArr(val[i].badgeIds)) throw new Error("Must be valid badgeIds array");
          if (!validateUintRangeArr(val[i].ownershipTimes)) throw new Error("Must be valid ownershipTimes array");
        }


        setBadgesToCreate(val);
      }}
      customRevertFunction={revertFunction}
      node={
        <div className='primary-text' style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
          <div className="flex-center" style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <DistributionOverview
              md={12} xs={24} sm={24} lg={12} xl={12} xxl={12}
              collectionId={NEW_COLLECTION_ID}
              isSelectStep={true}
            />
          </div>
          <br />
          <BalanceInput
            sequentialOnly
            balancesToShow={balancesToShow}
            onAddBadges={(balance) => {
              if (!collection) return;

              const newBadgesToCreate = deepCopyBalances([...badgesToCreate, balance])
              const prevNumberOfBadges = startingCollection ? getTotalNumberOfBadges(startingCollection) : 0n;
              const maxBadgeIdAdded = sortUintRangesAndMergeIfNecessary(newBadgesToCreate.map(x => x.badgeIds).flat(), true).pop()?.end || 0n;

              const newBadgeMetadata = updateBadgeMetadata(collection.cachedBadgeMetadata, {
                metadata: DefaultPlaceholderMetadata,
                badgeIds: [{ start: prevNumberOfBadges + 1n, end: maxBadgeIdAdded }]
              });

              collections.updateCollection({
                collectionId: NEW_COLLECTION_ID,
                cachedBadgeMetadata: newBadgeMetadata
              });

              setBadgesToCreate(newBadgesToCreate);
            }}
            hideDisplay
            message="Circulating Supplys"
            onRemoveAll={revertFunction}
          />
          <Divider />
          <DevMode obj={badgesToCreate} />
        </div >
      }
    />,
    disabled: (!existingCollectionId && badgesToCreate?.length == 0) || !!err,
  }
}