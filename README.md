# backend-v2

PVCC website with a shitty CMS.

## Run

Install MongoDB ([Ubuntu](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/), [Windows](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)).
Ensure that your MongoDB instance is running.

Keys need to be placed in the `app/keys/` folder.

```sh
$ npm install -g enduro
$ enduro start
$ # visit localhost:5000 in your browser
```

If you're developing the web-pages (and don't need to touch the backend,
i.e. not doing booking forms) then the following is way more convenient:

```sh
$ enduro dev
```

Note that we have to use `enduro start` if you want to work on something
that needs to speak to the backend, because otherwise some endpoints will
not be available from `localhost:3000` since the `/api/...` endpoints are
only registered on `localhost:5000`.
