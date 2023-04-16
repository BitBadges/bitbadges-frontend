import { ClockCircleOutlined, InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Empty, Input, Pagination, Row, Tooltip, Typography } from "antd";
import { SHA256 } from "crypto-js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { QRCode } from 'react-qrcode-logo';
import { BitBadgeCollection, ClaimItem, MAX_DATE_TIMESTAMP, MINT_ACCOUNT } from "bitbadges-sdk";
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT, WEBSITE_HOSTNAME } from "../../constants";
import { useAccountsContext } from "../../contexts/AccountsContext";
import { useChainContext } from "../../contexts/ChainContext";
import { downloadJson } from "../../utils/downloadJson";
import { AddressDisplay } from "../address/AddressDisplay";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { TransferDisplay } from "../transfers/TransferDisplay";


export function ClaimDisplay({
    claim,
    collection,
    openModal,
    claimId,
    isCodeDisplay,
    codes,
    claimPassword
}: {
    claim: ClaimItem,
    collection: BitBadgeCollection,
    openModal: (claimItem: ClaimItem, code?: string, whitelistIndex?: number) => void,
    claimId: number
    isCodeDisplay?: boolean
    codes?: string[]
    claimPassword?: string
}) {
    const chain = useChainContext();
    const router = useRouter();
    const accounts = useAccountsContext();

    const query = router.query;
    const codeQuery = query.code as string;
    const passwordQuery = query.password as string;

    const [codePage, setCodePage] = useState(1);
    const [currCode, setCurrCode] = useState(codeQuery ? codeQuery as string : passwordQuery ? passwordQuery as string : '');
    const [showClaimDisplay, setShowClaimDisplay] = useState(!isCodeDisplay);

    useEffect(() => {
        if (codeQuery) {
            setCurrCode(codeQuery as string);
        } else if (passwordQuery) {
            setCurrCode(passwordQuery as string);
        }
    }, [codeQuery, passwordQuery]);

    let endTimestamp = claim.timeRange.end;
    let validForever = claim.timeRange.end >= MAX_DATE_TIMESTAMP;

    const endDateString = validForever ? `Forever` : new Date(
        endTimestamp * 1000
    ).toLocaleDateString() + ' ' + new Date(
        endTimestamp * 1000
    ).toLocaleTimeString();

    const startDateString = new Date(
        claim.timeRange.start * 1000
    ).toLocaleDateString() + ' ' + new Date(
        claim.timeRange.start * 1000
    ).toLocaleTimeString();

    let isExpired = false;
    let hasStarted = false;

    if (Date.now() > claim.timeRange.start * 1000) {
        hasStarted = true;
    }

    if (Date.now() > endTimestamp * 1000) {
        isExpired = true;
    }

    let timeStr = '';
    if (isExpired) {
        timeStr = 'This claim has expired!';
    } else if (!hasStarted) {
        timeStr = 'Open from ' + startDateString + ' to ' + endDateString;
    } else if (validForever) {
        timeStr = 'This claim never expires!';
    } else {
        timeStr = 'This claim expires at ' + endDateString;
    }

    if (claim.balances.length === 0) return <></>



    //There are many different cases that can happen here as to why a user can not claim
    //1. Not connected to wallet
    //2. Not logged in to wallet and password claim (requires login)
    //3. Only one claim per address and user has already claimed
    //4. Only one claim per code and code has been used
    //5. Could not fetch claim data when it was created (most likely due to not being created through BitBadges website and being incompatible)
    //6. Only one claim per whitelist index and user has already used all their claims in the index

    let errorMessage = '';
    let cantClaim = false;
    let notConnected = false;
    let whitelistIndex: number | undefined = undefined;
    //Cases 1-5
    if (!chain.connected) {
        cantClaim = true;
        notConnected = true;
        errorMessage = 'Please connect your wallet!';
    } else if (claim.hasPassword && !chain.loggedIn) {
        cantClaim = true;
        notConnected = true;
        errorMessage = 'Please sign in with your wallet!';
    } else if (claim.restrictOptions === 2 && collection.usedClaims.addresses && collection.usedClaims[`${claimId}`]?.addresses[chain.cosmosAddress] >= 1) {
        cantClaim = true;
        errorMessage = 'You have already claimed!';
    } else if (collection.usedClaims[`${claimId}`]?.codes && collection.usedClaims[`${claimId}`].codes[SHA256(currCode).toString()] > 0) {
        cantClaim = true;
        errorMessage = 'This code has already been used!';
    } else if (claim.failedToFetch || (claim.codeRoot && claim.hashedCodes.length === 0) || (claim.addresses.length === 0 && claim.whitelistRoot)) {
        cantClaim = true;
        errorMessage = 'The details for this claim were not found. This is usually the case when a badge collection is not created through the BitBadges website and incompatible.';
    }

    //Case 6
    if (claim.restrictOptions === 1) {
        const addresses = claim.addresses;
        const max = addresses.filter(x => x === chain.cosmosAddress).length;
        let currUsed = 0;
        if (collection.usedClaims.addresses) {
            currUsed = collection.usedClaims[`${claimId}`].addresses[chain.cosmosAddress]
        }

        if (currUsed >= max) {
            cantClaim = true;
            errorMessage = 'You do not have any claims left!';

        } else {
            let targetIndex = currUsed;
            let count = 0;
            for (let i = 0; i < claim.addresses.length; i++) {
                const address = claim.addresses[i];
                if (count === targetIndex) {
                    whitelistIndex = i;
                }

                if (address === chain.cosmosAddress) {
                    count++;
                }
            }
        }
    }


    const printStr = claim.hasPassword ? 'password' : 'code';
    const urlSuffix = claim.hasPassword ? `password=${claimPassword}` : codes ? `code=${codes[codePage - 1]}` : '';

    return <>
        <Card
            style={{
                // width: 650,
                // margin: 8,
                textAlign: 'center',
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT,
                border: `1px solid white`,
                borderRadius: 10,
            }}
        >
            <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >
                <Row style={{ display: 'flex', justifyContent: 'center' }} >
                    <h1 style={{ color: PRIMARY_TEXT }}>{'Claim #' + (claimId)}</h1>
                </Row>
                {isCodeDisplay && <Row>
                    <div style={{
                        width: '100%'
                    }}>
                        <Button className='screen-button' onClick={() => setShowClaimDisplay(!showClaimDisplay)} style={{ backgroundColor: PRIMARY_BLUE }} >{showClaimDisplay ? 'Show Codes/Passwords' : 'Show Claim Details'}</Button>
                        <br />
                        <hr />
                        <br />
                    </div>
                </Row>}

                {showClaimDisplay ?
                    <div>
                        {/* <Row style={{ display: 'flex', justifyContent: 'center' }} >
                            <h3 style={{ color: PRIMARY_TEXT }}>STATUS: {expired}</h3>
                        </Row> */}
                        <Row style={{ display: 'flex', justifyContent: 'center' }} >
                            <h3 style={{ color: PRIMARY_TEXT }}><ClockCircleOutlined /> {timeStr}</h3>
                        </Row>
                        <BalanceDisplay
                            message={'Unclaimed Badges Left'}
                            collection={collection}
                            balance={{
                                approvals: [],
                                balances: claim.balances
                            }}
                        />
                        <hr />
                        <div>
                            <BalanceDisplay
                                message={'Current Claim'}
                                collection={collection}
                                balance={{
                                    approvals: [],
                                    balances: [
                                        {
                                            balance: claim.amount,
                                            badgeIds: claim.badgeIds,
                                        }
                                    ]
                                }}
                            />

                            {claim.incrementIdsBy > 0 && <div>
                                <br />
                                <Row style={{ display: 'flex', justifyContent: 'center' }} >
                                    <p style={{ color: PRIMARY_TEXT }}>
                                        <WarningOutlined style={{ color: 'orange' }} /> Each time a user claims, the claimable badge IDs increment by {claim.incrementIdsBy}. {"So if other claims are processed before yours, you will receive different badge IDs than the ones displayed."}
                                    </p>
                                </Row>
                                <br />
                            </div>}

                            <div style={{ alignItems: 'center', justifyContent: 'center', overflow: 'auto' }} >
                                {notConnected ? <>
                                    <hr />
                                    <br />
                                    <div>
                                        <BlockinDisplay hideLogo />
                                    </div>
                                </> : <>
                                    {claim.codeRoot &&
                                        <>
                                            <hr />
                                            <h3 style={{ color: PRIMARY_TEXT }}>Enter {claim.hasPassword ? 'Password' : 'Code'} to Claim</h3>
                                            <Input
                                                placeholder={`Enter ${claim.hasPassword ? 'Password' : 'Code'}`}
                                                value={currCode}
                                                onChange={(e: any) => {
                                                    setCurrCode(e.target.value);
                                                }}
                                                style={{
                                                    backgroundColor: PRIMARY_BLUE,
                                                    color: PRIMARY_TEXT,
                                                    textAlign: 'center'
                                                }}
                                            />
                                        </>
                                    }

                                    {claim.whitelistRoot &&
                                        <>
                                            <hr />
                                            <br />
                                            {!claim.addresses.find(y => y.includes(chain.cosmosAddress))
                                                ? <div>
                                                    <h3 style={{ color: PRIMARY_TEXT }}>You are not on the whitelist.</h3>
                                                    <div className='flex-between' style={{ justifyContent: 'center' }}>
                                                        <AddressDisplay
                                                            fontColor={PRIMARY_TEXT}
                                                            userInfo={{
                                                                address: chain.address,
                                                                accountNumber: chain.accountNumber,
                                                                cosmosAddress: chain.cosmosAddress,
                                                                chain: chain.chain,
                                                            }} />
                                                    </div>
                                                </div> :
                                                <div>
                                                    {chain.connected && <div>
                                                        <h3 style={{ color: PRIMARY_TEXT }}>You have been whitelisted!</h3>
                                                    </div>}
                                                </div>}

                                            {[claim].map((x) => {
                                                if (!x.addresses.find(y => y.includes(chain.cosmosAddress))) return <></>

                                                accounts.fetchAccounts([chain.cosmosAddress]);
                                                return accounts.accounts[accounts.cosmosAddresses[chain.cosmosAddress]] && <>
                                                    <TransferDisplay
                                                        hideBalances
                                                        collection={collection}
                                                        fontColor={PRIMARY_TEXT}
                                                        from={[
                                                            MINT_ACCOUNT
                                                        ]}
                                                        transfers={[
                                                            {
                                                                toAddresses: [accounts.accounts[accounts.cosmosAddresses[chain.cosmosAddress]]?.accountNumber],
                                                                balances: [{
                                                                    balance: claim.amount,
                                                                    badgeIds: claim.badgeIds,
                                                                }],
                                                                toAddressInfo: [accounts.accounts[accounts.cosmosAddresses[chain.cosmosAddress]]],
                                                            }
                                                        ]}
                                                        setTransfers={() => { }}
                                                    />
                                                </>
                                            })}
                                        </>
                                    }
                                </>}

                                <br />
                                <br />

                                <Tooltip style={{ width: '100%', display: 'flex' }} title={errorMessage}>
                                    <Button disabled={cantClaim} type='primary' onClick={() => openModal(claim, currCode, whitelistIndex)} style={{ width: '100%' }}>Claim</Button>
                                </Tooltip>

                                {claim.restrictOptions === 2 && <div style={{ color: SECONDARY_TEXT, textAlign: 'center' }}>
                                    <p>*Only one claim allowed per account</p>
                                </div>}
                            </div>
                        </div>
                    </div>
                    :
                    // Show authenticated manager information (passwords, codes, distribution methods, etc...)
                    <div>
                        <Row style={{ display: 'flex', justifyContent: 'center' }} >
                            <h3 style={{ color: PRIMARY_TEXT }}>{claim.hasPassword ? 'Password' : 'Codes'}</h3>
                        </Row>
                        <Row style={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
                            <div>
                                {!claim.hasPassword && codes && codes.length > 0 && <>
                                    <div>
                                        <button
                                            style={{
                                                backgroundColor: 'inherit',
                                                color: PRIMARY_TEXT,
                                            }}
                                            onClick={() => {
                                                const today = new Date();

                                                const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                                                const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                                                downloadJson({
                                                    prefixUrl: WEBSITE_HOSTNAME + '/collections/' + collection.collectionId + '?claimId=' + claimId + '&code=ADD_CODE_HERE',
                                                    codes
                                                }, `codes-${collection.collectionMetadata.name}-claimId=${claimId}-${dateString}-${timeString}.json`);
                                            }}
                                            className="opacity link-button"
                                        >
                                            Click here to download a file with all these codes. Keep this file safe and secure!
                                        </button>
                                        <Divider />
                                    </div>
                                    <Pagination
                                        style={{ color: PRIMARY_TEXT }}
                                        current={codePage}
                                        total={codes.length}
                                        pageSize={1}
                                        onChange={(page) => {
                                            setCodePage(page);
                                        }}
                                        size='small'
                                        showSizeChanger={false}
                                    />
                                    <br />
                                </>
                                }
                                {claimPassword && <div>
                                    <h3 style={{ color: PRIMARY_TEXT }}>Password: {claimPassword}</h3>
                                </div>}
                                <br />
                                <br />
                                <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                    There are three ways you can distribute this {printStr}: manually, by URL, or by QR code.
                                </Typography.Text>
                                <Divider />

                                {!claim.hasPassword && codes && <Typography.Text strong style={{ color: SECONDARY_TEXT }}>
                                    <InfoCircleOutlined /> Note that this code can only be used once.
                                    <br />
                                    Current Status: {
                                        collection.usedClaims[`${claimId}`]?.codes && collection.usedClaims[`${claimId}`].codes[SHA256(codes[codePage - 1]).toString()] > 0 ? <span style={{ color: 'red' }}>USED</span> : <span style={{ color: 'green' }}>UNUSED</span>
                                    }
                                </Typography.Text>}

                                <Divider />
                                <h3 style={{ color: PRIMARY_TEXT }}>Manual</h3>
                                <Typography.Text strong copyable style={{ color: PRIMARY_TEXT, fontSize: 16 }}>
                                    {claim.hasPassword ? claimPassword : codes ? codes[codePage - 1] : ''}
                                </Typography.Text>
                                <br />
                                <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                    The {printStr} can be manually distributed, and the users will enter it on the claim page.
                                </Typography.Text>
                                <Divider />
                                <h3 style={{ color: PRIMARY_TEXT }}>URL</h3>
                                <Typography.Link strong copyable style={{ fontSize: 14 }}>
                                    {`${WEBSITE_HOSTNAME}/collections/${collection.collectionId}?claimId=${claimId}&${urlSuffix}`}
                                </Typography.Link>
                                <br />

                                <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                    When a user navigates to the above URL, the {printStr} will be automatically inputted.
                                </Typography.Text>
                                <Divider />
                                <h3 style={{ color: PRIMARY_TEXT }}>QR Code</h3>
                                <QRCode value={`${WEBSITE_HOSTNAME}/collections/${collection.collectionId}?claimId=${claimId}&${urlSuffix}`} />
                                <br />

                                <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                    When a user scans this QR code, it will take them to the claim page with the {printStr} automatically inputted.
                                </Typography.Text>
                            </div>
                        </Row>
                        {!claim.hasPassword && (!codes || codes.length === 0) &&
                            <Empty
                                description={<span style={{ color: PRIMARY_TEXT }}>There are no {printStr}s for this claim.</span>}
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                style={{ color: PRIMARY_TEXT }}
                            />}
                    </div>}


            </div>
        </Card >
    </>
}
