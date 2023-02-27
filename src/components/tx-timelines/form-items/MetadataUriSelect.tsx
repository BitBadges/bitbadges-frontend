import { Form, Typography, Input } from "antd";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../../constants";
import { useEffect, useState } from "react";

const { Text } = Typography;

export function MetadataUriSelect({
    setUri,
}: {
    setUri: (collectionUri: string, badgeUri: string) => void;
}) {
    const [collectionUri, setCollectionUri] = useState<string>("");
    const [badgeUri, setBadgeUri] = useState<string>("");

    useEffect(() => {
        setUri(collectionUri, badgeUri);
    }, [badgeUri, collectionUri, setUri]);

    return <>
        <Form.Item
            label={
                <Text
                    style={{ color: PRIMARY_TEXT }}
                    strong
                >
                    Collection Metadata
                </Text>
            }
            required
        >
            <Input
                onChange={(e: any) => {
                    setCollectionUri(e.target.value);
                }}
                style={{
                    backgroundColor: PRIMARY_BLUE,
                    color: PRIMARY_TEXT,
                }}
            />
        </Form.Item>
        <Form.Item
            label={
                <Text
                    style={{ color: PRIMARY_TEXT }}
                    strong
                >
                    Badge Metadata
                </Text>
            }
            required
        >
            <Input
                onChange={(e: any) => {
                    setBadgeUri(e.target.value);
                }}
                style={{
                    backgroundColor: PRIMARY_BLUE,
                    color: PRIMARY_TEXT,
                }}
            />
            <div style={{ fontSize: 12 }}>
                <Text style={{ color: 'lightgray' }}>
                    *Must include {"\"{id}\""}. This is a placeholder for the ID of the badge to be fetched.
                </Text>
            </div>
        </Form.Item>
    </>
}