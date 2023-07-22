import { Empty } from "antd";
import { Balance, BigIntify, Numberify, UintRange, convertUintRange } from "bitbadgesjs-proto";
import { getAllBalancesToBeTransferred } from "bitbadgesjs-utils";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";


//TODO: ownedTimes logic
export function BalanceDisplay({
  collectionId,
  balances,
  message,
  size,
  showingSupplyPreview,
  numIncrements = 0n,
  incrementBadgeIdsBy = 0n,
  incrementOwnedTimesBy = 0n,

  cardView,
  hideMessage,
  hideBadges,
  floatToRight,
}: {
  collectionId: bigint;
  balances: Balance<bigint>[];
  numIncrements?: bigint
  incrementBadgeIdsBy?: bigint
  incrementOwnedTimesBy?: bigint

  message?: string;
  size?: number;
  showingSupplyPreview?: boolean;

  cardView?: boolean;
  hideMessage?: boolean;
  hideBadges?: boolean;
  floatToRight?: boolean
}) {

  const allBalances = getAllBalancesToBeTransferred([
    {
      from: '',
      merkleProofs: [],
      precalculationDetails: {
        approvalId: '',
        approvalLevel: '',
        approverAddress: '',
      },
      memo: '',

      balances: balances,
      toAddressesLength: numIncrements > 0 ? numIncrements : 1n,
      toAddresses: [],
      incrementBadgeIdsBy: incrementBadgeIdsBy > 0 ? incrementBadgeIdsBy : 0n,
      incrementOwnedTimesBy: incrementOwnedTimesBy > 0 ? incrementOwnedTimesBy : 0n,
    }
  ]);

  const allBadgeIdsArr: UintRange<bigint>[] = allBalances?.map((balanceAmount) => {
    return balanceAmount.badgeIds.map((uintRange) => convertUintRange(uintRange, BigIntify));
  }).flat();

  return <>
    {!hideMessage && <div className="flex-evenly">
      <div className="full-width flex-center" style={{ textAlign: 'center', fontSize: 15 }}>
        <b>{message ? message : 'Balances'}</b>
      </div>
    </div>}
    <div className="flex-evenly">
      <div className='flex-evenly flex-column full-width' style={{ textAlign: floatToRight ? 'right' : 'center', }}>
        <div style={{ fontSize: 15 }}>
          {allBalances.map((balance, idx) => {
            const amount = balance.amount;
            const badgeIds = balance.badgeIds;

            return <>
              <span style={{ color: amount < 0 ? 'red' : undefined }}>
                {idx !== 0 && <br />}
                ID{badgeIds.length === 1 && badgeIds[0].start === badgeIds[0].end ? ' ' : 's'}{' '}

                {badgeIds.map((uintRange, idx) => (
                  <span key={idx}>
                    {idx !== 0 ? ', ' : ' '}
                    {uintRange.start === uintRange.end ? `${uintRange.start}` : `${uintRange.start}-${uintRange.end}`}
                  </span>
                ))}

                {' '}
                - {showingSupplyPreview ? <>Supply of </> : <></>}
                <b>x{`${amount}`}</b>

                {numIncrements > 0 && incrementBadgeIdsBy > 0 ? (
                  <>
                    {' '}
                    (x{Numberify(amount)} of IDs{' '}
                    {badgeIds.map((uintRange, idx) => (
                      <span key={idx}>
                        {idx !== 0 ? ', ' : ' '}
                        {uintRange.start === uintRange.end
                          ? `${uintRange.start}`
                          : `${uintRange.start}-${uintRange.end}`}
                      </span>
                    ))}
                    to first recipient, then x{Numberify(amount)} of IDs{' '}
                    {badgeIds.map((uintRange, idx) => (
                      <span key={idx}>
                        {idx !== 0 ? ', ' : ' '}
                        {uintRange.start === uintRange.end
                          ? `${uintRange.start + incrementBadgeIdsBy}`
                          : `${uintRange.start + incrementBadgeIdsBy}-${uintRange.end + incrementBadgeIdsBy}`}
                      </span>
                    ))}, and so on)
                  </>
                ) : numIncrements > 1 && (
                  <>
                    {' '}
                    (x{Numberify(amount)} to each recipient)
                  </>
                )}
              </span>
            </>
          })}
          {(!balances || balances?.length === 0) && <span>None</span>}
        </div >
        {!hideBadges && collectionId > 0 && <div>
          {(!balances || balances?.length === 0) ? <div style={{ textAlign: 'center', display: 'flex' }}>
            <Empty
              className='primary-text primary-blue-bg'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={'No owned badges in this collection.'}
            />
          </div> : <div style={{ marginTop: 4 }}>
            <BadgeAvatarDisplay
              collectionId={collectionId}
              balance={allBalances}
              badgeIds={allBadgeIdsArr.flat().sort((a, b) => a.start > b.start ? 1 : -1)}
              showIds
              cardView={cardView}
              size={size ? size : 50}
            />
          </div>}
        </div>}
      </div>
    </div>
  </>
}