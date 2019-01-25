var _ = require('lodash');
var Promise = require('bluebird')

enduro.templating_engine.registerHelper('activities', function(options) {
    // will store all the blog entries
    var activities
    // get_cms_list will return a structured list of all pages in a project
    return enduro.api.pagelist_generator.get_cms_list()
        .then((pagelist) => {

            var get_content_promises = []
            activities = _.chain(pagelist.structured.activity)
                .filter((o) => { return typeof o === 'object' }).value() // filter pages only

            // goes through all the blog entries and loads their content
            for (page_id in activities) {
                var page = activities[page_id]

                function get_content (page) {
                    get_content_promises.push(enduro.api.flat.load(page.fullpath).then((content) => { page.activity = content }))
                }

                get_content(page)
            }

            return Promise.all(get_content_promises)
        })
        .then(() => {
            // pass blog entries as context for the template
            return options.fn(activities)
        })
})
