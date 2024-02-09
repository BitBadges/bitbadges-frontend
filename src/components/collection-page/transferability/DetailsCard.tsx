import { WarningOutlined } from "@ant-design/icons";
import { Statistic } from "antd";
import { CollectionApprovalWithDetails } from "bitbadgesjs-sdk";
import { useAccount } from "../../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { approvalCriteriaHasNoAmountRestrictions, approvalHasApprovalAmounts, approvalHasMaxNumTransfers } from "../../../bitbadges-api/utils/claims";
import { AddressDisplayList } from "../../address/AddressDisplayList";
import { AddressSelect } from "../../address/AddressSelect";
import { BalanceDisplay } from "../../balances/BalanceDisplay";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";
import { MustOwnBadgesCard } from "./MustOwnBadgesCard";

export const DetailsCard = ({ allApprovals, approval, isOutgoingDisplay, isIncomingDisplay, collectionId, address, setAddress, isEdit }: {
  allApprovals: CollectionApprovalWithDetails<bigint>[],
  approval: CollectionApprovalWithDetails<bigint>, isOutgoingDisplay?: boolean, isIncomingDisplay?: boolean
  collectionId: bigint, address?: string,
  setAddress: (address: string) => void
  isEdit?: boolean

}) => {
  const hasApprovalAmounts = approvalHasApprovalAmounts(approval.approvalCriteria?.approvalAmounts);

  const hasMaxNumTransfers = approvalHasMaxNumTransfers(approval.approvalCriteria?.maxNumTransfers);

  const hasSameTrackerId = allApprovals.find(x => x.amountTrackerId === approval.amountTrackerId && x.approvalId !== approval.approvalId
    &&
    ((isEdit) || ((hasApprovalAmounts || hasMaxNumTransfers) && (approvalHasApprovalAmounts(x.approvalCriteria?.approvalAmounts) || approvalHasMaxNumTransfers(x.approvalCriteria?.maxNumTransfers))))
  );

  const hasSameChallengeTrackerId = allApprovals.find(x => x.challengeTrackerId === approval.challengeTrackerId && x.approvalId !== approval.approvalId
    &&
    ((isEdit) || (
      x.approvalCriteria?.merkleChallenge?.root && approval.approvalCriteria?.merkleChallenge?.root
      && x.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf && approval.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf
    ))
  );

  return <InformationDisplayCard title='Restrictions' inheritBg noBorder md={12} xs={24} sm={24} >
    <ul className='list-disc px-8 ' style={{ textAlign: 'left', }}>
      {approval.approvalCriteria?.requireFromDoesNotEqualInitiatedBy && !isOutgoingDisplay && (
        <li>{"From address must NOT equal approver's address"}</li>
      )}
      {approval.approvalCriteria?.requireFromEqualsInitiatedBy && !isOutgoingDisplay && (
        <li>{"From address must equal approver's address"}</li>
      )}
      {approval.approvalCriteria?.requireToDoesNotEqualInitiatedBy && !isIncomingDisplay && (
        <li>{"To address must NOT equal approver's address"}</li>
      )}
      {approval.approvalCriteria?.requireToEqualsInitiatedBy && !isIncomingDisplay && (
        <li>{"To address must equal approver's address"}</li>
      )}
      {!isOutgoingDisplay && <>
        {approval.fromListId !== "Mint" && approval.approvalCriteria?.overridesFromOutgoingApprovals ? (
          <li>
            <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} />
            {"Does not check the sender's outgoing approvals"}</li>
        ) : (
          approval.fromListId !== "Mint" && <li>{"Must satisfy the sender's outgoing approvals"}</li>
        )}</>}
      {approval.fromListId === "Mint" && !approval.approvalCriteria?.overridesFromOutgoingApprovals && (
        <>
          <li>
            {"Must satisfy outgoing approvals for Mint address (Not possible so this will never work)"}
          </li>
        </>
      )}
      {!isIncomingDisplay && <>
        {approval.approvalCriteria?.overridesToIncomingApprovals ? (
          <li><WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} />{"Does not check the recipient's incoming approvals"}</li>
        ) : (
          <li>{"Must satisfy recipient's incoming approvals"}</li>
        )}
      </>}
      {approval.approvalCriteria?.mustOwnBadges && approval.approvalCriteria?.mustOwnBadges?.length > 0 && (<>
        <li>{"Must own specific badges to be approved"}</li>
        <br />
        <MustOwnBadgesCard approval={approval} />
      </>
      )}
      {approval.approvalCriteria?.merkleChallenge?.root && (
        <>
          {approval.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf ? (<>
            <li>{"Must be on whitelist"}</li>
            {approval.approvalCriteria.merkleChallenge.maxUsesPerLeaf > 0n ? <li>{`Max ${approval.approvalCriteria.merkleChallenge.maxUsesPerLeaf.toString()} use(s) per address`}</li> : <></>}
            {(approval.details?.challengeDetails.leavesDetails.leaves.length ?? 0n) > 0n && <div className='flex-center flex-column'>
              <br />
              {<>

                <AddressDisplayList
                  users={approval.details?.challengeDetails?.leavesDetails.leaves ?? []}
                  allExcept={false}
                />
                <br />
              </>}
            </div>
            }
          </>) : <>

            <li>
              {`Must provide valid ${approval.details
                ? approval.details?.challengeDetails.hasPassword
                  ? 'password'
                  : 'code'
                : 'password / code'
                }`}
              {(approval.details?.challengeDetails.leavesDetails.leaves.length ?? 0) > 0 && (
                <>
                  {' '}({approval.details?.challengeDetails.leavesDetails.leaves.length.toString()}{' '}
                  {`${approval.details?.challengeDetails.hasPassword
                    ? 'password use'
                    : 'valid code'
                    }${(approval.details?.challengeDetails.leavesDetails.leaves.length ?? 0) > 1
                      ? 's'
                      : ''
                    } total`})
                </>
              )}
            </li>
            {/* <li>{approval.approvalCriteria.merkleChallenge.maxUsesPerLeaf ? `Max ${approval.approvalCriteria.merkleChallenge.maxUsesPerLeaf.toString()} use(s) per code / password` : "No limit on claims per code / password"}</li> */}
          </>}
        </>
      )}
      {
        approval.approvalCriteria?.predeterminedBalances && (approval.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
          approval.approvalCriteria?.predeterminedBalances && approval.approvalCriteria?.predeterminedBalances.manualBalances.length > 0) &&
        (
          <li>{"Predetermined balances for each transfer (see balances section)"}</li>
        )
      }


      <MaxNumTransfersComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="overall" componentType="list" setAddress={setAddress} />
      <MaxNumTransfersComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="to" componentType="list" setAddress={setAddress} />
      <MaxNumTransfersComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="from" componentType="list" setAddress={setAddress} />
      <MaxNumTransfersComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="initiatedBy" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="overall" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="to" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="from" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent hideDisplay approval={approval} collectionId={collectionId} address={address} type="initiatedBy" componentType="list" setAddress={setAddress} />

      <MaxNumTransfersComponent approval={approval} collectionId={collectionId} address={address} type="overall" componentType="card" setAddress={setAddress} />
      <MaxNumTransfersComponent approval={approval} collectionId={collectionId} address={address} type="to" componentType="card" setAddress={setAddress} />
      <MaxNumTransfersComponent approval={approval} collectionId={collectionId} address={address} type="from" componentType="card" setAddress={setAddress} />
      <MaxNumTransfersComponent approval={approval} collectionId={collectionId} address={address} type="initiatedBy" componentType="card" setAddress={setAddress} />

      <ApprovalAmountsComponent approval={approval} collectionId={collectionId} address={address} type="overall" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent approval={approval} collectionId={collectionId} address={address} type="to" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent approval={approval} collectionId={collectionId} address={address} type="from" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent approval={approval} collectionId={collectionId} address={address} type="initiatedBy" componentType="list" setAddress={setAddress} />


      {
        approvalCriteriaHasNoAmountRestrictions(approval.approvalCriteria) && (
          <li>
            No amount restrictions
          </li>
        )
      }
    </ul >
    <div style={{ textAlign: 'start' }}>
      {hasSameTrackerId && (
        <>
          <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} /> There are multiple approvals using the same amount tracker ID.
          The tally of badges transferred and the number of transfers are linked and will increment whenever either approval is used.
          <br />
        </>
      )}
      {hasSameChallengeTrackerId && (
        <>
          <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} /> There are multiple approvals using the same challenge tracker ID.
          {approval.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf ? ' The whitelists' : ' The codes / passwords'} of these approvals are linked and will be used up whenever either approval is used.
        </>
      )}
    </div>
  </InformationDisplayCard >
}



const MaxNumTransfersComponent = ({ approval, type, componentType, showUntracked,
  address,
  setAddress,
  collectionId,
  hideDisplay,
  trackedBehindTheScenes,
}: {
  approval: CollectionApprovalWithDetails<bigint>,
  address?: string,
  hideDisplay?: boolean,
  setAddress: (address: string) => void,
  collectionId: bigint,
  showUntracked?: boolean, type: "overall" | "to" | "from" | "initiatedBy", componentType: 'list' | 'card', trackedBehindTheScenes?: boolean
}) => {

  const account = useAccount(address ?? '');
  const collection = useCollection(collectionId);

  if (!approval.approvalCriteria || !approval.approvalCriteria?.maxNumTransfers) return null;

  const maxNumTransfersKey = type === "overall" ? "overallMaxNumTransfers" : type === "to" ? "perToAddressMaxNumTransfers" : type === "from" ? "perFromAddressMaxNumTransfers" : "perInitiatedByAddressMaxNumTransfers";
  const message = type === "overall" ?
    `All approved users cumulatively can use this approval a max of x${approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times` :
    type === "to" ?
      `Each unique to address can use this approval a max of x${approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times` :
      type === "from" ?
        `Each unique from address can use this approval a max of x${approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times` :
        `Each unique approved address can use this approval a max of x${approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times`;
  const untrackedMessage = type === "overall" ?
    `The cumulative number of transfers for all approved users is not tracked` :
    type === "to" ?
      `The number of transfers for each unique to address is not tracked` :
      type === "from" ?
        `The number of transfers for each unique from address is not tracked` :
        `The number of transfers for each unique approved address is not tracked`;



  if (!(approval.approvalCriteria?.maxNumTransfers && approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] > 0) && !trackedBehindTheScenes) return null;
  const limit = approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] ?? 0n;

  const numUsed = collection?.approvalTrackers.find(y => y.amountTrackerId === approval.amountTrackerId && y.trackerType === type
    && y.approvedAddress === (type === "overall" ? "" : account?.cosmosAddress ?? ''))?.numTransfers ?? 0n;


  return <>
    {componentType === 'list' && <>
      {approval.approvalCriteria?.maxNumTransfers && approval.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] > 0 ? (
        <li>{message}</li>
      ) : showUntracked && (
        <li>{untrackedMessage}</li>
      )}
    </>}


    {!hideDisplay && <div className='flex flex-column primary-text' style={{ textAlign: 'center', alignItems: 'normal', margin: 16 }}>
      <br />

      {approval.approvalCriteria?.maxNumTransfers &&
        <Statistic
          value={`${numUsed.toString()} / ${!limit ? '?' : approval.approvalCriteria.maxNumTransfers[maxNumTransfersKey].toString()}`}
          title={<>{type === "overall" ? <b className='primary-text'>Cumulative Uses - All Addresses</b> : <>
            <b className='primary-text'>Uses as {type === "to" ? 'To' : type === "from" ? 'From' : 'Approved'} Address</b>
            <AddressSelect defaultValue={address} onUserSelect={(address) => setAddress(address)} switchable fontSize={18} />
          </>
          }
          </>}
          className='primary-text'
          style={{ width: '100%', alignItems: 'normal', textAlign: 'center' }}
        />
      }

    </div >}

  </>
}


const ApprovalAmountsComponent = ({
  approval,
  address,
  setAddress,
  collectionId,
  hideDisplay,
  showUntracked, type, componentType }: {
    approval: CollectionApprovalWithDetails<bigint>,
    address?: string,
    setAddress: (address: string) => void,
    collectionId: bigint,
    hideDisplay?: boolean,
    showUntracked?: boolean, type: "overall" | "to" | "from" | "initiatedBy", componentType?: 'list' | 'card'
  }) => {

  const collection = useCollection(collectionId);
  const account = useAccount(address ?? '');

  if (!approval.approvalCriteria || !approval.approvalCriteria?.approvalAmounts) return null;

  const approvalAmountsKey = type === "overall" ? "overallApprovalAmount" : type === "to" ? "perToAddressApprovalAmount" : type === "from" ? "perFromAddressApprovalAmount" : "perInitiatedByAddressApprovalAmount";
  const message = type === "overall" ?
    `All approved users cumulatively can transfer x${approval.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges` :
    type === "to" ?
      `Each unique to address can transfer x${approval.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges` :
      type === "from" ?
        `Each unique from address can transfer x${approval.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges` :
        `Each unique approved address can transfer x${approval.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges`;

  const untrackedMessage = type === "overall" ?
    `The cumulative badges transferred for all approved users is not tracked` :
    type === "to" ?
      `The badges transferred for each unique to address is not tracked` :
      type === "from" ?
        `The badges transferred for each unique from address is not tracked` :
        `The badges transferred for each unique approved address is not tracked`;



  if (!(approval.approvalCriteria?.approvalAmounts && approval.approvalCriteria?.approvalAmounts[approvalAmountsKey] > 0)) return null;

  const approvedAmounts = collection?.approvalTrackers.find(y => y.amountTrackerId === approval.amountTrackerId && y.trackerType === type
    && y.approvedAddress === (type === "overall" ? "" : account?.cosmosAddress ?? ''))?.amounts ?? [{
      amount: 0n,
      badgeIds: approval.badgeIds,
      ownershipTimes: approval.ownershipTimes,
    }];

  return <>
    {componentType === 'list' && <>
      <>
        {approval.approvalCriteria?.approvalAmounts && approval.approvalCriteria?.approvalAmounts[approvalAmountsKey] > 0 ? (
          <li>{message}</li>
        ) : showUntracked && (
          <li>{untrackedMessage}</li>
        )}
      </>
    </>}
    {!hideDisplay &&
      <div className='flex-center flex-column primary-text'>
        <br />
        {(<>{type === "overall" ? <b>All Approved Users</b> : <>
          <AddressSelect defaultValue={address} onUserSelect={(address) => setAddress(address)} switchable />
        </>
        }
        </>)}

        {(
          <>
            <BalanceDisplay
              message={<>
              </>}
              hideBadges
              balances={approvedAmounts}
              collectionId={collectionId}
            />
          </>
        )}
      </div>}
  </>
}