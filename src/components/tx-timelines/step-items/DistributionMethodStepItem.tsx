import { Divider, Row, Typography } from "antd";
import { AddressMapping } from "bitbadgesjs-proto";
import { DistributionMethod, getReservedAddressMapping } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { ToolIcon, tools } from "../../display/ToolIcon";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function DistributionMethodStepItem(
  distributionMethod: DistributionMethod,
  setDistributionMethod: (newDistributionMethod: DistributionMethod) => void,
  existingCollectionId?: bigint,
  hideUnminted: boolean = false,
  hideFirstComeFirstServe: boolean = false,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  //If all supply amounts are 1, it is fungible
  // const fungible = badgesToCreate.length === 1 && badgesToCreate[0].badgeIds.length == 1 && badgesToCreate[0].badgeIds[0].start == badgesToCreate[0].badgeIds[0].end;
  // const nonFungible = badgesToCreate.every(badgeSupply => badgeSupply.amount === 1n);

  const options = [];
  if (!hideFirstComeFirstServe) {
    options.push({
      title: 'Open to Anyone',
      message: `First come, first serve until all badges are claimed.`,
      isSelected: distributionMethod == DistributionMethod.FirstComeFirstServe,
    });
  }

  const CodesStep = {
    title: 'Codes',
    message: 'Generate secret codes or passwords that can be entered by users to claim badges. These can be distributed to users however you would like (email, social media, etc).',
    isSelected: distributionMethod == DistributionMethod.Codes,
  }

  const WhitelistStep = {
    title: 'Whitelist',
    message: 'Define specific addresses that will be able to claim this badge.',
    isSelected: distributionMethod == DistributionMethod.Whitelist,
  }

  const ManualTransferStep = {
    title: 'Manual Transfer',
    message: 'The manager will be approved to freely transfer badges to any address from the Mint address. Note the manager will pay all transfer fees. This can be done via transfer transactions after the collection has been created.',
    isSelected: distributionMethod == DistributionMethod.DirectTransfer,
  }

  const OffChainBalancesStep = {
    title: 'Off-Chain Balances',
    message: <div className='flex-center'><span>Balances will be stored on a typical server (not the blockchain) for enhanced scalability and user experience. All balances must be assigned. Users do not need to claim. <br /> <br />IMPORTANT: This option should only be used for specific use cases. Learn more
      <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a></span></div>,
    isSelected: distributionMethod == DistributionMethod.OffChainBalances,
  }

  const neverHasManager = collection?.managerTimeline.length == 0 || collection?.managerTimeline.every(x => !x.manager);

  if (existingCollection && existingCollection.balancesType === "Off-Chain") {
    options.push(OffChainBalancesStep);
  } else if (existingCollection) {
    options.push(
      CodesStep,
      WhitelistStep

      // {
      //   title: 'JSON',
      //   message: 'Advanced option. Upload a JSON file, specifying how to distribute your badges. See BitBadges documentation for more info.',
      //   isSelected: distributionMethod == DistributionMethod.JSON,
      // }
    );

    if (!neverHasManager) options.push(ManualTransferStep);
  } else {

    options.push(
      CodesStep,
      WhitelistStep,
      OffChainBalancesStep
    );

    if (!neverHasManager) options.push(ManualTransferStep);
  }

  if (!hideUnminted) {
    options.push({
      title: 'Unminted',
      message: 'Do nothing now. Leave the distribution of badges for a later time.',
      isSelected: distributionMethod == DistributionMethod.Unminted,
    })
  }



  return {
    title: `Distribution Method`,
    description: '',
    node: <div>
      <SwitchForm

        options={options}
        onSwitchChange={(_idx, newTitle) => {
          if (!collection) return;

          if (newTitle == 'Open to Anyone') {
            setDistributionMethod(DistributionMethod.FirstComeFirstServe);
          } else if (newTitle == 'Codes') {
            setDistributionMethod(DistributionMethod.Codes);
          } else if (newTitle == 'Whitelist') {
            setDistributionMethod(DistributionMethod.Whitelist);
          } else if (newTitle == 'JSON') {
            setDistributionMethod(DistributionMethod.JSON);
          } else if (newTitle == 'Unminted') {
            setDistributionMethod(DistributionMethod.Unminted);
          } else if (newTitle == 'Off-Chain Balances') {
            setDistributionMethod(DistributionMethod.OffChainBalances);
            collections.updateCollection({
              ...collection,
              collectionApprovedTransfersTimeline: []
            });
          } else if (newTitle == 'Manual Transfer') {

            setDistributionMethod(DistributionMethod.DirectTransfer);

            if (!collection) return;

            //Slot it right in the middle of [existing from "Mint", toAdd, non-"Mint"]
            const existingFromMint = existingCollection && existingCollection.collectionApprovedTransfersTimeline.length > 0
              ? existingCollection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.filter(x => x.fromMappingId === 'Mint') : [];

            const existingNonMint = existingCollection && existingCollection.collectionApprovedTransfersTimeline.length > 0
              ? existingCollection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.filter(x => x.fromMappingId !== 'Mint') : [];

            const manager = collection.managerTimeline.length > 0 ? collection.managerTimeline[0].manager : '';

            collections.updateCollection({
              ...collection,
              collectionApprovedTransfersTimeline: [{
                collectionApprovedTransfers: [
                  ...existingFromMint,
                  {
                    fromMappingId: 'Mint',
                    toMappingId: 'AllWithMint',
                    initiatedByMappingId: 'Manager',
                    initiatedByMapping: getReservedAddressMapping('Manager', manager) as AddressMapping,
                    fromMapping: getReservedAddressMapping('Mint', '') as AddressMapping,
                    toMapping: getReservedAddressMapping('AllWithMint', '') as AddressMapping,
                    transferTimes: [{ start: 1n, end: FOREVER_DATE }],
                    ownershipTimes: [{ start: 1n, end: FOREVER_DATE }],
                    badgeIds: [{ start: 1n, end: FOREVER_DATE }],
                    allowedCombinations: [{
                      initiatedByMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      fromMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      toMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                      badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                      ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      transferTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      isApproved: true,
                    }],
                    approvalDetails: []
                  },
                  ...existingNonMint],
                timelineTimes: [{ start: 1n, end: FOREVER_DATE }]
              }]
            });
          }
        }}
      />
      <Divider />
      <Divider />

      <div className='flex-center flex-wrap flex-column'>
        <Typography.Text strong className='primary-text' style={{ fontSize: 20, textAlign: 'center' }}>Distribution Tools</Typography.Text>
        <Typography.Text strong className='secondary-text' style={{ fontSize: 14, textAlign: 'center' }}>
          Below is a list of compatible tools to help you distribute badges according to your preferred method.
          Please follow instructions to ensure that your badges are distributed correctly.
        </Typography.Text>

        <br />
        <Row className='full-width'>
          {/* Three columns */}
          {tools.filter(x => x.distributionMethod).map(x => {
            return <ToolIcon
              key={x.name}
              name={x.name}
            />
          })}

        </Row>

        <br />
      </div>
    </div>,
    disabled: distributionMethod == DistributionMethod.None
  }
}