import { InfoCircleOutlined } from "@ant-design/icons";
import { Col, Empty, Tooltip } from "antd";
import { Balance, BigIntify, MustOwnBadges, UintRange, convertUintRange } from "bitbadgesjs-proto";
import { getAllBalancesToBeTransferred, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { ReactNode, useEffect, useState } from "react";
import { INFINITE_LOOP_MODE } from "../../../constants";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { GO_MAX_UINT_64, getTimeRangesElement } from "../../../utils/dates";
import { BalanceDisplayEditRow } from "../../inputs/BalanceDisplayEditRow";
import { BadgeAvatarDisplay } from "../BadgeAvatarDisplay";


export function BalanceDisplay({
  collectionId,
  balances,
  message,
  size,
  showingSupplyPreview,
  numIncrements = 0n,
  incrementBadgeIdsBy = 0n,
  incrementOwnershipTimesBy = 0n,
  hideOwnershipTimeSelect,
  mustOwnBadges,

  cardView,
  hideMessage,
  hideBadges,
  hideTable,
  floatToRight,
  isMustOwnBadgesInput,
  editable,
  onAddBadges,
  minimum,
  maximum,
  onRemoveAll,
  sequentialOnly,
  fullWidthCards,
  setIncrementBadgeIdsBy
}: {
  mustOwnBadges?: MustOwnBadges<bigint>[]
  collectionId: bigint;
  balances: Balance<bigint>[];
  numIncrements?: bigint
  incrementBadgeIdsBy?: bigint
  incrementOwnershipTimesBy?: bigint
  hideOwnershipTimeSelect?: boolean
  message?: string | ReactNode;
  size?: number;
  showingSupplyPreview?: boolean;

  cardView?: boolean;
  hideMessage?: boolean;
  hideBadges?: boolean;
  hideTable?: boolean;
  floatToRight?: boolean;
  isMustOwnBadgesInput?: boolean
  editable?: boolean
  onAddBadges?: (balance: Balance<bigint>, amountRange?: UintRange<bigint>, collectionId?: bigint) => void
  minimum?: bigint
  maximum?: bigint
  setBalances?: (balances: Balance<bigint>[]) => void
  onRemoveAll?: () => void
  sequentialOnly?: boolean
  fullWidthCards?: boolean
  setIncrementBadgeIdsBy?: (incrementBadgeIdsBy: bigint) => void
}) {
  const [allBalances, setAllBalances] = useState<Balance<bigint>[]>([]);
  const [allBadgeIdsArr, setAllBadgeIdsArr] = useState<UintRange<bigint>[]>([]);

  const [defaultBalancesToShow] = useState<Balance<bigint>[]>(balances);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("BalanceDisplay useEffect", { balances, numIncrements, incrementBadgeIdsBy, incrementOwnershipTimesBy })
    // console.log("BalanceDisplay useEffect", { balances, numIncrements, incrementBadgeIdsBy, incrementOwnershipTimesBy })

    const allBalances = !isMustOwnBadgesInput ? getAllBalancesToBeTransferred([
      {
        from: '',
        merkleProofs: [],
        precalculateBalancesFromApproval: {
          approvalId: '',
          approvalLevel: '',
          approverAddress: '',
        },
        memo: '',
        prioritizedApprovals: [],
        onlyCheckPrioritizedApprovals: false,

        balances: balances,
        toAddressesLength: numIncrements > 0 ? numIncrements : 1n,
        toAddresses: [],
        incrementBadgeIdsBy: incrementBadgeIdsBy > 0 ? incrementBadgeIdsBy : 0n,
        incrementOwnershipTimesBy: incrementOwnershipTimesBy > 0 ? incrementOwnershipTimesBy : 0n,
      }
    ], true) : balances.map(x => { return { ...x, ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }] } });


    const allBadgeIdsArr: UintRange<bigint>[] = allBalances?.map((balanceAmount) => {
      return balanceAmount.badgeIds.map((uintRange) => convertUintRange(uintRange, BigIntify));
    }).flat();
    setAllBalances(allBalances);
    setAllBadgeIdsArr(allBadgeIdsArr);

  }, [balances, numIncrements, incrementBadgeIdsBy, incrementOwnershipTimesBy, isMustOwnBadgesInput])

  const EditRowComponent = <BalanceDisplayEditRow
    collectionId={collectionId}
    balances={balances}
    isMustOwnBadgesInput={isMustOwnBadgesInput}
    onAddBadges={onAddBadges}
    minimum={minimum}
    maximum={maximum}
    hideOwnershipTimeSelect={hideOwnershipTimeSelect}
    message={message}
    defaultBalancesToShow={defaultBalancesToShow}
    onRemoveAll={onRemoveAll}
    sequentialOnly={sequentialOnly}
    fullWidthCards={fullWidthCards}
    incrementBadgeIdsBy={incrementBadgeIdsBy}
    setIncrementBadgeIdsBy={setIncrementBadgeIdsBy}
    numRecipients={numIncrements}
  />


  const castedMustOwnBadges = mustOwnBadges ? mustOwnBadges : allBalances.map(x => { return { ...x, amountRange: { start: x.amount, end: GO_MAX_UINT_64 }, collectionId: 0n } });
  return <div className="flex-center flex-column full-width" >
    {!hideMessage && <div className="flex-evenly">
      <div className="full-width flex-center" style={{ textAlign: 'center', fontSize: 20 }}>
        <b>{message ? message : 'Balances'}</b>
      </div>
    </div>}
    <div className="flex-center full-width">
      <div className='flex-column full-width' style={{ textAlign: floatToRight ? 'right' : 'center', justifyContent: 'end' }}>

        <Col md={24} xs={24} sm={24}>
          <div className="flex-center flex-column full-width" style={{ textAlign: 'center' }}>
            {!hideTable && <table className="table-auto" style={{ alignItems: 'normal' }}>
              {<thead>
                <tr>
                  {isMustOwnBadgesInput && <th style={{ textAlign: 'center', verticalAlign: "top", fontWeight: 'bold', paddingRight: 4 }}>Collection ID</th>}
                  <th style={{ textAlign: 'center', verticalAlign: "top", fontWeight: 'bold', paddingRight: 4, minWidth: 70 }}>{'Amount'}</th>
                  <th style={{ textAlign: 'center', verticalAlign: "top", fontWeight: 'bold', paddingLeft: 4 }}>IDs</th>
                  <th style={{ textAlign: 'center', verticalAlign: "top", fontWeight: 'bold', paddingLeft: 4 }}>Times
                    <Tooltip color='black' title={'During this timeframe, the badge are ' + (showingSupplyPreview ? 'in circulation.' : 'owned by this address.')}>
                      <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </Tooltip>
                  </th>
                </tr>
              </thead>
              }
              <tbody>
                {castedMustOwnBadges.map((balance, idx) => {
                  const amount = balance.amountRange.start;
                  const amountRange = balance.amountRange;
                  const collectionId = balance.collectionId;
                  const badgeIds = balance.badgeIds;
                  const ownershipTimes = balance.ownershipTimes;

                  const NormalRowComponent = <tr key={idx} style={{ color: amount < 0 ? 'red' : undefined }}>
                    {isMustOwnBadgesInput && <td style={{ textAlign: 'center', verticalAlign: "top", paddingRight: 4 }}>{collectionId.toString()}</td>}
                    {!isMustOwnBadgesInput && <td style={{ textAlign: 'center', verticalAlign: "top", paddingRight: 4 }}>x{amount.toString()}</td>}
                    {isMustOwnBadgesInput && <td style={{ textAlign: 'center', verticalAlign: "top", paddingRight: 4 }}>
                      {amountRange.start.toString()} (Min) - {amountRange.end.toString()} (Max)
                    </td>}
                    <td style={{ textAlign: 'center', verticalAlign: "top", paddingLeft: 4 }}> {getBadgeIdsString(badgeIds)}</td>
                    <td style={{ textAlign: 'center', verticalAlign: "top", paddingLeft: 4 }}>{isMustOwnBadgesInput ? 'Transfer Time' : getTimeRangesElement(ownershipTimes, '', true)}</td>
                  </tr>

                  return <>
                    {NormalRowComponent}
                  </>
                })}
              </tbody>
              {(castedMustOwnBadges?.length === 0) && <>
                <td colSpan={1000}>
                  None
                </td>
              </>}
            </table>}
            {!hideBadges && !isMustOwnBadgesInput && <>
              <div className='full-width flex-center'>
                {(!balances || balances?.length === 0) ? <div className='full-width flex-center' style={{ textAlign: 'center', display: 'flex' }}>
                  <Empty
                    className='primary-text inherit-bg'
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={'No balances found.'}
                  />
                </div> : <div style={{ marginTop: 4 }} className=' full-width'>
                  <BadgeAvatarDisplay
                    collectionId={collectionId}
                    balance={allBalances}
                    badgeIds={sortUintRangesAndMergeIfNecessary(allBadgeIdsArr.flat().sort((a, b) => a.start > b.start ? 1 : -1), true)}
                    showIds
                    showSupplys={true}
                    cardView={cardView}
                    size={size ? size : 45}
                  />
                </div>}
              </div>
            </>}
            {editable && <>
              <br />
              <div className="flex-center flex-column full-width" style={{ textAlign: 'center' }}>
                {EditRowComponent}
              </div></>}
          </div>
        </Col >



      </div>
    </div >
  </div >
}