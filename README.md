# backend-v2

PVCC website with a ~shitty~ satisfactory CMS.

## Run

Install MongoDB ([Ubuntu](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/), [Windows](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)).
Ensure that your MongoDB instance is running. The first time you run the
app, you need to populate your DB with the venues and products:

```sh
$ node create_db.js
```

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

## Testing

All tests take place in a testing db, that does not affect the 'production'
dataset.

```sh
$ npm test
```

If you want to only run tests for a specific file, e.g. you want to only
run tests for the API:

```sh
$ npm test --file test/test_api.js
```

### How to make bookings

First make a request to get the booking informations

```
GET /api/booking/
[
    ...
    {
        "_id":  "5c4cf8c00333176c83077b10",
        "name": "Sports Hall",
        "opening_hours": {...},
        "products": [
            {
                "id": "d92b00d7-284e-4aa1-9889-c2249ff18f0d",
                "name": "Full",
                "price_per_hour": 40,
                "price_half_day": 100,
                "price_full_day": 170,
                "rooms": [...]
            },
            ...
        ]
    }
]
```

Then make a POST request to actually book, and follow the redirect link.
Say you want to book the "Full" product of the Sports Hall:

```
POST /api/booking/5c4cf8c00333176c83077b10/d92b00d7-284e-4aa1-9889-c2249ff18f0d
{
    "start": "2019-01-26T19:30",
    "end": "2019-01-26T20:00",
    "phone_number": "2132341124",
    "name": "anikan",
}
```

Similarly you can make a request to see which slots are taken:

```
GET /api/booking/taken/5c4cf8c00333176c83077b10/d92b00d7-284e-4aa1-9889-c2249ff18f0d
[
    ['2019-01-27T10:00:00.000Z', '2019-01-27T12:00:00.000Z'],
    ['2019-01-28T18:00:00.000Z', '2019-01-28T19:00:00.000Z'],
    ...
]
```
