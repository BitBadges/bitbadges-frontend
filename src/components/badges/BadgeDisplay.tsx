import { Badge } from './Badge';
import { Typography, Layout, Collapse, Select, Empty } from 'antd';
import React from 'react';

import { useState } from 'react';
import { PRIMARY_TEXT, TERTIARY_BLUE } from '../../constants';

const { Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

export function BadgeDisplay({
    badges,
    balanceMap,
    collected,
    isManaging,
}: {
    badges: string[]; //TODO
    balanceMap: any; //TODO
    collected: boolean;
    isManaging: boolean;
}) {
    // const badgeMap = useSelector((state: any) => state.user.badgeMap);
    const [groupBy, setGroupBy] = useState('all');
    const [sortBy, setSortBy] = useState('date');

    if (!badges) return <></>;

    let badgesByType: any = {};
    for (const badge of badges) {
        if (badgeMap[badge].metadata.category) {
            let category: string = badgeMap[badge].metadata.category
            badgesByType[category] = badgesByType[
                badgeMap[badge].metadata.category
            ]
                ? [
                    ...badgesByType[badgeMap[badge].metadata.category],
                    badgeMap[badge],
                ]
                : [badgeMap[badge]];
        } else {
            badgesByType['Other'] = badgesByType['Other']
                ? [...badgesByType['Other'], badgeMap[badge]]
                : [badgeMap[badge]];
        }
    }

    return (
        <Content
            style={{
                padding: '0',
                margin: 0,
                minHeight: '60vh',
                backgroundColor: TERTIARY_BLUE,
                width: '100%',
            }}
        >
            <div
                style={{
                    minHeight: 30,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'right',
                    alignItems: 'center',
                    color: PRIMARY_TEXT,
                }}
            >
                <Text style={{ color: PRIMARY_TEXT }}>Group By: </Text>
                <Select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e)}
                    style={{ marginLeft: 5, marginRight: 10 }}
                    defaultValue="type"
                    size="small"
                    disabled
                >
                    <Option value="all">All</Option>
                    <Option value="type">Type</Option>
                </Select>
                <Text style={{ color: PRIMARY_TEXT }}>Sort By: </Text>
                <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e)}
                    style={{ marginLeft: 5, marginRight: 5 }}
                    defaultValue="date"
                    size="small"
                    disabled
                >
                    <Option value="date">Date</Option>
                </Select>
            </div>
            {(!badges || !badges.length) &&

                <Collapse
                    accordion
                    style={{
                        padding: 0,
                        margin: 0,
                        width: '100%',
                        backgroundColor: TERTIARY_BLUE,
                        border: '0px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        {Object.keys(badgesByType)
                            .sort()
                            .map((type) => (
                                <>
                                    {badgesByType[type].map((badge: any) => ( //TODO
                                        <Badge
                                            key={badge.id}
                                            managing={isManaging}

                                            size={100}
                                            badge={badge}
                                        />
                                    ))}
                                </>
                            ))}
                    </div>
                </Collapse>
            }
        </Content>
    );
}
