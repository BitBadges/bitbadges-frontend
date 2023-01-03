import { NextApiRequest, NextApiResponse } from "next";
import { ipfsClient } from "./ipfs";

export const getFromIpfs = async (req: NextApiRequest, res: NextApiResponse) => {
    const getRes = ipfsClient.cat(req.body.cid + '/' + req.body.path);

    const decoder = new TextDecoder();
    let fileJson = '';
    for await (const file of getRes) {
        let chunk = decoder.decode(file);
        fileJson += chunk;
    }

    return res.status(200).send({ file: fileJson });
}

export default getFromIpfs;
