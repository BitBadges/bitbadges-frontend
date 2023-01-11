import { UriObject } from "bitbadgesjs-transactions/dist/messages/bitbadges/badges/typeUtils";


export function getUriFromUriObject(uriObject: UriObject) {
    let uri = "";
    if (uriObject.scheme) {
        if (Number(uriObject.scheme) === 1) {
            uri += "http://";
        } else if (Number(uriObject.scheme) === 2) {
            uri += "https://";
        } else if (Number(uriObject.scheme) === 3) {
            uri += "ipfs://";
        } else {
            throw new Error("ErrInvalidUriScheme");
        }
    }

    uri += uriObject.uri;
    return uri;
}

export function getSubassetUriFromUriObject(uriObject: UriObject) {
    let uri = '';
    try {
        uri = getUriFromUriObject(uriObject);
    } catch (err) {
        return "";
    }
    let subassetUri = uri;
    if (uriObject.idxRangeToRemove) {
        subassetUri = uri.slice(0, uriObject.idxRangeToRemove.start) + uri.slice(uriObject.idxRangeToRemove.end);
    }
    if (uriObject.insertSubassetBytesIdx && uriObject.bytesToInsert) {
        subassetUri = subassetUri.slice(0, uriObject.insertSubassetBytesIdx) + uriObject.bytesToInsert + subassetUri.slice(uriObject.insertSubassetBytesIdx);
    }
    if (uriObject.insertIdIdx) {
        subassetUri = subassetUri.slice(0, uriObject.insertIdIdx) + "{id}" + subassetUri.slice(uriObject.insertIdIdx);
    }

    return subassetUri;
}

export function getUriObjectFromCollectionAndBadgeUri(currUriObject: UriObject, subassetUri: string) {
    let collectionUri = getUriFromUriObject(currUriObject);
    let newUriObject: UriObject = {
        scheme: currUriObject.scheme,
        uri: currUriObject.uri,
    }

    newUriObject.insertIdIdx = subassetUri.indexOf("{id}");
    subassetUri = subassetUri.replace("{id}", "");

    for (let i = 0; i < subassetUri.length; i++) {
        if (i >= collectionUri.length) {
            newUriObject.insertSubassetBytesIdx = i;
            newUriObject.bytesToInsert = subassetUri.slice(i);
            break;
        }
        
        if (collectionUri[i] !== subassetUri[i]) {
            newUriObject.idxRangeToRemove = {
                start: i,
                end: collectionUri.length
            };
            newUriObject.insertSubassetBytesIdx = i;
            newUriObject.bytesToInsert = subassetUri.slice(i);
            break;
        }

        if (i === subassetUri.length - 1 && collectionUri.length > subassetUri.length) {
            newUriObject.idxRangeToRemove = {
                start: i + 1,
                end: collectionUri.length
            };
        }
    }

    console.log("Current URI object", newUriObject);

    return newUriObject;
}

export function getUriObjectFromCollectionUri(collectionUri: string) {
    let uriObject: UriObject = {
        scheme: 0,
        uri: "",
        idxRangeToRemove: undefined,
        insertSubassetBytesIdx: undefined,
        bytesToInsert: undefined,
        insertIdIdx: undefined
    };

    if (collectionUri.startsWith("http://")) {
        uriObject.scheme = 1;
        collectionUri = collectionUri.replace("http://", "");
    } else if (collectionUri.startsWith("https://")) {
        uriObject.scheme = 2;
        collectionUri = collectionUri.replace("https://", "");
    } else if (collectionUri.startsWith("ipfs://")) {
        uriObject.scheme = 3;
        collectionUri = collectionUri.replace("ipfs://", "");
    }

    uriObject.uri = collectionUri;
    return uriObject;
}