({
	table_title_1: 'FACILITY PRICES',
	table_1_header_1: 'FACILITY',
	table_1_header_2: 'HIRE COST PER HOUR',
	table_1_header_3: 'HIRE COST PER HALF DAY (UP TO 3 HOURS)',
	table_1_header_4: 'HIRE COST PER FULL DAY (UP TO 7 HOURS)',
	$table_1_row_templatitator: '@@global.priceTable1',
	table_1_row: [
		{
			facility: 'THEATRE',
			facility_link: '/facility/theatre/',
			price1: '£40',
			price2: '£100',
			price3: '£170'
		},
		{
			facility: 'DINING HALL',
			facility_link: '/facility/dining-hall/',
			price1: '£20',
			price2: '£50',
			price3: '£90'
		},
		{
			facility: 'PERFORMING ARTS ROOM',
			facility_link: '/facility/performing-arts',
			price1: '£15',
			price2: '£40',
			price3: '£70'
		},
		{
			facility: 'THE GREEN ROOM',
			facility_link: '/facility/green-room',
			price1: '£12',
			price2: '£30',
			price3: '£50'
		},
		{
			facility: 'LARGE CLASS ROOM',
			facility_link: '/facility/classrooms',
			price1: '£15',
			price2: '£40',
			price3: '£70'
		},
		{
			facility: 'SMALL CLASS ROOM',
			facility_link: '/facility/classrooms',
			price1: '£10',
			price2: '£25',
			price3: '£50'
		},
		{
			facility: 'ASTRO TURF',
			facility_link: '/facility/astro-turf',
			price1: '£30',
			price2: '£80',
			price3: '£120'
		},
		{
			facility: 'SPORTS HALL (FULL HALL)',
			facility_link: '/facility/sports-field',
			price1: '£40',
			price2: '£100',
			price3: '£170'
		},
		{
			facility: 'SPORTS HALL (HALF HALL)',
			facility_link: '/facility/sports-field',
			price1: '£25',
			price2: '£60',
			price3: '£110'
		},
		{
			facility: 'GYM',
			facility_link: '/facility/gymnasium',
			price1: '£25',
			price2: '£60',
			price3: '£110'
		},
		{
			facility: 'IT SUITE',
			facility_link: '/facility/it-suite',
			price1: '£20',
			price2: '£50',
			price3: '£90'
		},
		{
			facility: '11 V 11 FOOTBALL PITCH',
			facility_link: '/facility/sports-field',
			price1: '£20 per hr / match',
			price2: '',
			price3: ''
		},
		{
			facility: 'JUNIOR FOOTBALL PITCH',
			facility_link: '/facility/sports-field',
			price1: '£15 per hr / match',
			price2: '',
			price3: ''
		}
	],
	table_title_2: 'THEATRE BOOKING PRICES',
	table_2_header_1: 'REASON FOR BOOKING',
	table_2_header_2: 'HIRE COST',
	$table_2_row_templatitator: '@@global.priceTable2',
	table_2_row: [
		{
			reason: 'PERFORMANCE (UP TO 5 HOURS) NOT INCLUDING THE USE OF THE PERFORMING ARTS ROOM',
			price: '£280'
		},
		{
			reason: 'PERFORMANCE (UP TO 5 HOURS) INCLUDING THE USE OF THE PERFORMING ARTS ROOM',
			price: '£330'
		},
		{
			reason: 'REHEARSAL SESSION NOT INCLUDING THE USE OF THE PERFORMING ARTS ROOM',
			price: 'Price upon request'
		},
		{
			reason: 'REHEARSAL SESSION INCLUDING THE USE OF THE PERFORMING ARTS ROOM',
			price: 'Price upon request'
		},
		{
			reason: 'SET UP AND TAKE DOWN PER PERFORMANCE',
			price: 'Price upon request'
		}
	],
	table_title_3: 'ANNUAL MEMBERSHIP PRICES',
	table_3_header_1: 'MEMBERSHIP TYPE',
	table_3_header_2: 'COST',
	$table_3_row_templatitator: '@@global.priceTable3',
	table_3_row: [
		{
			membership_type: 'ADULT MEMBERSHIP',
			price: '£11'
		},
		{
			membership_type: 'JUNIOR / SENIOR CITIZEN / STUDENT / UNEMPLOYED',
			price: '£9'
		},
		{
			membership_type: 'THEATRE GROUPS AFFILIATION MEMBERSHIP',
			price: '£95'
		}
	],
	table_title_4: 'ADDITIONAL EQUIPMENT',
	table_4_header_1: 'ITEM',
	table_4_header_2: 'COST',
	$table_4_row_templatitator: '@@global.priceTable4',
	table_4_row: [
		{
			item: 'CINEMA SCREEN',
			price: 'Price upon request'
		},
		{
			item: 'CD PLAYER',
			price: '£5'
		},
		{
			item: 'LAPTOPS',
			price: 'Price upon request'
		},
		{
			item: 'FLIP CHART WITH PAPER AND PENS',
			price: '£10'
		},
		{
			item: 'PROJECTOR',
			price: '£10'
		},
		{
			item: 'TEA AND COFFEE',
			price: '£1 per person'
		}
	],
	table_title_5: 'INDOOR ACTIVITY FEES',
	table_5_header_1: 'ACTIVITY',
	table_5_header_2: 'AGE',
	table_5_header_3: 'PRICE',
	$table_5_row_templatitator: '@@global.priceTable5',
	table_5_row: [
		{
			activity: 'BADMINTON',
			person: 'Junior',
			price: '£2.00'
		},
		{
			activity: 'BADMINTON',
			person: 'Senior',
			price: '£3.00'
		},
		{
			activity: 'TABLE TENNIS',
			person: 'Junior',
			price: '£2.00'
		},
		{
			activity: 'TABLE TENNIS',
			person: 'Senior',
			price: '£3.00'
		}
	],
	last_sentence: '<p>To book any of the events, activities and facilities on this site please feel free to use the <a href="/book-now" target="_blank">booking form</a> provided or call us on <strong>0191 388 10 43</strong> during centre opening hours.</p>',
	$last_sentence_type: 'quill',
	$last_sentence_control_path: '/brick/enduro_quill/quill_control'
})