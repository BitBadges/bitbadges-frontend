import { InfoCircleOutlined } from "@ant-design/icons";
import { Empty, Tooltip } from "antd";
import { Balance, BigIntify, UintRange, convertUintRange } from "bitbadgesjs-proto";
import { getAllBalancesToBeTransferred, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { FOREVER_DATE, getTimeRangesElement } from "../../../utils/dates";
import { BadgeAvatarDisplay } from "../BadgeAvatarDisplay";
import { useEffect, useState } from "react";


//TODO: ownershipTimes logic
export function BalanceDisplay({
  collectionId,
  balances,
  message,
  size,
  showingSupplyPreview,
  numIncrements = 0n,
  incrementBadgeIdsBy = 0n,
  incrementOwnershipTimesBy = 0n,

  cardView,
  hideMessage,
  hideBadges,
  floatToRight,
  isMustOwnBadgesInput
}: {
  collectionId: bigint;
  balances: Balance<bigint>[];
  numIncrements?: bigint
  incrementBadgeIdsBy?: bigint
  incrementOwnershipTimesBy?: bigint

  message?: string;
  size?: number;
  showingSupplyPreview?: boolean;

  cardView?: boolean;
  hideMessage?: boolean;
  hideBadges?: boolean;
  floatToRight?: boolean;
  isMustOwnBadgesInput?: boolean
}) {


  const [allBalances, setAllBalances] = useState<Balance<bigint>[]>([]);
  const [allBadgeIdsArr, setAllBadgeIdsArr] = useState<UintRange<bigint>[]>([]);

  useEffect(() => {
    const allBalances = isMustOwnBadgesInput ? getAllBalancesToBeTransferred([
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
        incrementOwnershipTimesBy: incrementOwnershipTimesBy > 0 ? incrementOwnershipTimesBy : 0n,
      }
    ], true) : balances.map(x => { return { ...x, ownershipTimes: [{ start: 1n, end: FOREVER_DATE }] } });

    const allBadgeIdsArr: UintRange<bigint>[] = allBalances?.map((balanceAmount) => {
      return balanceAmount.badgeIds.map((uintRange) => convertUintRange(uintRange, BigIntify));
    }).flat();

    setAllBalances(allBalances);
    setAllBadgeIdsArr(allBadgeIdsArr);
  }, [balances, numIncrements, incrementBadgeIdsBy, incrementOwnershipTimesBy]);



  return <div className="flex-center flex-column">
    {!hideMessage && <div className="flex-evenly">
      <div className="full-width flex-center" style={{ textAlign: 'center', fontSize: 15 }}>
        <b>{message ? message : 'Balances'}</b>
      </div>
    </div>}
    {/* {!!lastFetchedAt &&
      <div>
        <InfoCircleOutlined style={{ marginRight: 4 }} />
        <span style={{ fontSize: 12 }}>
          {lastFetchedAt ? 'Last updated at: ' + new Date(Number(lastFetchedAt)).toLocaleDateString() + ' ' + new Date(Number(lastFetchedAt)).toLocaleTimeString() : 'Loading...'}
        </span>

      </div>} */}
    <div className="flex-evenly">
      <div className='flex-column full-width' style={{ textAlign: floatToRight ? 'right' : 'center', justifyContent: 'end' }}>
        <div className='full-width flex-center' style={{ fontSize: 15 }}>
          <table>
            {!(!balances || balances?.length === 0) &&
              <tr>
                <td style={{ textAlign: 'center', paddingRight: 4, minWidth: 80 }}>{isMustOwnBadgesInput ? 'Min Amount' : 'Amount'}</td>
                <td style={{ textAlign: 'center', paddingLeft: 4, minWidth: 80 }}>Badge IDs</td>
                <td style={{ textAlign: 'center', paddingLeft: 4, minWidth: 80 }}>Times
                  <Tooltip color='black' title={'During this timeframe, the badge are ' + (showingSupplyPreview ? 'in circulation.' : 'owned by this address.')}>
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </td>
              </tr>
            }
            {allBalances.map((balance, idx) => {
              const amount = balance.amount;
              const badgeIds = balance.badgeIds;
              const ownershipTimes = balance.ownershipTimes;

              // if (numIncrements > 0 && incrementBadgeIdsBy > 0) {
              //   return <>
              //     {numIncrements > 0 && incrementBadgeIdsBy > 0 ? (
              //       <>
              //         {' '}
              //         (x{Numberify(amount)} of IDs{' '}
              //         {badgeIds.map((uintRange, idx) => (
              //           <span key={idx}>
              //             {idx !== 0 ? ', ' : ' '}
              //             {uintRange.start === uintRange.end
              //               ? `${uintRange.start}`
              //               : `${uintRange.start}-${uintRange.end}`}
              //           </span>
              //         ))}
              //         to first recipient, then x{Numberify(amount)} of IDs{' '}
              //         {badgeIds.map((uintRange, idx) => (
              //           <span key={idx}>
              //             {idx !== 0 ? ', ' : ' '}
              //             {uintRange.start === uintRange.end
              //               ? `${uintRange.start + incrementBadgeIdsBy}`
              //               : `${uintRange.start + incrementBadgeIdsBy}-${uintRange.end + incrementBadgeIdsBy}`}
              //           </span>
              //         ))}, and so on)
              //       </>
              //     ) : numIncrements > 1 && (
              //       <>
              //         {' '}
              //         (x{Numberify(amount)} to each recipient)
              //       </>
              //     )}</>
              // }
              return <tr key={idx} style={{ color: amount < 0 ? 'red' : undefined }}>
                <td style={{ textAlign: 'center', paddingRight: 4 }}>x{amount.toString()}</td>
                <td style={{ textAlign: 'center', paddingLeft: 4 }}> {getBadgeIdsString(badgeIds)}</td>
                <td style={{ textAlign: 'center', paddingLeft: 4 }}>{isMustOwnBadgesInput ? 'Transfer Time' : getTimeRangesElement(ownershipTimes, '', true, showingSupplyPreview)}</td>
              </tr>
            })}
            {(!balances || balances?.length === 0) && <span>None</span>}
          </table>
        </div >


        {!hideBadges && <>
          <br /><div>
            {(!balances || balances?.length === 0) ? <div style={{ textAlign: 'center', display: 'flex' }}>
              <Empty
                className='primary-text primary-blue-bg'
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={'No balances found.'}
              />
            </div> : <div style={{ marginTop: 4 }}>
              <BadgeAvatarDisplay
                collectionId={collectionId}
                balance={allBalances}
                badgeIds={sortUintRangesAndMergeIfNecessary(allBadgeIdsArr.flat().sort((a, b) => a.start > b.start ? 1 : -1))}
                showIds
                showSupplys={false}
                cardView={cardView}
                size={size ? size : 50}
              />
            </div>}
          </div>
        </>}
      </div>
    </div>
  </div>
}