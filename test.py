import requests
r = requests.post('http://localhost:5000/api/booking', json={
    'start':        '2019-01-27T10:00',
    'end':          '2019-01-27T12:30',
    'phone_number': '123',
    'name':         'anikan',
    'venue':        'astro_turf',
})
print(r.url)
