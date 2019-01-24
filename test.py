import requests
r = requests.post('http://localhost:5000/api/booking', json={
    'start':        '2019-01-26T12:00',
    'end':          '2019-01-26T14:30',
    'phone_number': '123',
    'name':         'anikan',
    'venue':        'astro_turf',
})
print(r.url)
