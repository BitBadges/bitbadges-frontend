import { Empty } from "antd";
import { BigIntify, IdRange, Numberify, UserBalance, convertIdRange } from "bitbadgesjs-proto";
import { getAllBalancesToBeTransferred } from "bitbadgesjs-utils";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";

export function BalanceDisplay({
  collectionId,
  balance,
  message,
  size,
  showingSupplyPreview,
  numIncrements = 0n,
  incrementIdsBy = 0n,

  cardView,
  hideMessage,
  hideBadges,
  floatToRight,
}: {
  collectionId: bigint;
  balance: UserBalance<bigint>;
  numIncrements?: bigint
  incrementIdsBy?: bigint

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
      balances: balance.balances,
      toAddressesLength: numIncrements > 0 ? numIncrements : 1n,
      toAddresses: [],
      incrementIdsBy: incrementIdsBy > 0 ? incrementIdsBy : 0n,
    }
  ]).balances;

  const allBadgeIdsArr: IdRange<bigint>[] = allBalances?.map((balanceAmount) => {
    return balanceAmount.badgeIds.map((idRange) => convertIdRange(idRange, BigIntify));
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

                {badgeIds.map((idRange, idx) => (
                  <span key={idx}>
                    {idx !== 0 ? ', ' : ' '}
                    {idRange.start === idRange.end ? `${idRange.start}` : `${idRange.start}-${idRange.end}`}
                  </span>
                ))}

                {' '}
                - {showingSupplyPreview ? <>Supply of </> : <></>}
                <b>x{`${amount}`}</b>

                {numIncrements > 0 && incrementIdsBy > 0 ? (
                  <>
                    {' '}
                    (x{Numberify(amount)} of IDs{' '}
                    {badgeIds.map((idRange, idx) => (
                      <span key={idx}>
                        {idx !== 0 ? ', ' : ' '}
                        {idRange.start === idRange.end
                          ? `${idRange.start}`
                          : `${idRange.start}-${idRange.end}`}
                      </span>
                    ))}
                    to first recipient, then x{Numberify(amount)} of IDs{' '}
                    {badgeIds.map((idRange, idx) => (
                      <span key={idx}>
                        {idx !== 0 ? ', ' : ' '}
                        {idRange.start === idRange.end
                          ? `${idRange.start + incrementIdsBy}`
                          : `${idRange.start + incrementIdsBy}-${idRange.end + incrementIdsBy}`}
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
          {(!balance || balance.balances?.length === 0) && <span>None</span>}
        </div >
        {!hideBadges && collectionId > 0 && <div>
          {(!balance || balance.balances?.length === 0) ? <div style={{ textAlign: 'center', display: 'flex' }}>
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