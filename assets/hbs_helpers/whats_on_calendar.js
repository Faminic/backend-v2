var _ = require('lodash');
var Promise = require('bluebird')

enduro.templating_engine.registerHelper('whatsOnCalendar', function(options) {
    return enduro.api.pagelist_generator.get_cms_list()
        .then((pagelist) => enduro.api.flat.load(pagelist.structured['whats-on'].fullpath))
        .then((page) => {
            function get_max_rows(rows) {
                return Object
                    .keys(rows)
                    .filter(x => !x.startsWith('$'))
                    .map(x => rows[x].length)
                    .reduce((a, b) => Math.max(a, b), 0);
            }

            function pad(rows, n) {
                return rows.concat(Array(n - rows.length).fill({}));
            }

            function transpose(M) {
                const m = [];
                for (let i = 0; i < M[0].length; i++) {
                    m.push([]);
                    for (let j = 0; j < M.length; j++) {
                        m[i].push(M[j][i]);
                    }
                }
                return m;
            }

            const max_rows_young = get_max_rows(page.children_and_young_people);
            const max_rows_adult = get_max_rows(page.adult_activities);
            const context = {
                young: {
                    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    rows: transpose([
                        pad(page.children_and_young_people.monday,    max_rows_young),
                        pad(page.children_and_young_people.tuesday,   max_rows_young),
                        pad(page.children_and_young_people.wednesday, max_rows_young),
                        pad(page.children_and_young_people.thursday,  max_rows_young),
                        pad(page.children_and_young_people.friday,    max_rows_young),
                        pad(page.children_and_young_people.saturday,  max_rows_young),
                        pad(page.children_and_young_people.sunday,    max_rows_young),
                    ]),
                },
                adult: {
                    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    rows: transpose([
                        pad(page.adult_activities.monday,    max_rows_adult),
                        pad(page.adult_activities.tuesday,   max_rows_adult),
                        pad(page.adult_activities.wednesday, max_rows_adult),
                        pad(page.adult_activities.thursday,  max_rows_adult),
                        pad(page.adult_activities.friday,    max_rows_adult),
                        pad(page.adult_activities.saturday,  max_rows_adult),
                        pad(page.adult_activities.sunday,    max_rows_adult),
                    ]),
                },
            };

            console.log(context.young.rows);
            return options.fn(context);
        });
})
