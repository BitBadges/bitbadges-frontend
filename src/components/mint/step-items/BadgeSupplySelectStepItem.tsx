import { Button, Divider, Steps } from "antd";
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { useState } from "react";
import { getBadgeSupplysFromMsgNewCollection } from "../../../bitbadges-api/balances";
import { BadgeSupplyAndAmount, BitBadgeCollection } from "../../../bitbadges-api/types";
import { PRIMARY_TEXT, TERTIARY_BLUE } from "../../../constants";
import { BalanceDisplay } from "../../common/BalanceDisplay";
import { SwitchForm } from "../../common/SwitchForm";
import { BadgeSupply } from "../form-items/BadgeSupplySelect";

const { Step } = Steps;

export function BadgeSupplySelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    collection: BitBadgeCollection,
    addingMore: boolean
) {

    const [currentStep, setCurrentStep] = useState(0);

    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };

    const [fungible, setFungible] = useState(true);
    const [handledFungible, setHandledFungible] = useState(false);

    const [selectIsVisible, setSelectIsVisible] = useState(false);

    const [currentSupply, setCurrentSupply] = useState<BadgeSupplyAndAmount>({
        amount: 1,
        supply: 1
    });

    return {
        title: `How Many Badges To Create?`,
        description: ``,
        node: <div style={{ color: PRIMARY_TEXT }}>
            {newCollectionMsg.badgeSupplys.length > 0 &&
                <BalanceDisplay
                    collection={collection}
                    balance={getBadgeSupplysFromMsgNewCollection(newCollectionMsg, addingMore ? collection : undefined)}
                    size={35}
                    message={'Badge Supplys for This Collection'}
                    showingSupplyPreview
                />}
            <Divider />
            {!selectIsVisible && <Button
                type='primary'
                onClick={() => setSelectIsVisible(true)}
                style={{ width: '100%' }}
            >
                Add Badges to Collection
            </Button>}
            <Divider />

            {selectIsVisible && <div>
                <h2 style={{ textAlign: 'center' }}>Add Badges?</h2>
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
                                    title: 'Identical',
                                    message: 'Badges will all be identical. The collection will consist of 1 badge with supply Y (fungible).',
                                    isSelected: fungible,
                                },
                                {
                                    title: 'Unique',
                                    message: 'Badges will have their own unique characteristics. The collection will consist of X badges each with supply 1 (non-fungible).',
                                    isSelected: !fungible,
                                },
                            ]}
                            onSwitchChange={(idx) => {
                                setFungible(idx === 0);
                                setHandledFungible(true);
                            }}
                        />
                    </div>
                    }
                    {currentStep === 1 && <div>
                        <Divider />
                        <BadgeSupply
                            currentSupply={currentSupply}
                            setCurrentSupply={setCurrentSupply}
                            fungible={fungible}
                        />
                        <Button
                            type="primary"
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
            </div>}
            {newCollectionMsg.badgeSupplys.length > 0 && <Button
                className='screen-button'
                onClick={() => setNewCollectionMsg({
                    ...newCollectionMsg,
                    badgeSupplys: []
                })}
                style={{ width: '100%' }}
            >
                Reset All
            </Button>}
            <Divider />
        </div>,
        disabled: newCollectionMsg.badgeSupplys?.length == 0
    }
}