import { DeleteOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Avatar, Button, Divider, Steps, Tooltip } from "antd";
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { useState } from "react";
import { BadgeSupplyAndAmount, BitBadgeCollection } from "../../../bitbadges-api/types";
import { DEV_MODE, PRIMARY_TEXT, SECONDARY_TEXT } from "../../../constants";
import { BalanceDisplay } from "../../balances/BalanceDisplay";
import { BadgeSupply } from "../form-items/BadgeSupplySelect";
import { SwitchForm } from "../form-items/SwitchForm";

const { Step } = Steps;

export function BadgeSupplySelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    collection: BitBadgeCollection,
    existingCollectionToExclude?: BitBadgeCollection
) {

    const [currentStep, setCurrentStep] = useState(0);

    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };

    const [fungible, setFungible] = useState(true);
    const [handledFungible, setHandledFungible] = useState(false);

    const [selectIsVisible, setSelectIsVisible] = useState(false);

    const [currentSupply, setCurrentSupply] = useState<BadgeSupplyAndAmount>({
        amount: 0,
        supply: 0,
    });

    let collectionToShow = collection;
    if (existingCollectionToExclude) {
        collectionToShow.maxSupplys = collection.maxSupplys.filter((supply, idx) => {
            return supply !== existingCollectionToExclude.maxSupplys[idx];
        })
    }

    return {
        title: `Add Badges`,
        description: ``,
        node: <div style={{ color: PRIMARY_TEXT }}>
            <BalanceDisplay
                hideModalBalance={true}
                collection={collectionToShow}
                balance={{
                    balances: collectionToShow.maxSupplys,
                    approvals: []
                }}
                // size={40}
                message={'Badge Supplys'}
                showingSupplyPreview
            />
            {<div style={{ display: 'flex', justifyContent: 'center' }}>
                <Tooltip placement='bottom' title={!selectIsVisible ? 'Add More Badges' : 'Hide'}>
                    <Avatar
                        className='screen-button'
                        onClick={() => setSelectIsVisible(!selectIsVisible)}
                        // src={ }
                        style={{
                            cursor: 'pointer',
                            margin: 10,
                        }}
                        size={40}
                    >
                        {!selectIsVisible ? <PlusOutlined size={40} /> : <MinusOutlined size={40} />}
                    </Avatar>
                </Tooltip>

                <Tooltip placement='bottom' title={'Remove All Added Badges'}>
                    <Avatar
                        className='screen-button'
                        onClick={() => setNewCollectionMsg({
                            ...newCollectionMsg,
                            badgeSupplys: []
                        })}
                        // src={ }
                        style={{
                            cursor: 'pointer',
                            margin: 10,
                        }}
                        size={40}
                    >
                        <DeleteOutlined size={40} />
                    </Avatar>
                </Tooltip>
            </div>
            }
            <br />

            {selectIsVisible && <div>
                <h2 style={{ textAlign: 'center', color: PRIMARY_TEXT }}>Add Badges?</h2>
                {<div>
                    <Steps
                        current={currentStep}
                        onChange={onStepChange}
                        direction='horizontal'
                        type='navigation'
                    >

                        <Step
                            key={0}
                            title={<b>{'Select Type'}</b>}
                        />

                        <Step
                            key={0}
                            title={<b>{'Select Amount'}</b>}
                            disabled={!handledFungible}
                        />


                    </Steps>
                    {currentStep === 0 && <div>
                        <Divider />
                        <SwitchForm
                            noSelectUntilClick
                            options={[
                                {
                                    title: 'Non-Fungible',
                                    message: 'Add badges with unique characteristics (i.e. X badges each with a supply of 1).',
                                    isSelected: !fungible,
                                },
                                {
                                    title: 'Fungible',
                                    message: 'Add a fungible badge (i.e. a single badge with X supply).',
                                    isSelected: fungible,
                                },

                            ]}
                            onSwitchChange={(idx) => {
                                setFungible(idx === 1);
                                setHandledFungible(true);
                            }}
                        />
                    </div>
                    }
                    {currentStep === 1 && <div>
                        <br />
                        <BadgeSupply
                            setCurrentSupply={setCurrentSupply}
                            fungible={fungible}
                        />
                        <br />
                        <div style={{ color: SECONDARY_TEXT, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <InfoCircleOutlined style={{ marginRight: 4 }} />
                            {' '}{currentSupply.amount}
                            {' '}
                            {fungible ? 'fungible' : 'non-fungible'}
                            {' '}
                            badge{currentSupply.amount !== 1 && 's'} with a supply of {currentSupply.supply} will be added to the collection.
                            {' '}
                            Note that the supply of each badge cannot be edited after they are created.
                        </div>
                        <Divider />
                        <Button
                            type="primary"
                            disabled={currentSupply.amount <= 0 || currentSupply.supply <= 0}
                            onClick={() => {
                                setNewCollectionMsg({
                                    ...newCollectionMsg,
                                    badgeSupplys: [
                                        ...newCollectionMsg.badgeSupplys,
                                        currentSupply
                                    ]
                                });
                                setSelectIsVisible(false);
                                setCurrentSupply({
                                    amount: 1,
                                    supply: 1
                                });
                                setHandledFungible(false);
                                setCurrentStep(0);
                            }
                            }
                            style={{ width: '100%' }}

                        >
                            Add Badges
                        </Button>
                    </div>}
                    <Divider />
                </div>}
            </div>
            }
            <Divider />
            {DEV_MODE && <div style={{ backgroundColor: 'black' }}>
                <pre>
                    {JSON.stringify(collection.badgeMetadata, null, 2)}
                </pre>
            </div>}
            {DEV_MODE && <div style={{ backgroundColor: 'black' }}>
                <pre>
                    {JSON.stringify(newCollectionMsg, null, 2)}
                </pre>
            </div>}
        </div >,
        disabled: newCollectionMsg.badgeSupplys?.length == 0
    }
}