## BitBadges Frontend

Welcome to the BitBadges frontend! This is a Next.js project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and the [Blockin quickstart repo](https://github.com/blockin).
For the UI, this repo uses [Ant Design](https://ant.design/) and [Tailwind CSS](https://tailwindcss.com/).

Check this frontend out in production at [bitbadges.io](https://bitbadges.io).

This frontend communicates with the BitBadges blockchain via the BitBadges Indexer and BitBadgesJS / BitBadges SDK. You can find the indexer repo [here](https://github.com/bitbadges/bitbadges-indexer) and the BitBadgesJS / BitBadges SDK repo [here](https://github.com/bitbadges/bitbadgesjs). See the BitBadges documentation for more information and tutorials [here](https://blockin.github.io/bitbadges/).

## Getting Started

First, you will need to create a .env file with the BITBADGES_IO variable. Format can be found below or in the provided
.env.example. This variable is used to determine whether or not to use the production BitBadges Indexer. If you are running a version of the BitBadges Indexer locally, you will want to set this variable to false. If you are using the production BitBadges Indexer, you will want to set this variable to true.

```bash
# production .env file
BITBADGES_IO="true"
```

```bash
# development .env file
BITBADGES_IO="false"
BACKEND_PORT=":3001"
```

You will also need to set your BITBADGES_API_KEY in the .env file. You can get this key by contacting the BitBadges team.

````bash

Second, run the development server:

```bash
npm run dev
# or
yarn dev
````

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the pages by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

For a production build, run

```bash
npm run build
```

and

```bash
npm run start
```

## Learn More About Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
