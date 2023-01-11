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
