import { Divider } from "antd";
import { Balance } from "bitbadgesjs-proto";
import { checkBalancesActionPermission, deepCopyBalances } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { DevMode } from "../../common/DevMode";
import { BalanceInput } from "../../inputs/BalanceInput";
import { validateUintRangeArr } from "../form-items/CustomJSONSetter";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function BadgeSupplySelectStepItem(
  badgesToCreate: Balance<bigint>[],
  setBadgesToCreate: (badgesToCreate: Balance<bigint>[]) => void,
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[0n.toString()];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;
  const balancesToShow = collection?.owners.find(x => x.cosmosAddress === "Total")?.balances || []

  const err = existingCollection ? checkBalancesActionPermission(badgesToCreate, existingCollection.collectionPermissions.canCreateMoreBadges) : undefined;
  const [updateFlag, setUpdateFlag] = useState<boolean>(true);

  return {
    title: `Create Badges`,
    description: <></>,
    node: <UpdateSelectWrapper
      updateFlag={updateFlag}
      setUpdateFlag={setUpdateFlag}
      existingCollectionId={existingCollectionId}
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

          {err &&
            <div style={{ color: 'red', textAlign: 'center' }}>
              <b>Error: </b>You are attempting to update a previously frozen value.
              <br />
              <p>Please remove the conflicting created badges. Note this is just one error and there may be multiple errors.</p>

            </div>}



          <BalanceInput
            balancesToShow={balancesToShow}
            onAddBadges={(balance) => {
              setBadgesToCreate(deepCopyBalances([...badgesToCreate, balance]));
              // console.log(deepCopyBalances([...badgesToCreate, balance]));
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
    disabled: (!existingCollection && badgesToCreate?.length == 0) || !!err,
  }
}