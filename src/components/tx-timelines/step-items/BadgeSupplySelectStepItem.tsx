import { Divider } from "antd";
import { DefaultPlaceholderMetadata, deepCopyBalances, removeBadgeMetadata, sortUintRangesAndMergeIfNecessary, updateBadgeMetadata } from "bitbadgesjs-utils";
import { useState } from "react";
import { NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { DistributionOverview } from "../../badges/DistributionCard";
import { DevMode } from "../../common/DevMode";
import { BalanceInput } from "../../inputs/BalanceInput";
import { validateUintRangeArr } from "../form-items/CustomJSONSetter";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { BadgeIdRangesInput } from "../../inputs/BadgeIdRangesInput";
import { Balance } from "bitbadgesjs-proto";
import { GO_MAX_UINT_64 } from "../../../utils/dates";

export function BadgeSupplySelectStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);
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

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedBadgeMetadata: newBadgeMetadata
    });

    setBadgesToCreate([]);
  }

  const isNonIndexed = collection?.balancesType == 'Off-Chain - Non-Indexed';

  const onAddBadges = (balance: Balance<bigint>, reset?: boolean) => {

      if (!collection) return;
      const currBadgesToCreate = reset ? [] : deepCopyBalances(badgesToCreate);
      const newBadgesToCreate = deepCopyBalances([...currBadgesToCreate, balance])
      const prevNumberOfBadges = startingCollection ? getTotalNumberOfBadges(startingCollection) : 0n;
      const maxBadgeIdAdded = sortUintRangesAndMergeIfNecessary(newBadgesToCreate.map(x => x.badgeIds).flat(), true).pop()?.end || 0n;

      const newBadgeMetadata = updateBadgeMetadata(collection.cachedBadgeMetadata, {
        metadata: DefaultPlaceholderMetadata,
        badgeIds: [{ start: prevNumberOfBadges + 1n, end: maxBadgeIdAdded }]
      });

      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        cachedBadgeMetadata: newBadgeMetadata
      });

      setBadgesToCreate(newBadgesToCreate);
    
  }
  return {
    title: `Create Badges`,
    description: 
    isNonIndexed ? 'Define the bumber of badges to be used in your collection.' :
    'Define the circulating supplys for badges in your collection. You can customize and distribute these badges in later steps.',
    node: <UpdateSelectWrapper
      err={err}
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
          {isNonIndexed && <div className="flex-center flex-column" style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <BadgeIdRangesInput 
              hideSelect
              hideNumberSelects
              collectionId={NEW_COLLECTION_ID}
              
              uintRanges={badgesToCreate.map(x => x.badgeIds).flat()} setUintRanges={(uintRanges) => {
                if (!collection) return;

                onAddBadges({
                  badgeIds: uintRanges,
                  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  amount: 1n
                }, true);
              }
            } />
          </div>}
          {!isNonIndexed && <>
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
              onAddBadges={(balance) => onAddBadges(balance)}
              hideDisplay
              message="Circulating Supplys"
              onRemoveAll={revertFunction}
            />
            <Divider />
            <DevMode obj={badgesToCreate} />
          </>}
        </div >
       
      }
    />,
    disabled: (!existingCollectionId && badgesToCreate?.length == 0) || !!err,
  }
}