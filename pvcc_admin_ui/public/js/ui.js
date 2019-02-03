window.setup = false;

DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
OPEN_CLOSE = ['open', 'close'];

$.ajaxSetup({
    contentType: "application/json; charset=utf-8",
    dataType: "json",
});


function reload_venues() {
    $.ajax('/venues', {
        method: 'GET',
        success: function(venues) {
            $('#sidebar').html(Mustache.render(
                $('#ms-sidebar').html(),
                {venues: venues}
            ));
        },
    });
}


$(document).hashroute('middleware', function() {
    // inject sidebar if not done already
    if (!window.setup) {
        reload_venues();
        window.setup = true;
    }
    this.next();
});


$(document).hashroute('/', function() {
    $('#content').html($('#ms-welcome').html());
});


function bindChange($input, obj, attr, is_price) {
    $input.change(function() {
        var val = $input.val();
        if (val.length > 0 || is_price) {
            if (is_price) {
                if (val.length > 0) {
                    val = parseInt(val);
                    if (isNaN(val)) return;
                } else {
                    val = undefined;
                }
            }
            obj[attr] = val;
        }
    });
}


function render_room(room, obsProducts, obsRooms) {
    var $room = $(Mustache.render($("#ms-room").html(), room));

    // update rooms if necessary
    $room.find('input[name=name]').change(function() {
        room.name = $room.find('input[name=name]').val();
        obsRooms(obsRooms());
    });

    $room.find('.delete-room').click(function() {
        var rooms = obsRooms();
        rooms.splice(rooms.indexOf(room), 1);
        obsRooms(rooms);
    });

    return $room;
}


function render_product(product, obsProducts, obsRooms) {
    var $product = $(Mustache.render($("#ms-product").html(), product));
    var $select  = $product.find('select.room-options');
    var $rooms   = $product.find('.rooms');

    var obsProductRooms = trkl([]);
    obsProductRooms.subscribe(function(room_ids) {
        var rooms = obsRooms();
        product.rooms = room_ids;

        // Re-render the rooms
        $rooms.html('');
        room_ids.forEach(function(room_id) {
            var $room = $(Mustache.render(
                $('#ms-product-room').html(),
                rooms.find(function(r) { return r.id === room_id })
            ));
            $room.find('.delete-product-room').click(function() {
                product.rooms.splice(product.rooms.indexOf(room_id), 1);
                obsProductRooms(product.rooms);
                $room.remove();
            });
            $rooms.append($room);
        });

        // Re-render dropdown
        $select.val('');
        $select.html('');
        rooms.forEach(function(room) {
            if (product.rooms.indexOf(room.id) === -1) {
                $select.append($("<option value="+room.id+"/>").text(room.name));
            }
        });
    });

    // bind inputs
    bindChange($product.find('input[name=name]'), product, 'name');
    bindChange($product.find('input[name=price_per_hour]'), product, 'price_per_hour', true);
    bindChange($product.find('input[name=price_half_day]'), product, 'price_half_day', true);
    bindChange($product.find('input[name=price_full_day]'), product, 'price_full_day', true);

    // Update the list of rooms associated with the
    // product, and the dropdown select when necessary
    obsRooms.subscribe(function(rooms) {
        // remove deleted rooms
        obsProductRooms(product.rooms.filter(function(room_id) {
            return rooms.find(function(room) {
                return room.id === room_id;
            });
        }));
    });

    $product.find('.add-product-room').click(function() {
        var val = $select.val();
        if (val) {
            product.rooms.push(val);
            obsProductRooms(product.rooms);
        }
    });

    $product.find('.delete-product').click(function() {
        var products = obsProducts();
        products.splice(products.indexOf(product), 1);
        obsProducts(products);
    });

    obsProductRooms(product.rooms);
    return $product;
}


function setup_venue(venue) {
    var obsRooms = trkl([]);
    var obsProducts = trkl([]);

    var $rooms = $('#rooms');
    var $products = $('#products');


    obsRooms.subscribe(function(rooms) {
        venue.rooms = rooms;
        $rooms.html('');
        rooms.forEach(function(room) {
            $rooms.append(render_room(room, obsProducts, obsRooms));
        });
    });

    obsProducts.subscribe(function(products) {
        venue.products = products;
        $products.html('');
        products.forEach(function(product) {
            $products.append(render_product(product, obsProducts, obsRooms));
        });
    });

    $('#add-room').click(function() {
        obsRooms(venue.rooms.concat([{ id: uuidv4(), name: "" }]));
    });

    $('#add-product').click(function() {
        obsProducts(venue.products.concat([{ id: uuidv4(), name: "", rooms: [], price_per_hour: 0, price_half_day: 0, price_full_day: 0 }]));
    });

    DAYS.forEach(function(day) {
        OPEN_CLOSE.forEach(function(type) {
            bindChange($('input[name="' + day + '.' + type + '"]'), venue.opening_hours[day], type);
        });
    });

    // kickstart
    obsRooms(venue.rooms);
    obsProducts(venue.products);
}


$(document).hashroute('/venue/:id', function(e) {
    var venue_id = e.params.id;
    $('#sidebar li').removeClass('selected');
    $.ajax('/venue/' + venue_id, {
        success: function(venue) {
            render_venue(venue);
        },
    });

    function render_venue(venue) {
        // clean up venue data
        delete venue._id;
        delete venue.__v;
        venue.rooms.forEach(function(room) { delete room._id; });
        venue.products.forEach(function(product) { delete product._id; });

        $('#sidebar li[data-id="' + venue_id + '"]').addClass('selected');
        $('#content').html(Mustache.render($('#ms-venue-form').html(), venue));
        setup_venue(venue);
        window.venue = venue;

        $('#save').click(function() {
            $.ajax('/venue/' + venue_id, {
                method: 'POST',
                data:   JSON.stringify(venue),
                success: function() {
                    window.alert("Successfully saved changes!");
                    render_venue(venue);
                },
                error: function() {
                    window.alert("Cannot save changes.");
                }
            });
        });
    }
});
