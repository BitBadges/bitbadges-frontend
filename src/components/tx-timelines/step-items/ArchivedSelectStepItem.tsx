import { Avatar, Divider } from "antd";
import { UniversalPermissionDetails, castTimedUpdatePermissionToUniversalPermission, checkTimedUpdatePermission, convertToCosmosAddress, TimedUpdatePermissionUsedFlags, validateManagerUpdate, validateIsArchivedUpdate } from "bitbadgesjs-utils";
import { useState } from "react";
import { useAccountsContext } from "../../../bitbadges-api/contexts/AccountsContext";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { AddressDisplay } from "../../address/AddressDisplay";
import { AddressSelect } from "../../address/AddressSelect";
import { BlockiesAvatar } from "../../address/Blockies";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { PermissionIcon } from "../../collection-page/PermissionsInfo";
import { TimedUpdatePermission, UintRange } from "bitbadgesjs-proto";

export function IsArchivedSelectStepItem(
  canArchiveCollection: boolean,
  setCanArchiveCollection: (canArchiveCollection: boolean) => void,
  existingCollectionId?: bigint
) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

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
  const err = existingCollection ? validateIsArchivedUpdate(existingCollection.isArchivedTimeline, collection.isArchivedTimeline, existingCollection.collectionPermissions.canArchiveCollection) : undefined;

  // const err = validateManagerUpdate(existingCollection?.managerTimeline ?? [], collection.managerTimeline, permissions);



  return {
    title: 'Archived Status',
    description: <>{'Is this collection archived (read-only)?'}

      {existingCollectionId ? <> <br /><br />{`Current Permission - Can Archive Collection?: `}
        {
          PermissionIcon(
            castTimedUpdatePermissionToUniversalPermission(existingCollection?.collectionPermissions.canArchiveCollection ?? []), '', TimedUpdatePermissionUsedFlags
          )
        }
      </> : <></>}

    </>,
    disabled: !!err,
    node:
      <UpdateSelectWrapper
        updateFlag={canArchiveCollection}
        setUpdateFlag={setCanArchiveCollection}
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
                noSelectUntilClick
                onSwitchChange={(idx) => {

                  if (idx == 0) {
                    collections.updateCollection({
                      ...collection,
                      isArchivedTimeline: [],
                    })
                  } else {
                    collections.updateCollection({
                      ...collection,
                      isArchivedTimeline: [{
                        timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                        isArchived: true,
                      }],
                    })
                  }


                }}
                options={[
                  {
                    title: 'Not Archived',
                    message: 'All transactions will succeed. The collection will not be archived.',
                    isSelected: collection.isArchivedTimeline.length == 0,
                  },
                  {
                    title: 'Archived (Read-Only)',
                    message: 'Moving forward, this collection will be archived and read-only. All transactions will fail until the collection is unarchived.',
                    isSelected: collection.isArchivedTimeline.length > 0,
                  },
                ]}
              />
            </div>
          </div >
        }
      />
  }
}