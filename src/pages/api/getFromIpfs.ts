import { NextApiRequest, NextApiResponse } from "next";
import { create } from 'ipfs-http-client'

const auth =
    'Basic ' + Buffer.from(process.env.INFURA_ID + ':' + process.env.INFURA_SECRET_KEY).toString('base64');

const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});


export const getFromIpfs = async (req: NextApiRequest, res: NextApiResponse) => {
    console.log("TESTING");
    console.log(req.body.cid);
    console.log(req.body.path);

    const getRes = client.cat(req.body.path)
    console.log(getRes)

    const decoder = new TextDecoder();
    let fileJson = '';
    for await (const file of getRes) {
        console.log(file);
        // console.log("CHUNK", decoder.decode(file));
        let chunk = decoder.decode(file);
        fileJson += chunk;

        console.log("CHUNK", chunk);
    }

    return res.status(200).send({ file: fileJson });
}

export default getFromIpfs;
