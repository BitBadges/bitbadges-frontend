import { Divider } from "antd";
import { checkBalancesActionPermission, deepCopyBalances } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { DevMode } from "../../common/DevMode";
import { BalanceInput } from "../../inputs/BalanceInput";
import { validateUintRangeArr } from "../form-items/CustomJSONSetter";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { ErrDisplay } from "../form-items/ErrDisplay";

export function BadgeSupplySelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[0n.toString()];
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const badgesToCreate = txTimelineContext.badgesToCreate;
  const setBadgesToCreate = txTimelineContext.setBadgesToCreate;

  const balancesToShow = collection?.owners.find(x => x.cosmosAddress === "Total")?.balances || []

  const err = startingCollection ? checkBalancesActionPermission(badgesToCreate, startingCollection.collectionPermissions.canCreateMoreBadges) : undefined;
  const [updateFlag, setUpdateFlag] = useState<boolean>(true);

  return {
    title: `Create Badges`,
    description: <></>,
    node: <UpdateSelectWrapper
      updateFlag={updateFlag}
      setUpdateFlag={setUpdateFlag}
      jsonPropertyPath=''
      permissionName='canCreateMoreBadges'
      validationErr={err}
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
      customRevertFunction={() => {
        setBadgesToCreate([]);
      }}
      node={

        <div className='primary-text'>
          <ErrDisplay err={err} />
          <BalanceInput
            balancesToShow={balancesToShow}
            onAddBadges={(balance) => {
              setBadgesToCreate(deepCopyBalances([...badgesToCreate, balance]));
            }}
            onRemoveAll={() => {
              setBadgesToCreate([]);
            }}
            message="Circulating Supplys"
          />
          <Divider />
          <DevMode obj={badgesToCreate} />
        </div >
      }
    />,
    disabled: (!existingCollectionId && badgesToCreate?.length == 0) || !!err,
  }
}