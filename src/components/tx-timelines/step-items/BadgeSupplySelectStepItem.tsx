import { Divider } from "antd";
import { Balance } from "bitbadgesjs-proto";
import { BalancesActionPermissionUsedFlags, castBalancesActionPermissionToUniversalPermission, checkBalancesActionPermission } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { PermissionIcon } from "../../collection-page/PermissionsInfo";
import { DevMode } from "../../common/DevMode";
import { BalanceInput } from "../form-items/BalanceInput";

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

  return {
    title: `Add Badges`,
    description: existingCollectionId ? <> {`Current Permission - Can Create More Badges?: `}
      {
        PermissionIcon(
          castBalancesActionPermissionToUniversalPermission(existingCollection?.collectionPermissions.canCreateMoreBadges ?? []), '', BalancesActionPermissionUsedFlags
        )
      }
    </> : <></>,
    node: <div className='primary-text'>

      {err &&
        <div style={{ color: 'red', textAlign: 'center' }}>
          <b>Error: </b>{err.message}
          <br />
          <p>Please remove the conflicting created badges. Note this is just one error and there may be multiple errors.</p>
          <br />
          <p>This error may have happened because this collection used a tool other than this website to be created or updated. If this is the case, certain features may not be fully supported, and we apologize. We are working on 100% compatibility.</p>
        </div>}



      <BalanceInput
        balancesToShow={balancesToShow}
        onAddBadges={(balance) => {
          setBadgesToCreate([...badgesToCreate, balance]);
        }}
        onRemoveAll={() => {
          setBadgesToCreate([]);
        }}
        message="Circulating Supplys"
      />
      <Divider />
      <DevMode obj={badgesToCreate} />
    </div >,
    disabled: badgesToCreate?.length == 0 || !!err,
  }
}