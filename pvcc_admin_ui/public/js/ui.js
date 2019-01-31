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


function render_room(venue, room) {
    var $room = $(Mustache.render($('#ms-room').html(), room));

    $room.find('input[name=name]').change(function() {
        room.name = $room.find('input[name=name]').val();
        // Make sure to update products' rooms
        $('.product-room[data-id="' + room.id + '"] span').text(room.name);
        update_product_dropdowns(venue);
    });

    $room.find('.delete-room').click(function() {
        venue.rooms.splice(venue.rooms.indexOf(room.id), 1);
        // Make sure to delete products' rooms
        venue.products.forEach(function(product) {
            var i = product.rooms.indexOf(room.id);
            if (i >= 0)
                product.rooms.splice(i, 1);
        });
        $('.product-room[data-id="' + room.id + '"]').remove();
        update_product_dropdowns(venue);
        $room.remove();
    });
    return $room;
}


function add_room(venue) {
    var room = { id: uuidv4(), name: '' };
    venue.rooms.push(room);
    $('#rooms').append(render_room(venue, room));
}


function bindChange($el, obj, attr, is_int) {
    $el.change(function() {
        var val = $el.val();
        if (is_int && val.length !== 0) {
            val = parseInt(val);
            if (isNaN(val)) {
                return;
            }
        }
        obj[attr] = val;
    });
}


function update_product_dropdowns(venue) {
    venue.products.forEach(function(product) {
        var $select = $('.product[data-id="' + product.id + '"] select.room-options');
        $select.html('');
        $select.val('');
        venue.rooms.forEach(function(room) {
            // add if we cannot find the room in the product
            // and if the room name is not blank
            if (!room.name) return;
            if (product.rooms.indexOf(room.id) === -1) {
                $select.append($('<option value="' + room.id + '">' + room.name + '</option>'));
            }
        });
    });
}


function render_product(venue, product) {
    var $product = $(Mustache.render($('#ms-product').html(), product));
    var $rooms = $product.find('.rooms');

    bindChange($product.find('input[name=name]'), product, 'name');
    bindChange($product.find('input[name=price_per_hour]'), product, 'price_per_hour', true);
    bindChange($product.find('input[name=price_half_day]'), product, 'price_half_day', true);
    bindChange($product.find('input[name=price_full_day]'), product, 'price_full_day', true);

    $product.find('.delete-product').click(function() {
        venue.products.splice(venue.products.indexOf(product), 1);
        $product.remove();
    });

    $product.find('.add-product-room').click(function() {
        var val = $product.find('.room-options').val();
        if (val) {
            product.rooms.push(val);
            render_rooms();
        }
    });

    function render_rooms() {
        $rooms.html('');
        product.rooms.forEach(function(room_id) {
            var room = venue.rooms.find(function(x) { return x.id === room_id });
            if (!room) return;
            var $room = $(Mustache.render($('#ms-product-room').html(), room));
            $room.find('.delete-product-room').click(function() {
                product.rooms.splice(product.rooms.indexOf(room_id), 1);
                $room.remove();
            });
            $rooms.append($room);
        });
    }

    render_rooms();
    return $product;
}


function add_product(venue) {
    var product = { id: uuidv4(), name: '', rooms: [], price_per_hour: 0, price_half_day: 0, price_full_day: 0 };
    venue.products.push(product);
    $('#products').append(render_product(venue, product));
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
        $('#content').html(Mustache.render(
            $('#ms-venue-form').html(),
            venue
        ));
        venue.rooms.forEach(function(room) { $('#rooms').append(render_room(venue, room)); });
        venue.products.forEach(function(product) { $('#products').append(render_product(venue, product)); });

        DAYS.forEach(function(day) {
            OPEN_CLOSE.forEach(function(type) {
                bindChange($('input[name="' + day + '.' + type + '"]'), venue.opening_hours[day], type);
            });
        });

        update_product_dropdowns(venue);
        $('#add-room').click(function() { add_room(venue); });
        $('#add-product').click(function() { add_product(venue); });
        $('#save').click(function() {
            venue.rooms    = venue.rooms.filter(function(r) { return r.name.length > 0; });
            venue.products = venue.products.filter(function(v) { return v.rooms.length > 0; });
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
