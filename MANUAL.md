# PVCC website - User Manual

# Website Features

## Booking

### Facilities
Most facilities are bookable online. This is further explained in the "Venues" section under "Administrator". When a user navigates to the PVCC booking form, they will have to enter their full name, phone number and email. Then they will need to select a facility, after which they can select a specific room and choose a duration, specifying how long the user wishes to use the facility. Choosing a duration will automatically generate and display to the user the cost to use their chosen facility for the chosen duration. 

<img>

The user then chooses a date, after which a list of available times based on their chosen duration, their chosen date and other users' bookings will be automatically generated for them. Finally, the user has to tick the checkbox to consent to PVCC storing their email address and phone number in case they need to contact the user.

<img>

After submitting, the user is taken to the paypal website where they follow the respective steps to confirm the payment. 
After the payment has been successfully confirmed, the user is redirected to PVCC's website with a message telling them their payment is confirmed and highlights some booking details.

<img>

The user also has the option to cancel their payment from the paypal site, after which they are redirected back to PVCC's website with a message telling them their payment was cancelled.

<img>
<img>

When the payment is successful, PVCC receives an email with the booking details, including name, phone number and the Paypal payment ID of the user.

<img>


### Activities
Activities (e.g. Fast Feet Football Academy) are not bookable online. To make an enquiry about an activity, a user can email PVCC via the Contact-Us page, which is linked in the booking form.

# Administrator

## Editing Basic Content
Basic (static) content such as text, images, titles and so on can be edited via the **main admin page**.

To log in, navigate to **[site name]/admin**, and enter the admin login details. You will see the different sites on the left-hand side. Pick the site where you want to make an edit. Content inside text boxes can just be changed and images can be changed by just dragging a new image on top of the image you want to replace. To save changes, you must press the **publish** button on the top right. To view your changes before saving them, you must press the **temp** button on the top right.

<img>

## Adding New Pages
You can add a new facility or activity webpage by navigating to **[site name]/admin** and logging in. Then, you may choose Facility or Activity on the left and see **Add page** as an option. Click on that option and you will be asked to name that webpage. This name will be important, because to visit this new webpage, you will have to navigate to **[site name]/name**. 

<img> <img>

You may then complete all text and image boxes and press **temp** to see what your webpage will look like and **publish** to apply the changes to the live site.

## Deleting Pages
You can delete existing facility or activity webpages by navigating to **[site name]/admin** and logging in. Then, you may choose Facility or Activity on the left and choose the webpage you want to delete. Press **Delete page** on the top right and the webpage will be deleted. You may still see the webpage on the admin page, but can just refresh the admin page and it will disappear.

<img>

## More Complex Editing
Adding, editing and deleting venues involves making changes to the site's database. As such, these tasks require the use
of the **booking-admin page**.

To log in, navigate to **[site name]/booking-admin**, and enter the admin login details.

#### Venues
'Venues' is the name given to facilities. A venue contains rooms and products.

The admin can choose whether to make a venue bookable online or not. For instance, if booking for the theatre should
only be done by emailing or calling PVCC, the 'theatre' venue would not need to be bookable online, and its 'bookable' property should be unchecked.

<img>

#### Rooms
'Rooms' are the sections into which a venue can be divided. They can be added and deleted by the administrator.

<img>

#### Products
Products are the things that users can book and pay for. They can contain multiple rooms, and make it possible for a user to book portions of a venue (e.g. two courts of the Sports Hall). A product also has hourly, half-day and day prices (shown in pounds).

Products can be added, deleted, and edited.

<img>

#### Reservations
Each product has an associated list of reservations. Reservations are bookings for a product which have been made online, and can be viewed, added and deleted.

<img>

When adding a reservation, it is possible that the time you select for it clashes with an existing reservation, or is outside normal opening hours. To ignore any clashes, and force the booking through anyway, check the 'Ignore clashes' checkbox.

<img>

# FAQ
**How do I issue a refund to a customer?**

Payments can be refunded on the Paypal website. To refund a payment, the payment ID is required. 

You can find this from the booking-admin page. Select the venue, view the list of reservations for the product booked, and look for the reservation you need to refund, which contains the payment ID. Once the refund has been made, delete the reservation.

<img>

**A new facility has been built, and I want to add it to the website. How do I do this?**
- Go to the 'booking-admin' page, log in, then add the venue, with the relevant rooms and products.
- Log in to the main admin page, select 'Facility' and then click 'Add page'.
- Add the page name, and below this a description of the new facility.
- Add a banner image, thumbnail and any extra images. You can do this via a simple 'drag and drop' method, or by copy-pasting them.
- Add opening times for the facility, then click 'Publish' to publish them to the website, or 'Temp' to preview.
- Add a link to the new facility on the 'whats-on' page if necessary.

The new facility will now have its own page on the website, and the site's users will be able to book and pay for it online.
