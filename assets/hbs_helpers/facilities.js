var _ = require('lodash');
var Promise = require('bluebird')

enduro.templating_engine.registerHelper('facilities', function(options) {
    // will store all the blog entries
    var facilities
    // get_cms_list will return a structured list of all pages in a project
    return enduro.api.pagelist_generator.get_cms_list()
        .then((pagelist) => {

            var get_content_promises = []
            facilities = _.chain(pagelist.structured.facility)
                .filter((o) => { return typeof o === 'object' }).value() // filter pages only
			
            // goes through all the blog entries and loads their content
            for (page_id in facilities) {
                var page = facilities[page_id]

                function get_content (page) {
		
                    get_content_promises.push(enduro.api.flat.load(page.fullpath).then((content) => { 
						page.facility= content
						if(page.facility.Facility_Images[0]){
							page.facility.primaryimage=page.facility.Facility_Images[0]
						}
					}))
                }

                get_content(page)
            }

            return Promise.all(get_content_promises)
        })
        .then(() => {
            // pass blog entries as context for the template
			console.log(facilities);
            return options.fn(facilities)
        })
})
