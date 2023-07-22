import { Balance, UintRange } from "bitbadgesjs-proto";
import { Numberify, getBadgesToDisplay, getBalanceForIdAndTime } from "bitbadgesjs-utils";
import { useEffect, useRef, useState } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { INFINITE_LOOP_MODE, } from "../../constants";
import { Pagination } from "../common/Pagination";
import { BadgeAvatar } from "./BadgeAvatar";
import { BadgeCard } from "./BadgeCard";


export function BadgeAvatarDisplay({
  collectionId,
  addressOrUsernameToShowBalance,
  balance,
  badgeIds,
  size,
  selectedId,
  showIds,
  pageSize = 10,
  maxWidth,

  cardView,
  hideCollectionLink
}: {
  collectionId: bigint;
  addressOrUsernameToShowBalance?: string;
  balance?: Balance<bigint>[],
  badgeIds: UintRange<bigint>[];
  size?: number;
  pageSize?: number;
  selectedId?: bigint;
  showIds?: boolean;
  maxWidth?: number | string;
  cardView?: boolean;
  hideCollectionLink?: boolean;
}) {
  const collections = useCollectionsContext();
  const collectionsRef = useRef(collections);
  const collection = collections.collections[collectionId.toString()]
  const accounts = useAccountsContext();
  const account = addressOrUsernameToShowBalance ? accounts.getAccount(addressOrUsernameToShowBalance) : '';

  const userBalance = balance ? balance : account ? collection?.owners.find(owner => owner.cosmosAddress === account.cosmosAddress)?.balances : undefined;

  const [currPage, setCurrPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(pageSize); //Total number of badges in badgeIds[]

  const [badgeIdsToDisplay, setBadgeIdsToDisplay] = useState<UintRange<bigint>[]>([]); // Badge IDs to display of length pageSize

  useEffect(() => {
    if (addressOrUsernameToShowBalance) {
      collectionsRef.current.fetchBalanceForUser(collectionId, addressOrUsernameToShowBalance);
    }
  }, [addressOrUsernameToShowBalance, collectionId]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("BadgeAvatarDisplay: useEffect: collection: ", collectionId);

    let total = 0;
    for (const range of badgeIds) {
      const numBadgesInRange = Numberify(range.end) - Numberify(range.start) + 1;
      total += numBadgesInRange;
    }
    setTotal(total);

    //Calculate badge IDs to display and update metadata for badge IDs if absent
    const badgeIdsToDisplayResponse = getBadgesToDisplay([
      {
        badgeIds: badgeIds,
        collectionId: collectionId
      }
    ], currPage, pageSize);

    const badgeIdsToDisplay: UintRange<bigint>[] = [];
    for (const badgeIdObj of badgeIdsToDisplayResponse) {
      badgeIdsToDisplay.push(...badgeIdObj.badgeIds);
    }

    setBadgeIdsToDisplay(badgeIdsToDisplay);

    async function updateMetadata() {
      if (collectionId > 0n) {
        await collectionsRef.current.fetchAndUpdateMetadata(collectionId, { badgeIds: badgeIdsToDisplay });
      }
    }

    updateMetadata();
  }, [collectionId, badgeIds, currPage, pageSize]);

  return <div style={{ maxWidth: maxWidth }}>
    <Pagination currPage={currPage} onChange={setCurrPage} total={total} pageSize={pageSize} />

    <>
      <br /> <div className='flex-center flex-wrap full-width'>
        {
          badgeIdsToDisplay.map((badgeUintRange) => {
            const badgeIds: bigint[] = [];
            console.log(badgeIdsToDisplay);
            for (let i = badgeUintRange.start; i <= badgeUintRange.end; i++) {
              badgeIds.push(i);
            }
            return badgeIds.map((badgeId, idx) => {
              return <div key={idx} className='flex-between' style={{ margin: 2 }}>
                {!cardView ?
                  <BadgeAvatar
                    size={size && selectedId === badgeId ? size * 1.5 : size}
                    collectionId={collectionId}
                    badgeId={badgeId}
                    showId={showIds}
                    balance={userBalance ? getBalanceForIdAndTime(badgeId, BigInt(Date.now()), userBalance) : undefined}
                  /> : <BadgeCard
                    size={size && selectedId === badgeId ? size * 1.5 : size}
                    collectionId={collectionId}
                    badgeId={badgeId}
                    hideCollectionLink={hideCollectionLink}
                  />
                }
              </div>
            })
          })
        }
      </div>
    </>

  </div>
}