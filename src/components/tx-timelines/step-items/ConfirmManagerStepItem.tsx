import { Avatar, Divider } from "antd";
import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission, convertToCosmosAddress, getCurrentValueForTimeline, validateManagerUpdate } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useAccountsContext } from "../../../bitbadges-api/contexts/AccountsContext";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { AddressDisplay } from "../../address/AddressDisplay";
import { AddressSelect } from "../../address/AddressSelect";
import { BlockiesAvatar } from "../../address/Blockies";
import { PermissionIcon } from "../../collection-page/PermissionsInfo";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { MSG_PREVIEW_ID, EmptyStepItem, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { DevMode } from "../../common/DevMode";
import { INFINITE_LOOP_MODE } from "../../../constants";

export function ConfirmManagerStepItem(
  canUpdateManager: boolean,
  setCanUpdateManager: (canUpdateManager: boolean) => void,
  existingCollectionId?: bigint
) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? '';
  const signedInAccount = accounts.getAccount(chain.address);
  const [address, setAddress] = useState<string>(currentManager || signedInAccount?.address || '');
  const hasManager = txTimelineContext.updateManagerTimeline;

  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect:  fetch accounts');
    if (!collection || !hasManager) return;

    collections.updateCollection({
      ...collection,
      managerTimeline: [{
        manager: convertToCosmosAddress(address),
        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
      }],
    })
  }, [address, hasManager])

  if (!collection) return EmptyStepItem;
  const err = existingCollection ? validateManagerUpdate(existingCollection.managerTimeline, collection.managerTimeline, existingCollection.collectionPermissions.canUpdateManager) : undefined;





  return {
    title: 'Select Manager',
    description: <>{'Every badge can specify a manager who has custom admin privileges, such as updating the collection in the future, revoking badges, and more. See full list '}
      <a href="https://docs.bitbadges.io/overview/how-it-works/manager" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a>
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
                  txTimelineContext.setUpdateManagerTimeline(idx == 1);
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
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      }],
                    })
                  }
                }}
                options={[{
                  title: 'No Manager',
                  message: 'Do not have a manager for this collection. No admin privileges will ever be available for this collection.',
                  isSelected: !hasManager,
                },
                {
                  title: 'Manager',
                  message: 'Specify a manager for this collection that can execute admin privileges.',
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
                      address={accounts.getAccount(currentManager)?.address ?? ''}
                      avatar={accounts.getAccount(currentManager)?.profilePicUrl ?? accounts.getAccount(currentManager)?.avatar}
                      fontSize={150}
                      shape='circle'
                    />
                  }
                />

                <AddressDisplay
                  addressOrUsername={currentManager}
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
                          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        }],
                      })
                    }}
                  />
                </div>
              </div>
              }
            </div>
            <DevMode obj={collection.managerTimeline} />
          </div >
        }
      />
  }
}