import { Form, Typography, Input } from "antd";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../../constants";
import { UriObject } from "bitbadgesjs-transactions/dist/messages/bitbadges/badges/typeUtils";
import { useEffect, useState } from "react";
import { getSubassetUriFromUriObject, getUriFromUriObject, getUriObjectFromCollectionAndBadgeUri, getUriObjectFromCollectionUri } from "../../../bitbadges-api/uris";

const { Text } = Typography;

export function UriSelect({
    setUri,
}: {
    setUri: (uri: UriObject) => void;
}) {
    const [collectionUri, setCollectionUri] = useState<string>("");
    const [badgeUri, setBadgeUri] = useState<string>("");

    const [uriObject, setUriObject] = useState<UriObject>({
        uri: "",
    });

    useEffect(() => {
        let newUriObject = getUriObjectFromCollectionUri(collectionUri);
        setUriObject(getUriObjectFromCollectionAndBadgeUri(newUriObject, badgeUri));

    }, [badgeUri, collectionUri, setUriObject]);

    useEffect(() => {
        setUri(uriObject);
    }, [uriObject, setUri]);

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
                    *We will replace {"{id}"} with the ID of the badge to be fetched.
                </Text>
            </div>
        </Form.Item>
    </>
}