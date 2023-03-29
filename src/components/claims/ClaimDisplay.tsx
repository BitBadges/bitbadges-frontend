import { ClockCircleOutlined, InfoCircleOutlined, InfoOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Empty, Input, Pagination, Row, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";
import { BitBadgeCollection, ClaimItem } from "../../bitbadges-api/types";
import { MAX_DATE_TIMESTAMP, MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT, WEBSITE_HOSTNAME } from "../../constants";
import { useAccountsContext } from "../../contexts/AccountsContext";
import { useChainContext } from "../../contexts/ChainContext";
import { AddressDisplay } from "../address/AddressDisplay";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { TransferDisplay } from "../transfers/TransferDisplay";
import { QRCode } from 'react-qrcode-logo';
import { useRouter } from "next/router";
import { downloadJson } from "../../utils/downloadJson";
import { SHA256 } from "crypto-js";


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
    const { code, password } = router.query;



    const [currCode, setCurrCode] = useState(code ? code as string : password ? password as string : '');
    const [codePage, setCodePage] = useState(1);
    const [showClaimDisplay, setShowClaimDisplay] = useState(!isCodeDisplay);

    const accounts = useAccountsContext();

    useEffect(() => {
        if (code) {
            setCurrCode(code as string);
        } else if (password) {
            setCurrCode(password as string);
        }
    }, [code, password]);

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



    let errorMessage = '';
    let cantClaim = false;
    let notConnected = false;
    let whitelistIndex: number | undefined = undefined;
    if (!chain.connected) {
        cantClaim = true;
        notConnected = true;
        errorMessage = 'Please connect your wallet!';
    } else if (claim.hasPassword && !chain.loggedIn) {
        cantClaim = true;
        notConnected = true;
        errorMessage = 'Please sign in with your wallet!';
    } else if (claim.limitPerAccount === 2 && collection.usedClaims.addresses && collection.usedClaims[`${claimId}`]?.addresses[chain.cosmosAddress] >= 1) {
        cantClaim = true;
        errorMessage = 'You have already claimed!';
    } else if (collection.usedClaims[`${claimId}`]?.codes && collection.usedClaims[`${claimId}`].codes[SHA256(currCode).toString()] > 0) {
        cantClaim = true;
        errorMessage = 'This code has already been used!';
    } else if (claim.failedToFetch || (claim.codeRoot && claim.codes.length === 0) || (claim.addresses.length === 0 && claim.whitelistRoot)) {
        cantClaim = true;
        errorMessage = 'The details for this claim were not found. This is usually the case when a badge collection is not created through the BitBadges website and incompatible.';
    }


    if (claim.limitPerAccount === 1) {
        const addresses = claim.addresses;
        //Get count of chain.cosmosAddress in addresses
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




    return <>
        <Card
            style={{
                width: 650,
                margin: 8,
                textAlign: 'center',
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT,
                border: `1px solid white`,
            }}
        >
            <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >
                <Row style={{ display: 'flex', justifyContent: 'center' }} >
                    <h1 style={{ color: PRIMARY_TEXT }}>{'Claim #' + (claimId + 1)}</h1>
                </Row>
                {isCodeDisplay && <Row>
                    <div style={{
                        width: '100%'
                    }}>
                        <Button className='screen-button' onClick={() => setShowClaimDisplay(!showClaimDisplay)} style={{ backgroundColor: PRIMARY_BLUE }} >{showClaimDisplay ? 'Show Codes/claimPasswords' : 'Show Claim Details'}</Button>
                        <br />
                        <hr />
                        <br />
                    </div>
                </Row>}

                {showClaimDisplay ? <div>


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
                    // size={35}
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
                        // size={35}
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
                                            // const address = 
                                            if (!x.addresses.find(y => y.includes(chain.cosmosAddress))) return <></>

                                            // if (collection.usedClaims.find((x) => x === SHA256(claim.fullCode).toString())) return <></>
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

                            {claim.limitPerAccount === 2 && <div style={{ color: SECONDARY_TEXT, textAlign: 'center' }}>
                                <p>*Only one claim allowed per account</p>
                            </div>}
                        </div>
                    </div>
                </div>
                    : <div>
                        <Row style={{ display: 'flex', justifyContent: 'center' }} >
                            <h3 style={{ color: PRIMARY_TEXT }}>{claimPassword ? 'Password' : 'Codes'}</h3>
                        </Row>
                        <Row style={{ display: 'flex', justifyContent: 'center' }} >
                            {claimPassword && <div>
                                <h3 style={{ color: PRIMARY_TEXT }}>Password: {claimPassword}</h3>
                                <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                    There are three ways you can distribute this password: manually, by URL, or by QR code.
                                </Typography.Text>
                                <Divider />

                                <Divider />
                                <h3 style={{ color: PRIMARY_TEXT }}>Manual</h3>
                                <Typography.Text strong copyable style={{ color: PRIMARY_TEXT, fontSize: 16 }}>
                                    {claimPassword}
                                </Typography.Text>
                                <br />
                                <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                    The password can be manually distributed, and the users will enter it on the claim page.
                                </Typography.Text>
                                <Divider />
                                <h3 style={{ color: PRIMARY_TEXT }}>URL</h3>
                                <Typography.Link strong copyable style={{ fontSize: 14 }}>
                                    {`${WEBSITE_HOSTNAME}/collections/${collection.collectionId}?claimId=${claimId}&password=${claimPassword}`}
                                </Typography.Link>
                                <br />

                                <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                    When a user navigates to the above URL, the password will be automatically inputted.
                                </Typography.Text>
                                <Divider />
                                <h3 style={{ color: PRIMARY_TEXT }}>QR Code</h3>
                                <QRCode value={`${WEBSITE_HOSTNAME}/collections/${collection.collectionId}?claimId=${claimId}&code=${claimPassword}`} />
                                <br />

                                <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                    When a user scans this QR code, it will take them to the claim page with the password automatically inputted.
                                </Typography.Text>
                            </div>}


                            {!claimPassword && codes && codes.length > 0 && <>
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
                                <br />
                                <div>
                                    <h3 style={{ color: PRIMARY_TEXT }}>Code #{codePage}</h3>
                                    <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                        There are three ways you can distribute this code: manually, by URL, or by QR code.
                                    </Typography.Text>
                                    <Divider />

                                    <Typography.Text strong style={{ color: SECONDARY_TEXT }}>
                                        <InfoCircleOutlined /> Note that this code can only be used once.
                                        <br />
                                        Current Status: {
                                            collection.usedClaims[`${claimId}`]?.codes && collection.usedClaims[`${claimId}`].codes[SHA256(codes[codePage - 1]).toString()] > 0 ? <span style={{ color: 'red' }}>USED</span> : <span style={{ color: 'green' }}>UNUSED</span>
                                        }
                                    </Typography.Text>

                                    <Divider />
                                    <h3 style={{ color: PRIMARY_TEXT }}>Manual</h3>
                                    <Typography.Text strong copyable style={{ color: PRIMARY_TEXT, fontSize: 16 }}>
                                        {codes[codePage - 1]}
                                    </Typography.Text>
                                    <br />
                                    <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                        The code can be manually distributed, and the users will enter it on the claim page.
                                    </Typography.Text>
                                    <Divider />
                                    <h3 style={{ color: PRIMARY_TEXT }}>URL</h3>
                                    <Typography.Link strong copyable style={{ fontSize: 14 }}>
                                        {WEBSITE_HOSTNAME}/collections/{collection.collectionId}?code={codes[codePage - 1]}
                                    </Typography.Link>
                                    <br />

                                    <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                        When a user navigates to the above URL, the code will be automatically inputted.
                                    </Typography.Text>
                                    <Divider />
                                    <h3 style={{ color: PRIMARY_TEXT }}>QR Code</h3>
                                    <QRCode value={`${WEBSITE_HOSTNAME}/collections/${collection.collectionId}?code=${codes[codePage - 1]}`} />
                                    <br />

                                    <Typography.Text style={{ color: SECONDARY_TEXT }}>
                                        When a user scans this QR code, it will take them to the claim page with the code automatically inputted.
                                    </Typography.Text>
                                </div>

                            </>}

                            {!claimPassword && (!codes || codes.length === 0) &&
                                <Empty
                                    description={<span style={{ color: PRIMARY_TEXT }}>There are no codes or passwords for this claim.</span>}
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    style={{ color: PRIMARY_TEXT }}
                                />}
                        </Row>

                    </div>}
            </div>
        </Card >
    </>
}
