import { Avatar, Divider } from "antd";
import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission, convertToCosmosAddress, validateManagerUpdate } from "bitbadgesjs-utils";
import { useState } from "react";
import { useAccountsContext } from "../../../bitbadges-api/contexts/AccountsContext";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { AddressDisplay } from "../../address/AddressDisplay";
import { AddressSelect } from "../../address/AddressSelect";
import { BlockiesAvatar } from "../../address/Blockies";
import { PermissionIcon } from "../../collection-page/PermissionsInfo";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function ConfirmManagerStepItem(
  canUpdateManager: boolean,
  setCanUpdateManager: (canUpdateManager: boolean) => void,
  existingCollectionId?: bigint
) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const signedInAccount = accounts.getAccount(chain.address);
  const [address, setAddress] = useState<string>(signedInAccount?.address || '');
  const [hasManager, setHasManager] = useState<boolean>(true);

  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  if (!collection) return EmptyStepItem;
  // const permissions: TimedUpdatePermission<bigint>[] = [{
  //   defaultValues: {
  //     timelineTimes: [],
  //     forbiddenTimes: [],
  //     permittedTimes: [],
  //   },
  //   combinations: [{
  //     timelineTimesOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     forbiddenTimesOptions: {
  //       invertDefault: false,
  //       allValues: true,
  //       noValues: false,
  //     },
  //     permittedTimesOptions: {
  //       invertDefault: false,
  //       allValues: false,
  //       noValues: false,
  //     },
  //   }]
  // }];
  const err = existingCollection ? validateManagerUpdate(existingCollection.managerTimeline, collection.managerTimeline, existingCollection.collectionPermissions.canUpdateManager) : undefined;

  // const err = validateManagerUpdate(existingCollection?.managerTimeline ?? [], collection.managerTimeline, permissions);



  return {
    title: 'Select Manager',
    description: <>{'Every badge can specify a manager who has custom admin privileges, such as updating the collection in the future, revoking badges, etc.'}
      <br /><br />
      {existingCollectionId ? <> {`Current Permission - Can Update Manager?: `}
        {
          PermissionIcon(
            castTimedUpdatePermissionToUniversalPermission(existingCollection?.collectionPermissions.canUpdateManager ?? []), '', TimedUpdatePermissionUsedFlags
          )
        }
      </> : <></>}

    </>,
    disabled: !!err,
    node:
      <UpdateSelectWrapper
        updateFlag={canUpdateManager}
        setUpdateFlag={setCanUpdateManager}
        existingCollectionId={existingCollectionId}
        node={

          <div>
            <div className='primary-text'
              style={{
                padding: '0',
                textAlign: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
              }}
            >
              {err &&
                <div style={{ color: 'red', textAlign: 'center' }}>
                  <b>Error: </b>{err.message}
                  <br />
                  <p>Please resolve this error before continuing.</p>
                  <br />
                  <p>This error may have happened because this collection used a tool other than this website to be created or updated. If this is the case, certain features may not be fully supported, and we apologize. We are working on 100% compatibility.</p>

                  <Divider />
                </div>}

              <SwitchForm
                onSwitchChange={(idx) => {
                  setHasManager(idx == 1);
                  if (idx == 0) {
                    collections.updateCollection({
                      ...collection,
                      managerTimeline: [],
                    })
                  } else {
                    collections.updateCollection({
                      ...collection,
                      managerTimeline: [{
                        manager: convertToCosmosAddress(address),
                        timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                      }],
                    })
                  }


                }}
                options={[{
                  title: 'No Manager',
                  message: 'Do not have a manager for this collection. No admin privileges will be available. The collection details will be final and frozen after this transaction is processed.',
                  isSelected: !hasManager,
                },
                {
                  title: 'Manager',
                  message: 'Specify a manager for this collection.',
                  isSelected: hasManager,
                },
                ]}
              />

              {hasManager && <div>
                <Divider />
                <Avatar
                  size={150}
                  src={
                    <BlockiesAvatar
                      address={address}
                      avatar={signedInAccount?.avatar}
                      fontSize={150}
                      shape='circle'
                    />
                  }
                />

                <AddressDisplay
                  addressOrUsername={address}
                  hidePortfolioLink
                />
                <Divider />

                <div style={{ marginBottom: 10, marginTop: 4, display: 'flex', justifyContent: 'center' }}>
                  <AddressSelect
                    defaultValue={address}
                    onUserSelect={(address) => {
                      setAddress(address);
                      collections.updateCollection({
                        ...collection,
                        managerTimeline: [{
                          manager: convertToCosmosAddress(address),
                          timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                        }],
                      })
                    }
                    }
                  />
                </div>
              </div>
              }
            </div>

          </div >
        }
      />
  }
}