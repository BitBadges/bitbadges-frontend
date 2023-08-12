
export enum AddressMappingSelectType {
  ALL,
  NONE,
  EVERYONE_EXCEPT,
  SPECIFIC,
  UNSELECTED
}

//TODO: In the future, this will need a whole rewrite.
//Couple notes: For UX, we did it this way (i.e. who can send? and who can receive?) because it is more intuitive for the user
//However, couple downsides: this doesn't support any TransfersMapping[] (e.g. transfer mapping of length 3 is not supported here but is on blockchain).
//As a result, we cannot automatically populate this component by default
//Also, this is not dynamic and will not support more fine-grained control in the future

export function TransfersMappingSelect({
  // isManagerApprovedSelect,
  // setHandled,
}: {
    // isManagerApprovedSelect?: boolean,
    // setHandled?: (handled: boolean) => void
  }) {
  return <></>
  // const collections = useCollectionsContext();
  // const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  // const transfersMapping = (isManagerApprovedSelect ? collection?.managerApprovedTransfers : collection?.allowedTransfers) ?? [];

  // const [showCustomSelect, setShowCustomSelect] = useState<boolean>(transfersMapping.length > 0 && !isAddressMappingFull(transfersMapping));

  // //This is now stored in TxTimeline (see above)
  // const [toSelectType, setToSelectType] = useState<AddressMappingSelectType>(AddressMappingSelectType.ALL);
  // const [fromSelectType, setFromSelectType] = useState<AddressMappingSelectType>(AddressMappingSelectType.ALL);

  // const [to, setTo] = useState<string[]>([]);
  // const [from, setFrom] = useState<string[]>([]);

  // const unselected = toSelectType == AddressMappingSelectType.UNSELECTED || fromSelectType == AddressMappingSelectType.UNSELECTED;

  // useEffect(() => {
  // if (INFINITE_LOOP_MODE) console.log('useEffect: ');
  //   if (!collection) return;

  //   if (toSelectType == AddressMappingSelectType.UNSELECTED || fromSelectType == AddressMappingSelectType.UNSELECTED) return;

  //   //This is a little confusing, but we have two different UX perspectives for transferability vs manager approved
  //   //Transferability is in the perspective of which users can transfer (the positive) and we have to map it to the negative for allowed transfers (i.e. user clicks all addresses -> allowedTransfers = [])
  //   //For manager approved, it is the opposite. It is what the users click (i.e. user clicks all addresses -> managerApprovedTransfers = [{to: {start: 0, end : infinity}, from: {...}}]
  //   //Thus, we put everything in the perspective of the AddressMapping here
  //   //After this, noFromAddresses will always mean empty [], noToAddresses will always mean empty [], regardless of the UX perspective
  //   // let allFromAddresses = isManagerApprovedSelect ? fromSelectType == AddressMappingSelectType.ALL : fromSelectType == AddressMappingSelectType.NONE;
  //   // let allToAddresses = isManagerApprovedSelect ? toSelectType == AddressMappingSelectType.ALL : toSelectType == AddressMappingSelectType.NONE;
  //   // let noFromAddresses = isManagerApprovedSelect ? fromSelectType == AddressMappingSelectType.NONE : fromSelectType == AddressMappingSelectType.ALL;
  //   // let noToAddresses = isManagerApprovedSelect ? toSelectType == AddressMappingSelectType.NONE : toSelectType == AddressMappingSelectType.ALL;
  //   // let everyoneExceptFrom = isManagerApprovedSelect ? fromSelectType == AddressMappingSelectType.EVERYONE_EXCEPT : fromSelectType == AddressMappingSelectType.SPECIFIC;
  //   // let everyoneExceptTo = isManagerApprovedSelect ? toSelectType == AddressMappingSelectType.EVERYONE_EXCEPT : toSelectType == AddressMappingSelectType.SPECIFIC;
  //   // let specificFrom = isManagerApprovedSelect ? fromSelectType == AddressMappingSelectType.SPECIFIC : fromSelectType == AddressMappingSelectType.EVERYONE_EXCEPT;
  //   // let specificTo = isManagerApprovedSelect ? toSelectType == AddressMappingSelectType.SPECIFIC : toSelectType == AddressMappingSelectType.EVERYONE_EXCEPT;

  //   // let toUnregistered: string[] = [];
  //   // let fromUnregistered: string[] = [];

  //   // let allFrom = allFromAddresses || (everyoneExceptFrom && from.length === 0);
  //   // let allTo = allToAddresses || (everyoneExceptTo && to.length === 0);
  //   // let noFrom = noFromAddresses || (specificFrom && from.length === 0);
  //   // let noTo = noToAddresses || (specificTo && to.length === 0);

  //   //TODO:
  //   // const fromAddressMapping: AddressMapping<bigint> | undefined = getAddressMappingForSelectOptions(true, fromUnregistered, from, allFrom, noFrom, everyoneExceptFrom);
  //   // const toAddressMapping: AddressMapping<bigint> | undefined = getAddressMappingForSelectOptions(false, toUnregistered, to, allTo, noTo, everyoneExceptTo);
  //   const fromAddressMapping: AddressMapping<bigint> | undefined = undefined;
  //   const toAddressMapping: AddressMapping<bigint> | undefined = undefined;



  //   const AddressMappings: AddressMapping<bigint>[] = [];

  //   if (fromAddressMapping) AddressMappings.push(fromAddressMapping);

  //   if (toAddressMapping) {
  //     if (fromAddressMapping && JSON.stringify(fromAddressMapping) == JSON.stringify(toAddressMapping)) {

  //     } else {
  //       AddressMappings.push(toAddressMapping);
  //     }
  //   }

  //   if (isManagerApprovedSelect) {
  //     collections.updateCollection({
  //       ...collection,
  //       managerApprovedTransfers: AddressMappings
  //     })
  //   } else {
  //     collections.updateCollection({
  //       ...collection,
  //       allowedTransfers: AddressMappings
  //     })
  //   }
  // }, [isManagerApprovedSelect, fromSelectType, toSelectType, from, to, showCustomSelect, collections, collection]);

  // let options = [];
  // if (isManagerApprovedSelect) {
  //   options.push(
  //     {
  //       title: isManagerApprovedSelect ? 'None' : 'Transferable',
  //       message: isManagerApprovedSelect ? `The manager will have no special approved transfers.` : 'Badge owners can transfer their badges to other addresses.',
  //       isSelected: !showCustomSelect && transfersMapping.length === 0 && !unselected
  //     },
  //     {
  //       title: isManagerApprovedSelect ? 'Complete Control' : 'Non-Transferable',
  //       message: isManagerApprovedSelect ? `The manager will be able to revoke and transfer any badge without its owners' approval.` : 'Badge owners cannot transfer their badges to other addresses.',
  //       isSelected: !showCustomSelect && isAddressMappingFull(transfersMapping) && !unselected
  //     }
  //   );
  // } else {
  //   options.push(
  //     {
  //       title: isManagerApprovedSelect ? 'Complete Control' : 'Non-Transferable',
  //       message: isManagerApprovedSelect ? `The manager will be able to revoke and transfer any badge without its owners' approval.` : 'Badge owners cannot transfer their badges to other addresses.',
  //       isSelected: !showCustomSelect && isAddressMappingFull(transfersMapping) && !unselected
  //     },
  //     {
  //       title: isManagerApprovedSelect ? 'None' : 'Transferable',
  //       message: isManagerApprovedSelect ? `The manager will have no special approved transfers.` : 'Badge owners can transfer their badges to other addresses.',
  //       isSelected: !showCustomSelect && transfersMapping.length === 0 && !unselected
  //     },
  //   );
  // }

  // options.push({
  //   title: 'Custom',
  //   message: isManagerApprovedSelect ? `Customize the manager's approved transfers.` : 'Customize the transferability.',
  //   isSelected: showCustomSelect
  // });

  // return <div style={{ textAlign: 'center' }}>
  //   <SwitchForm
  //     options={options}
  //     onSwitchChange={(index) => {
  //       //Reverse the order because we want non-transferable and none on left and transferable and complete control on right
  //       //This is bc there is a double negative (cannot transfer vs can transfer) and it's easier to think about it this way for the user
  //       if (!isManagerApprovedSelect) {
  //         if (index === 0) index = 1;
  //         else if (index === 1) index = 0;
  //       }

  //       if (setHandled) setHandled(true);
  //       setShowCustomSelect(index === 2);
  //       if (index === 0 || index == 1) {
  //         const setToAll = (index === 0 && !isManagerApprovedSelect) || (index === 1 && isManagerApprovedSelect);
  //         if (setToAll) {
  //           setToSelectType(AddressMappingSelectType.ALL);
  //           setFromSelectType(AddressMappingSelectType.ALL);
  //         } else {
  //           setToSelectType(AddressMappingSelectType.NONE);
  //           setFromSelectType(AddressMappingSelectType.NONE);
  //         }
  //       }
  //     }}
  //   />
  //   {showCustomSelect && <div>
  //     <hr />
  //     <div>
  //       {<div>
  //         <h2 className='primary-text'>Custom {isManagerApprovedSelect ? 'Approved Transfers' : 'Transferability'}</h2>

  //         {transfersMapping.length === 1 && isAddressMappingFull(transfersMapping) &&
  //           <p className='secondary-text'>
  //             <InfoCircleOutlined className='secondary-text' /> {isManagerApprovedSelect ? 'The manager will be able to revoke/transfer badges to/from any recipient without approval.' : 'Badges will be transferable.'}
  //           </p>
  //         }

  //         {transfersMapping.length === 0 &&
  //           <p className='secondary-text'>
  //             <InfoCircleOutlined className='secondary-text' /> {isManagerApprovedSelect ? 'The manager will have no approved transfers.' : 'Badges will be non-transferable.'}
  //           </p>
  //         }
  //         <br />
  //         {<div>
  //           <Row style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
  //             <Col md={12} sm={24} xs={24} style={{ display: 'flex', marginTop: 50 }}>
  //               <InformationDisplayCard
  //                 noBorder
  //                 title={isManagerApprovedSelect ? "Who is the manager approved to send from?" : "Who can send badges?"}
  //               >
  //                 <SwitchForm
  //                   // 
  //                   options={[
  //                     {
  //                       title: 'All Addresses',
  //                       message: 'Select all addresses.',
  //                       isSelected: fromSelectType == AddressMappingSelectType.ALL
  //                     },
  //                     {
  //                       title: 'Everyone Except',
  //                       message: 'Select all addresses, except the ones you specify below.',
  //                       isSelected: fromSelectType == AddressMappingSelectType.EVERYONE_EXCEPT
  //                     },
  //                     {
  //                       title: 'Specific Addresses',
  //                       message: 'Select only the addresses you specify below.',
  //                       isSelected: fromSelectType == AddressMappingSelectType.SPECIFIC
  //                     },
  //                     {
  //                       title: 'No Addresses',
  //                       message: 'No addresses selected.',
  //                       isSelected: fromSelectType == AddressMappingSelectType.NONE
  //                     }
  //                   ]}
  //                   onSwitchChange={(index) => {
  //                     if (index === 0) {
  //                       setFromSelectType(AddressMappingSelectType.ALL);
  //                     } else if (index === 1) {
  //                       setFromSelectType(AddressMappingSelectType.EVERYONE_EXCEPT);
  //                     } else if (index === 2) {
  //                       setFromSelectType(AddressMappingSelectType.SPECIFIC);
  //                     } else if (index === 3) {
  //                       setFromSelectType(AddressMappingSelectType.NONE);
  //                     }
  //                   }}
  //                 />
  //                 {(fromSelectType == AddressMappingSelectType.SPECIFIC || fromSelectType == AddressMappingSelectType.EVERYONE_EXCEPT)
  //                   && <div>
  //                     <Divider />
  //                     <div style={{ padding: 25 }}>
  //                       <AddressListSelect
  //                         users={from}
  //                         setUsers={setFrom}
  //                       />
  //                     </div>

  //                   </div>}
  //               </InformationDisplayCard>


  //             </Col>

  //             <Col md={12} sm={24} xs={24} style={{ display: 'flex', marginTop: 50 }}>
  //               <InformationDisplayCard
  //                 noBorder
  //                 title={isManagerApprovedSelect ? "Who is the manager approved to send to?" : "Who can receive badges?"}
  //               >
  //                 <SwitchForm
  //                   // 
  //                   options={[
  //                     {
  //                       title: 'All Addresses',
  //                       message: 'Select all addresses.',
  //                       isSelected: toSelectType == AddressMappingSelectType.ALL
  //                     },
  //                     {
  //                       title: 'Everyone Except',
  //                       message: 'Select all addresses, except the ones you specify below.',
  //                       isSelected: toSelectType == AddressMappingSelectType.EVERYONE_EXCEPT
  //                     },
  //                     {
  //                       title: 'Specific Addresses',
  //                       message: 'Select only the addresses you specify below.',
  //                       isSelected: toSelectType == AddressMappingSelectType.SPECIFIC
  //                     },
  //                     {
  //                       title: 'No Addresses',
  //                       message: 'No addresses selected.',
  //                       isSelected: toSelectType == AddressMappingSelectType.NONE
  //                     }
  //                   ]}
  //                   onSwitchChange={(index) => {
  //                     if (index === 0) {
  //                       setToSelectType(AddressMappingSelectType.ALL);
  //                     } else if (index === 1) {
  //                       setToSelectType(AddressMappingSelectType.EVERYONE_EXCEPT);
  //                     } else if (index === 2) {
  //                       setToSelectType(AddressMappingSelectType.SPECIFIC);
  //                     } else if (index === 3) {
  //                       setToSelectType(AddressMappingSelectType.NONE);
  //                     }
  //                   }}
  //                 />
  //                 {(toSelectType == AddressMappingSelectType.SPECIFIC || toSelectType == AddressMappingSelectType.EVERYONE_EXCEPT) && <div>
  //                   <Divider />
  //                   <div style={{ padding: 25 }}>
  //                     <AddressListSelect
  //                       users={to}
  //                       setUsers={setTo}
  //                     />
  //                   </div>
  //                 </div>}
  //               </InformationDisplayCard>
  //             </Col>
  //           </Row>
  //           <Divider />
  //         </div>
  //         }
  //       </div>}
  //     </div>
  //   </div>
  //   }
  //   <DevMode obj={transfersMapping} />
  // </div >
}