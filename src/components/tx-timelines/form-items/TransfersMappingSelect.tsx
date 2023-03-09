import { InfoCircleOutlined } from "@ant-design/icons";
import { Divider } from "antd";
import { useEffect, useState } from "react";
import { RemoveIdsFromIdRange } from "../../../bitbadges-api/idRanges";
import { BitBadgesUserInfo, TransferMapping } from "../../../bitbadges-api/types";
import { DEV_MODE, GO_MAX_UINT_64, PRIMARY_TEXT, SECONDARY_TEXT } from "../../../constants";
import { AddressListSelect } from "../../address/AddressListSelect";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";
import { SwitchForm } from "./SwitchForm";

//TODO: onRegister for unregistered accounts
export function TransfersMappingSelect({
    transfersMapping,
    setTransfersMapping,
    isManagerApprovedSelect,
    setHandled
}: {
    transfersMapping: TransferMapping[],
    setTransfersMapping: (transfersMapping: TransferMapping[]) => void,
    isManagerApprovedSelect?: boolean,
    setHandled?: (handled: boolean) => void,
}) {
    const [showCustomSelect, setShowCustomSelect] = useState<boolean>(false);

    //TODO: deafults and we need to fetch accountsToShow from accountsCOntext
    const [allToAddresses, setAllToAddresses] = useState<boolean>(true);
    const [noToAddresses, setNoToAddresses] = useState<boolean>(false);
    const [noFromAddresses, setNoFromAddresses] = useState<boolean>(false);
    const [allFromAddresses, setAllFromAddresses] = useState<boolean>(true);
    const [everyoneExceptFrom, setEveryoneExceptFrom] = useState<boolean>(false);
    const [everyoneExceptTo, setEveryoneExceptTo] = useState<boolean>(false);
    const [to, setTo] = useState<BitBadgesUserInfo[]>([]);
    const [from, setFrom] = useState<BitBadgesUserInfo[]>([]);


    useEffect(() => {
        let _allFromAddresses = allFromAddresses;
        let _allToAddresses = allToAddresses;
        let _noFromAddresses = noFromAddresses;
        let _noToAddresses = noToAddresses;
        let _everyoneExceptFrom = everyoneExceptFrom;
        let _everyoneExceptTo = everyoneExceptTo;
        if (isManagerApprovedSelect) {
            _allFromAddresses = noFromAddresses;
            _allToAddresses = noToAddresses;
            _noFromAddresses = allFromAddresses;
            _noToAddresses = allToAddresses;
            _everyoneExceptFrom = !everyoneExceptFrom;
            _everyoneExceptTo = !everyoneExceptTo;
        }



        let allFrom = _allFromAddresses || (!_allFromAddresses && !_noFromAddresses && _everyoneExceptFrom && from.length === 0);
        let allTo = _allToAddresses || (!_allToAddresses && !_noToAddresses && _everyoneExceptTo && to.length === 0);

        const fromTransferMapping: TransferMapping | undefined = allFrom ? undefined : {
            from: {
                accountNums: _noFromAddresses ? [{
                    start: 0,
                    end: GO_MAX_UINT_64
                }] : from.map((user) => {
                    return {
                        start: user.accountNumber,
                        end: user.accountNumber
                    }
                }),
                options: 0,
            },
            to: {
                accountNums: [{
                    start: 0,
                    end: GO_MAX_UINT_64
                }],
                options: 0,
            }
        };

        let shouldCalculateEveryoneExceptFrom = !allFromAddresses && !_everyoneExceptFrom && fromTransferMapping && !_noFromAddresses;

        if (shouldCalculateEveryoneExceptFrom) {
            if (!fromTransferMapping) return;

            let everyoneExceptRanges = [{
                start: 0,
                end: GO_MAX_UINT_64
            }];

            for (const accountNums of fromTransferMapping?.from.accountNums) {
                for (let i = 0; i < everyoneExceptRanges.length; i++) {
                    everyoneExceptRanges = [...everyoneExceptRanges.slice(0, i), ...RemoveIdsFromIdRange(accountNums, everyoneExceptRanges[i]), ...everyoneExceptRanges.slice(i + 1)];
                }
            }

            fromTransferMapping.from.accountNums = everyoneExceptRanges;
        }

        const toTransferMapping: TransferMapping | undefined = allTo ? undefined : {
            from: {
                accountNums: [{
                    start: 0,
                    end: GO_MAX_UINT_64
                }],
                options: 0,
            },
            to: {
                accountNums: _noToAddresses ? [{
                    start: 0,
                    end: GO_MAX_UINT_64
                }] : to.map((user) => {
                    return {
                        start: user.accountNumber,
                        end: user.accountNumber
                    }
                }),
                options: 0,
            }
        };

        let shouldCalculateEveryoneExceptTo = !allToAddresses && !_everyoneExceptTo && toTransferMapping && !_noToAddresses;

        if (shouldCalculateEveryoneExceptTo) {
            if (!toTransferMapping) return;
            let everyoneExceptRanges = [{
                start: 0,
                end: GO_MAX_UINT_64
            }];

            for (const accountNums of toTransferMapping?.to.accountNums) {
                for (let i = 0; i < everyoneExceptRanges.length; i++) {
                    everyoneExceptRanges = [...everyoneExceptRanges.slice(0, i), ...RemoveIdsFromIdRange(accountNums, everyoneExceptRanges[i]), ...everyoneExceptRanges.slice(i + 1)];
                }
            }

            toTransferMapping.to.accountNums = everyoneExceptRanges;
        }



        const transferMappings: TransferMapping[] = [];
        if (fromTransferMapping) transferMappings.push(fromTransferMapping);
        if (toTransferMapping) transferMappings.push(toTransferMapping);

        if (_noFromAddresses && _noToAddresses) {
            setTransfersMapping([{
                from: {
                    accountNums: [{
                        start: 0,
                        end: GO_MAX_UINT_64
                    }],
                    options: 0,
                },
                to: {
                    accountNums: [{
                        start: 0,
                        end: GO_MAX_UINT_64
                    }],
                    options: 0,
                }
            }]);
        }
        else if (fromTransferMapping && toTransferMapping) {
            setTransfersMapping([{
                from: fromTransferMapping.from,
                to: toTransferMapping.to
            }]);
        }
        else setTransfersMapping(transferMappings);
    }, [isManagerApprovedSelect, allFromAddresses, allToAddresses, everyoneExceptFrom, everyoneExceptTo, from, noFromAddresses, noToAddresses, to, showCustomSelect, setTransfersMapping]);

    return <div style={{ textAlign: 'center' }}>
        <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: isManagerApprovedSelect ? 'None' : 'Transferable',
                    message: isManagerApprovedSelect ? `The manager will have no special approved transfers.` : 'Badge owners can transfer their badges to other addresses.',
                    isSelected: !showCustomSelect && transfersMapping.length === 0
                },
                {
                    title: isManagerApprovedSelect ? 'Complete Control' : 'Non-Transferable',
                    message: isManagerApprovedSelect ? `The manager will be able to revoke and transfer any badge without its owners' approval.` : 'Badge owners cannot transfer their badges to other addresses.',
                    isSelected: !showCustomSelect && transfersMapping.length === 1 && transfersMapping[0].to.accountNums.length === 1 &&
                        transfersMapping[0].to.accountNums[0].start == 0 &&
                        transfersMapping[0].to.accountNums[0].end == GO_MAX_UINT_64 &&
                        transfersMapping[0].from.accountNums.length === 1 &&
                        transfersMapping[0].from.accountNums[0].start == 0 &&
                        transfersMapping[0].from.accountNums[0].end == GO_MAX_UINT_64
                },
                {
                    title: 'Custom',
                    message: isManagerApprovedSelect ? `Customize the manager's approved transfers.` : 'Customize the transferability.',
                    isSelected: showCustomSelect
                }
            ]}
            onSwitchChange={(index) => {
                if (setHandled) setHandled(true);
                setShowCustomSelect(index === 2);
                if (index === 0 || index == 1) {
                    if (!isManagerApprovedSelect) {
                        if (index == 0) {
                            setAllFromAddresses(true);
                            setAllToAddresses(true);
                            setNoFromAddresses(false);
                            setNoToAddresses(false);
                        } else {
                            setNoFromAddresses(true);
                            setNoToAddresses(true);
                            setAllFromAddresses(false);
                            setAllToAddresses(false);
                        }
                    } else {
                        if (index == 0) {
                            setAllFromAddresses(false);
                            setAllToAddresses(false);
                            setNoFromAddresses(true);
                            setNoToAddresses(true);
                        } else {
                            setNoFromAddresses(false);
                            setNoToAddresses(false);
                            setAllFromAddresses(true);
                            setAllToAddresses(true);
                        }
                    }
                }


            }}
        />
        {showCustomSelect && <div>
            <hr />



            <div>
                {<div>
                    <h2 style={{ color: PRIMARY_TEXT }}>Custom {isManagerApprovedSelect ? 'Approved Transfers' : 'Transferability'}</h2>

                    {transfersMapping.length === 1 && transfersMapping[0].to.accountNums.length === 1 &&
                        transfersMapping[0].to.accountNums[0].start == 0 &&
                        transfersMapping[0].to.accountNums[0].end == GO_MAX_UINT_64 &&
                        transfersMapping[0].from.accountNums.length === 1 &&
                        transfersMapping[0].from.accountNums[0].start == 0 &&
                        transfersMapping[0].from.accountNums[0].end == GO_MAX_UINT_64 &&
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
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <div style={{ width: '48%', display: 'flex' }}>
                                <InformationDisplayCard
                                    noBorder
                                    title={isManagerApprovedSelect ? "Who is the manager approved to send from?" : "Who can send badges?"}
                                >
                                    <SwitchForm
                                        // noSelectUntilClick
                                        options={[
                                            {
                                                title: 'All Addresses',
                                                message: 'Select all addresses.',
                                                isSelected: !noFromAddresses && allFromAddresses
                                            },
                                            {
                                                title: 'Everyone Except',
                                                message: 'Select all addresses, except the ones you specify below.',
                                                isSelected: !noFromAddresses && !allFromAddresses && everyoneExceptFrom
                                            },
                                            {
                                                title: 'Specific Addresses',
                                                message: 'Select only the addresses you specify below.',
                                                isSelected: !noFromAddresses && !allFromAddresses && !everyoneExceptFrom
                                            },
                                            {
                                                title: 'No Addresses',
                                                message: 'No addresses selected.',
                                                isSelected: noFromAddresses
                                            }
                                        ]}
                                        onSwitchChange={(index) => {
                                            setAllFromAddresses(index === 0);
                                            setNoFromAddresses(index === 3);

                                            if (index === 1) {
                                                setEveryoneExceptFrom(true);
                                            }
                                            if (index === 2) {
                                                setEveryoneExceptFrom(false);
                                            }
                                        }}
                                    />
                                    {!allFromAddresses && !noFromAddresses && <div>
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


                            </div>
                            <div style={{ width: '48%', display: 'flex' }}>
                                <InformationDisplayCard
                                    noBorder
                                    title={isManagerApprovedSelect ? "Who is the manager approved to send to?" : "Who can received badges?"}
                                >
                                    <SwitchForm
                                        // noSelectUntilClick
                                        options={[
                                            {
                                                title: 'All Addresses',
                                                message: 'Select all addresses.',
                                                isSelected: !noToAddresses && allToAddresses
                                            },
                                            {
                                                title: 'Everyone Except',
                                                message: 'Select all addresses, except the ones you specify below.',
                                                isSelected: !noToAddresses && !allToAddresses && everyoneExceptTo
                                            },
                                            {
                                                title: 'Specific Addresses',
                                                message: 'Select only the addresses you specify below.',
                                                isSelected: !noToAddresses && !allToAddresses && !everyoneExceptTo
                                            },
                                            {
                                                title: 'No Addresses',
                                                message: 'No addresses selected.',
                                                isSelected: noToAddresses
                                            }
                                        ]}
                                        onSwitchChange={(index) => {
                                            setAllToAddresses(index === 0);
                                            setNoToAddresses(index === 3);

                                            if (index === 1) {
                                                setEveryoneExceptTo(true);
                                            }
                                            if (index === 2) {
                                                setEveryoneExceptTo(false);
                                            }
                                        }}
                                    />
                                    {!allToAddresses && !noToAddresses && <div>
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

                            </div>

                        </div>
                        <Divider />

                    </div>
                    }
                </div>}
            </div>
        </div>}
        {DEV_MODE &&
            <pre style={{
                color: SECONDARY_TEXT,
                backgroundColor: 'black',
                padding: 20,
            }}>
                {JSON.stringify(transfersMapping, null, 2)}
            </pre>}
    </div >
}