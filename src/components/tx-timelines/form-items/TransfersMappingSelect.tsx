import { InfoCircleOutlined } from "@ant-design/icons";
import { Col, Divider, Row } from "antd";
import { useEffect, useState } from "react";
import { getTransferMappingForSelectOptions, isTransferMappingFull } from "bitbadges-sdk";
import { BitBadgesUserInfo, TransferMappingWithUnregisteredUsers } from "bitbadges-sdk";
import { DEV_MODE, PRIMARY_TEXT, SECONDARY_TEXT } from "../../../constants";
import { AddressListSelect } from "../../address/AddressListSelect";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";
import { SwitchForm } from "./SwitchForm";

export enum TransferMappingSelectType {
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

//HACK: It has currently forced me to save state all the way in TxTimeline in order to populate defaults (i.e. when users click forward and back on steps, we need to be able to load their previous inputs)

export function TransfersMappingSelect({
    transfersMapping,
    setTransfersMapping,
    isManagerApprovedSelect,
    setHandled,
    toSelectType,
    setToSelectType,
    fromSelectType,
    setFromSelectType,
    to,
    setTo,
    from,
    setFrom
}: {
    transfersMapping: TransferMappingWithUnregisteredUsers[],
    setTransfersMapping: (transfersMapping: TransferMappingWithUnregisteredUsers[]) => void,
    isManagerApprovedSelect?: boolean,
    setHandled?: (handled: boolean) => void,
    toSelectType: TransferMappingSelectType,
    setToSelectType: (toSelectType: TransferMappingSelectType) => void,
    fromSelectType: TransferMappingSelectType,
    setFromSelectType: (fromSelectType: TransferMappingSelectType) => void,
    to: BitBadgesUserInfo[],
    setTo: (to: BitBadgesUserInfo[]) => void,
    from: BitBadgesUserInfo[],
    setFrom: (from: BitBadgesUserInfo[]) => void
}) {
    const [showCustomSelect, setShowCustomSelect] = useState<boolean>(transfersMapping.length > 0 && !isTransferMappingFull(transfersMapping));

    //This is now stored in TxTimeline (see above)
    // const [toSelectType, setToSelectType] = useState<TransferMappingSelectType>(TransferMappingSelectType.ALL);
    // const [fromSelectType, setFromSelectType] = useState<TransferMappingSelectType>(TransferMappingSelectType.ALL);

    // const [to, setTo] = useState<BitBadgesUserInfo[]>([]);
    // const [from, setFrom] = useState<BitBadgesUserInfo[]>([]);

    const unselected = toSelectType == TransferMappingSelectType.UNSELECTED || fromSelectType == TransferMappingSelectType.UNSELECTED;

    useEffect(() => {
        if (toSelectType == TransferMappingSelectType.UNSELECTED || fromSelectType == TransferMappingSelectType.UNSELECTED) return;

        //This is a little confusing, but we have two different UX perspectives for transferability vs manager approved
        //Transferability is in the perspective of which users can transfer (the positive) and we have to map it to the negative for disallowed transfers (i.e. user clicks all addresses -> disallowedTransfers = [])
        //For manager approved, it is the opposite. It is what the users click (i.e. user clicks all addresses -> managerApprovedTransfers = [{to: {start: 0, end : infinity}, from: {...}}]
        //Thus, we put everything in the perspective of the transferMapping here
        //After this, noFromAddresses will always mean empty [], noToAddresses will always mean empty [], regardless of the UX perspective
        let allFromAddresses = isManagerApprovedSelect ? fromSelectType == TransferMappingSelectType.ALL : fromSelectType == TransferMappingSelectType.NONE;
        let allToAddresses = isManagerApprovedSelect ? toSelectType == TransferMappingSelectType.ALL : toSelectType == TransferMappingSelectType.NONE;
        let noFromAddresses = isManagerApprovedSelect ? fromSelectType == TransferMappingSelectType.NONE : fromSelectType == TransferMappingSelectType.ALL;
        let noToAddresses = isManagerApprovedSelect ? toSelectType == TransferMappingSelectType.NONE : toSelectType == TransferMappingSelectType.ALL;
        let everyoneExceptFrom = isManagerApprovedSelect ? fromSelectType == TransferMappingSelectType.EVERYONE_EXCEPT : fromSelectType == TransferMappingSelectType.SPECIFIC;
        let everyoneExceptTo = isManagerApprovedSelect ? toSelectType == TransferMappingSelectType.EVERYONE_EXCEPT : toSelectType == TransferMappingSelectType.SPECIFIC;
        let specificFrom = isManagerApprovedSelect ? fromSelectType == TransferMappingSelectType.SPECIFIC : fromSelectType == TransferMappingSelectType.EVERYONE_EXCEPT;
        let specificTo = isManagerApprovedSelect ? toSelectType == TransferMappingSelectType.SPECIFIC : toSelectType == TransferMappingSelectType.EVERYONE_EXCEPT;

        let toUnregistered: string[] = [];
        let fromUnregistered: string[] = [];

        let allFrom = allFromAddresses || (everyoneExceptFrom && from.length === 0);
        let allTo = allToAddresses || (everyoneExceptTo && to.length === 0);
        let noFrom = noFromAddresses || (specificFrom && from.length === 0);
        let noTo = noToAddresses || (specificTo && to.length === 0);

        const fromTransferMapping: TransferMappingWithUnregisteredUsers | undefined = getTransferMappingForSelectOptions(true, fromUnregistered, from, allFrom, noFrom, everyoneExceptFrom);
        const toTransferMapping: TransferMappingWithUnregisteredUsers | undefined = getTransferMappingForSelectOptions(false, toUnregistered, to, allTo, noTo, everyoneExceptTo);

        const transferMappings: TransferMappingWithUnregisteredUsers[] = [];

        if (fromTransferMapping) transferMappings.push(fromTransferMapping);

        if (toTransferMapping) {
            if (fromTransferMapping && JSON.stringify(fromTransferMapping) == JSON.stringify(toTransferMapping)) {

            } else {
                transferMappings.push(toTransferMapping);
            }
        }
        setTransfersMapping(transferMappings);
    }, [isManagerApprovedSelect, fromSelectType, toSelectType, from, to, showCustomSelect, setTransfersMapping]);

    let options = [];
    if (isManagerApprovedSelect) {
        options.push(
            {
                title: isManagerApprovedSelect ? 'None' : 'Transferable',
                message: isManagerApprovedSelect ? `The manager will have no special approved transfers.` : 'Badge owners can transfer their badges to other addresses.',
                isSelected: !showCustomSelect && transfersMapping.length === 0 && !unselected
            },
            {
                title: isManagerApprovedSelect ? 'Complete Control' : 'Non-Transferable',
                message: isManagerApprovedSelect ? `The manager will be able to revoke and transfer any badge without its owners' approval.` : 'Badge owners cannot transfer their badges to other addresses.',
                isSelected: !showCustomSelect && isTransferMappingFull(transfersMapping) && !unselected
            }
        );
    } else {
        options.push(
            {
                title: isManagerApprovedSelect ? 'Complete Control' : 'Non-Transferable',
                message: isManagerApprovedSelect ? `The manager will be able to revoke and transfer any badge without its owners' approval.` : 'Badge owners cannot transfer their badges to other addresses.',
                isSelected: !showCustomSelect && isTransferMappingFull(transfersMapping) && !unselected
            },
            {
                title: isManagerApprovedSelect ? 'None' : 'Transferable',
                message: isManagerApprovedSelect ? `The manager will have no special approved transfers.` : 'Badge owners can transfer their badges to other addresses.',
                isSelected: !showCustomSelect && transfersMapping.length === 0 && !unselected
            },
        );
    }

    options.push({
        title: 'Custom',
        message: isManagerApprovedSelect ? `Customize the manager's approved transfers.` : 'Customize the transferability.',
        isSelected: showCustomSelect
    });

    return <div style={{ textAlign: 'center' }}>
        <SwitchForm
            options={options}
            onSwitchChange={(index) => {
                //Reverse the order because we want non-transferable and none on left and transferable and complete control on right
                //This is bc there is a double negative (cannot transfer vs can transfer) and it's easier to think about it this way for the user
                if (!isManagerApprovedSelect) {
                    if (index === 0) index = 1;
                    else if (index === 1) index = 0;
                }

                if (setHandled) setHandled(true);
                setShowCustomSelect(index === 2);
                if (index === 0 || index == 1) {
                    const setToAll = (index === 0 && !isManagerApprovedSelect) || (index === 1 && isManagerApprovedSelect);
                    if (setToAll) {
                        setToSelectType(TransferMappingSelectType.ALL);
                        setFromSelectType(TransferMappingSelectType.ALL);
                    } else {
                        setToSelectType(TransferMappingSelectType.NONE);
                        setFromSelectType(TransferMappingSelectType.NONE);
                    }
                }
            }}
        />
        {showCustomSelect && <div>
            <hr />
            <div>
                {<div>
                    <h2 style={{ color: PRIMARY_TEXT }}>Custom {isManagerApprovedSelect ? 'Approved Transfers' : 'Transferability'}</h2>

                    {transfersMapping.length === 1 && isTransferMappingFull(transfersMapping) &&
                        transfersMapping[0].fromUnregisteredUsers.length == 0 &&
                        transfersMapping[0].toUnregisteredUsers.length == 0 &&
                        <p style={{ color: SECONDARY_TEXT }}>
                            <InfoCircleOutlined style={{ color: SECONDARY_TEXT }} /> {isManagerApprovedSelect ? 'The manager will be able to revoke/transfer badges to/from any recipient without approval.' : 'Badges will be non-transferable.'}
                        </p>
                    }

                    {transfersMapping.length === 0 &&
                        <p style={{ color: SECONDARY_TEXT }}>
                            <InfoCircleOutlined style={{ color: SECONDARY_TEXT }} /> {isManagerApprovedSelect ? 'The manager will have no approved transfers.' : 'Badges will be transferable.'}
                        </p>
                    }
                    <br />
                    {<div>
                        <Row style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Col md={12} sm={24} xs={24} style={{ display: 'flex', marginTop: 50 }}>
                                <InformationDisplayCard
                                    noBorder
                                    title={isManagerApprovedSelect ? "Who is the manager approved to send from?" : "Who can send badges?"}
                                >
                                    <SwitchForm
                                        // 
                                        options={[
                                            {
                                                title: 'All Addresses',
                                                message: 'Select all addresses.',
                                                isSelected: fromSelectType == TransferMappingSelectType.ALL
                                            },
                                            {
                                                title: 'Everyone Except',
                                                message: 'Select all addresses, except the ones you specify below.',
                                                isSelected: fromSelectType == TransferMappingSelectType.EVERYONE_EXCEPT
                                            },
                                            {
                                                title: 'Specific Addresses',
                                                message: 'Select only the addresses you specify below.',
                                                isSelected: fromSelectType == TransferMappingSelectType.SPECIFIC
                                            },
                                            {
                                                title: 'No Addresses',
                                                message: 'No addresses selected.',
                                                isSelected: fromSelectType == TransferMappingSelectType.NONE
                                            }
                                        ]}
                                        onSwitchChange={(index) => {
                                            if (index === 0) {
                                                setFromSelectType(TransferMappingSelectType.ALL);
                                            } else if (index === 1) {
                                                setFromSelectType(TransferMappingSelectType.EVERYONE_EXCEPT);
                                            } else if (index === 2) {
                                                setFromSelectType(TransferMappingSelectType.SPECIFIC);
                                            } else if (index === 3) {
                                                setFromSelectType(TransferMappingSelectType.NONE);
                                            }
                                        }}
                                    />
                                    {(fromSelectType == TransferMappingSelectType.SPECIFIC || fromSelectType == TransferMappingSelectType.EVERYONE_EXCEPT)
                                        && <div>
                                            <Divider />
                                            <div style={{ padding: 25 }}>
                                                <AddressListSelect
                                                    users={from}
                                                    setUsers={setFrom}
                                                    darkMode
                                                />
                                            </div>

                                        </div>}
                                </InformationDisplayCard>


                            </Col>

                            <Col md={12} sm={24} xs={24} style={{ display: 'flex', marginTop: 50 }}>
                                <InformationDisplayCard
                                    noBorder
                                    title={isManagerApprovedSelect ? "Who is the manager approved to send to?" : "Who can receive badges?"}
                                >
                                    <SwitchForm
                                        // 
                                        options={[
                                            {
                                                title: 'All Addresses',
                                                message: 'Select all addresses.',
                                                isSelected: toSelectType == TransferMappingSelectType.ALL
                                            },
                                            {
                                                title: 'Everyone Except',
                                                message: 'Select all addresses, except the ones you specify below.',
                                                isSelected: toSelectType == TransferMappingSelectType.EVERYONE_EXCEPT
                                            },
                                            {
                                                title: 'Specific Addresses',
                                                message: 'Select only the addresses you specify below.',
                                                isSelected: toSelectType == TransferMappingSelectType.SPECIFIC
                                            },
                                            {
                                                title: 'No Addresses',
                                                message: 'No addresses selected.',
                                                isSelected: toSelectType == TransferMappingSelectType.NONE
                                            }
                                        ]}
                                        onSwitchChange={(index) => {
                                            if (index === 0) {
                                                setToSelectType(TransferMappingSelectType.ALL);
                                            } else if (index === 1) {
                                                setToSelectType(TransferMappingSelectType.EVERYONE_EXCEPT);
                                            } else if (index === 2) {
                                                setToSelectType(TransferMappingSelectType.SPECIFIC);
                                            } else if (index === 3) {
                                                setToSelectType(TransferMappingSelectType.NONE);
                                            }
                                        }}
                                    />
                                    {(toSelectType == TransferMappingSelectType.SPECIFIC || toSelectType == TransferMappingSelectType.EVERYONE_EXCEPT) && <div>
                                        <Divider />
                                        <div style={{ padding: 25 }}>
                                            <AddressListSelect
                                                users={to}
                                                setUsers={setTo}
                                                darkMode
                                            />
                                        </div>
                                    </div>}
                                </InformationDisplayCard>
                            </Col>
                        </Row>
                        <Divider />
                    </div>
                    }
                </div>}
            </div>
        </div>
        }
        {
            DEV_MODE &&
            <pre style={{
                color: SECONDARY_TEXT,
                backgroundColor: 'black',
                padding: 20,
            }}>
                {JSON.stringify(transfersMapping, null, 2)}
            </pre>
        }
    </div >
}