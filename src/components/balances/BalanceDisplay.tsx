import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Empty, Tooltip } from 'antd';
import {
  Balance,
  BalanceArray,
  MustOwnBadges,
  TransferWithIncrements,
  UintRange,
  UintRangeArray,
  getAllBadgeIdsToBeTransferred,
  getAllBalancesToBeTransferred
} from 'bitbadgesjs-sdk';
import { ReactNode, useMemo, useState } from 'react';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { GO_MAX_UINT_64, getTimeRangesElement } from '../../utils/dates';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { Pagination } from '../common/Pagination';
import { BalanceDisplayEditRow } from './BalanceDisplayEditRow';
import { Tabs } from '../navigation/Tabs';

export function BalanceDisplay({
  collectionId,
  balances,
  message,
  size,
  showingSupplyPreview,
  numIncrements = 0n,
  incrementBadgeIdsBy = 0n,
  incrementOwnershipTimesBy = 0n,
  mustOwnBadges,
  noOffChainBalances,
  cardView,
  hideMessage,
  hideBadges,
  hideTable,
  floatToRight,
  isMustOwnBadgesInput,
  editable,
  onAddBadges,
  onRemoveAll,
  sequentialOnly,
  setIncrementBadgeIdsBy,
  timeString,
  suggestedBalances,
  oneBalanceOnly,
  fullWidthCards,
  originalBalances
}: {
  mustOwnBadges?: Array<MustOwnBadges<bigint>>;
  collectionId: bigint;
  balances: BalanceArray<bigint>;
  numIncrements?: bigint;
  incrementBadgeIdsBy?: bigint;
  incrementOwnershipTimesBy?: bigint;
  message?: string | ReactNode;
  size?: number;
  showingSupplyPreview?: boolean;

  cardView?: boolean;
  hideMessage?: boolean;
  hideBadges?: boolean;
  hideTable?: boolean;
  floatToRight?: boolean;
  isMustOwnBadgesInput?: boolean;
  editable?: boolean;
  noOffChainBalances?: boolean;
  onAddBadges?: (
    balance: Balance<bigint>,
    amountRange?: UintRange<bigint>,
    collectionId?: bigint,
    mustSatisfyForAllAssets?: boolean,
    overrideWithCurrentTime?: boolean
  ) => void;
  setBalances?: (balances: BalanceArray<bigint>) => void;
  onRemoveAll?: () => void;
  sequentialOnly?: boolean;
  fullWidthCards?: boolean;
  setIncrementBadgeIdsBy?: (incrementBadgeIdsBy: bigint) => void;
  timeString?: string;
  suggestedBalances?: BalanceArray<bigint>;
  oneBalanceOnly?: boolean;
  originalBalances?: BalanceArray<bigint>;
}) {
  const [defaultBalancesToShow] = useState<BalanceArray<bigint>>(balances);

  const [incrementNum, setIncrementNum] = useState<number>(0);
  const [tab, setTab] = useState('per');

  const currBalancesToDisplay = useMemo(() => {
    if (tab !== 'per') {
      const allBalances = getAllBalancesToBeTransferred([
        new TransferWithIncrements({
          from: '',
          balances: balances.clone(),
          toAddresses: [],
          toAddressesLength: numIncrements > 0 ? numIncrements : 1n,
          incrementBadgeIdsBy: incrementBadgeIdsBy,
          incrementOwnershipTimesBy: incrementOwnershipTimesBy
        })
      ]);
      return allBalances;
    }

    const balancesToReturn = balances
      .clone()
      .applyIncrements(incrementBadgeIdsBy, incrementOwnershipTimesBy, tab == 'per' ? BigInt(incrementNum) : numIncrements);
    if (isMustOwnBadgesInput) {
      for (let i = 0; i < balancesToReturn.length; i++) {
        balancesToReturn[i].ownershipTimes = UintRangeArray.FullRanges();
      }
    }

    return balancesToReturn;
  }, [balances, isMustOwnBadgesInput, incrementNum, incrementBadgeIdsBy, incrementOwnershipTimesBy, numIncrements, tab]);

  const allBadgeIdsArr: UintRangeArray<bigint> = useMemo(() => {
    if (numIncrements > 1n) {
      return getAllBadgeIdsToBeTransferred([
        new TransferWithIncrements({
          from: '',
          balances: balances.clone(),
          toAddresses: [],
          toAddressesLength: numIncrements > 0 ? numIncrements : 1n,
          incrementBadgeIdsBy: incrementBadgeIdsBy,
          incrementOwnershipTimesBy: incrementOwnershipTimesBy
        })
      ]);
    }

    const arr = new UintRangeArray<bigint>();
    currBalancesToDisplay?.forEach((x) => {
      arr.push(...x.badgeIds);
    });

    return arr.clone().sortAndMerge();
  }, [currBalancesToDisplay, numIncrements, incrementBadgeIdsBy, incrementOwnershipTimesBy, balances]);

  const EditRowComponent = (
    <BalanceDisplayEditRow
      collectionId={collectionId}
      balances={balances}
      isMustOwnBadgesInput={isMustOwnBadgesInput}
      noOffChainBalances={noOffChainBalances}
      onAddBadges={onAddBadges}
      message={message}
      defaultBalancesToShow={defaultBalancesToShow}
      onRemoveAll={onRemoveAll}
      sequentialOnly={sequentialOnly}
      incrementBadgeIdsBy={incrementBadgeIdsBy}
      setIncrementBadgeIdsBy={setIncrementBadgeIdsBy}
      numRecipients={numIncrements}
      timeString={timeString}
      suggestedBalances={suggestedBalances}
      fullWidthCards={isMustOwnBadgesInput || fullWidthCards}
      oneBalanceOnly={oneBalanceOnly}
      originalBalances={originalBalances}
    />
  );

  const castedMustOwnBadges = mustOwnBadges
    ? mustOwnBadges
    : currBalancesToDisplay.map((x) => {
        return new MustOwnBadges<bigint>({
          ...x,
          amountRange: { start: x.amount, end: GO_MAX_UINT_64 },
          collectionId: 0n,
          mustSatisfyForAllAssets: true,
          overrideWithCurrentTime: false
        });
      });

  return (
    <div className="flex-center flex-column full-width">
      {!hideMessage && (
        <div className="flex-evenly">
          <div className="full-width flex-center" style={{ textAlign: 'center', fontSize: 20 }}>
            <b>{message ? message : 'Balances'}</b>
          </div>
        </div>
      )}
      <div className="flex-center full-width">
        <div
          className="flex-column full-width"
          style={{
            textAlign: floatToRight ? 'right' : 'center',
            justifyContent: 'end'
          }}>
          <Col md={24} xs={24} sm={24}>
            {numIncrements > 1n && currBalancesToDisplay.length > 0 && allBadgeIdsArr.length > 0 && !hideTable && (
              <>
                <div className="flex-center">
                  <Tabs
                    type="underline"
                    tabInfo={[
                      {
                        key: 'per',
                        content: 'Per Transfer'
                      },
                      {
                        key: 'total',
                        content: 'Total'
                      }
                    ]}
                    setTab={setTab}
                    tab={tab}
                  />
                </div>
                <br />
                {tab == 'per' && (
                  <>
                    <b className="text-center" style={{ textAlign: 'center' }}>
                      {Number(numIncrements)} Transfers
                    </b>
                    <div className="flex-center flex-column full-width" style={{ textAlign: 'center' }}>
                      <Pagination
                        currPage={incrementNum + 1}
                        onChange={(page) => {
                          setIncrementNum(page - 1);
                        }}
                        total={Number(numIncrements)}
                        pageSize={1}
                      />
                    </div>
                  </>
                )}
                {tab !== 'per' && (
                  <>
                    <b className="text-center" style={{ textAlign: 'center' }}>
                      All Transfers
                    </b>
                  </>
                )}
              </>
            )}
            <div className="flex-center flex-column full-width" style={{ textAlign: 'center', fontSize: 16 }}>
              {!hideTable && (
                <table className="table-auto" style={{ alignItems: 'normal' }}>
                  {castedMustOwnBadges.length > 0 && (
                    <thead>
                      <tr>
                        {isMustOwnBadgesInput && (
                          <th
                            style={{
                              textAlign: 'center',
                              verticalAlign: 'top',
                              fontWeight: 'bold',
                              paddingRight: 4
                            }}>
                            Collection ID
                          </th>
                        )}
                        {isMustOwnBadgesInput && (
                          <th
                            style={{
                              textAlign: 'center',
                              verticalAlign: 'top',
                              fontWeight: 'bold',
                              paddingRight: 4
                            }}>
                            Reqs.
                          </th>
                        )}
                        <th
                          style={{
                            textAlign: 'center',
                            verticalAlign: 'top',
                            fontWeight: 'bold',
                            paddingRight: 4,
                            minWidth: 70
                          }}>
                          {'Amount'}
                        </th>
                        <th
                          style={{
                            textAlign: 'center',
                            verticalAlign: 'top',
                            fontWeight: 'bold',
                            paddingLeft: 4
                          }}>
                          IDs
                        </th>
                        <th
                          style={{
                            textAlign: 'center',
                            verticalAlign: 'top',
                            fontWeight: 'bold',
                            paddingLeft: 4
                          }}>
                          Times
                          <Tooltip
                            color="black"
                            title={'During this timeframe, the badge are ' + (showingSupplyPreview ? 'in circulation.' : 'owned by this address.')}>
                            <InfoCircleOutlined style={{ marginLeft: 4 }} />
                          </Tooltip>
                        </th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {castedMustOwnBadges.map((balance, idx) => {
                      const amount = balance.amountRange.start;
                      const amountRange = balance.amountRange;
                      const collectionId = balance.collectionId;
                      const badgeIds = balance.badgeIds;
                      const ownershipTimes = balance.ownershipTimes;
                      const overrideWithCurrentTime = balance.ownershipTimes.length === 0;

                      const NormalRowComponent = (
                        <tr key={idx} style={{ color: amount < 0 ? 'red' : undefined }}>
                          {isMustOwnBadgesInput && (
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'top',
                                paddingRight: 4
                              }}>
                              {collectionId.toString()}
                            </td>
                          )}
                          {isMustOwnBadgesInput && (
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'top',
                                paddingRight: 4
                              }}>
                              {balance.mustSatisfyForAllAssets ? 'Must Satisfy All' : 'Must Satisfy One'}
                            </td>
                          )}
                          {!isMustOwnBadgesInput && (
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'top',
                                paddingRight: 4
                              }}>
                              x{amount.toString()}
                            </td>
                          )}
                          {isMustOwnBadgesInput && (
                            <td
                              style={{
                                textAlign: 'center',
                                verticalAlign: 'top',
                                paddingRight: 4
                              }}>
                              x{amountRange.start.toString()} (Min) - x{amountRange.end.toString()} (Max)
                            </td>
                          )}
                          <td
                            style={{
                              textAlign: 'center',
                              verticalAlign: 'top',
                              paddingLeft: 4
                            }}>
                            {' '}
                            {getBadgeIdsString(badgeIds)}
                          </td>
                          <td
                            style={{
                              textAlign: 'center',
                              verticalAlign: 'top',
                              paddingLeft: 4
                            }}>
                            {isMustOwnBadgesInput && overrideWithCurrentTime
                              ? timeString ?? 'Transfer Time'
                              : getTimeRangesElement(ownershipTimes, '', true)}
                          </td>
                        </tr>
                      );

                      return <>{NormalRowComponent}</>;
                    })}
                  </tbody>
                  {castedMustOwnBadges?.length === 0 && (
                    <>
                      <td colSpan={1000}>None</td>
                    </>
                  )}
                </table>
              )}
              {!hideBadges && !isMustOwnBadgesInput && (
                <>
                  <div className="full-width flex-center">
                    {!balances || balances?.length === 0 ? (
                      <div className="full-width flex-center" style={{ textAlign: 'center', display: 'flex' }}>
                        <Empty className="primary-text inherit-bg" image={Empty.PRESENTED_IMAGE_SIMPLE} description={'No balances found.'} />
                      </div>
                    ) : (
                      <div style={{ marginTop: 4 }} className=" full-width">
                        <br />
                        <BadgeAvatarDisplay
                          collectionId={collectionId}
                          balance={currBalancesToDisplay}
                          badgeIds={numIncrements > 1n ? UintRangeArray.From(castedMustOwnBadges.map((x) => x.badgeIds).flat()) : allBadgeIdsArr}
                          showIds
                          showSupplys={numIncrements > 1n ? false : true}
                          cardView={cardView}
                          size={size ? size : 60}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              {isMustOwnBadgesInput && (
                <>
                  {mustOwnBadges?.map((x, idx) => {
                    return (
                      <div key={idx} className="full-width flex-center" style={{ textAlign: 'center', display: 'flex' }}>
                        <div style={{ marginTop: 4 }} className=" full-width">
                          <br />
                          <BadgeAvatarDisplay
                            collectionId={x.collectionId}
                            badgeIds={x.badgeIds}
                            showIds
                            showSupplys={false}
                            cardView={cardView}
                            size={size ? size : 60}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              {editable && (
                <>
                  <div className="flex-center flex-column full-width" style={{ textAlign: 'center' }}>
                    {EditRowComponent}
                  </div>
                </>
              )}
            </div>
          </Col>
        </div>
      </div>
    </div>
  );
}
