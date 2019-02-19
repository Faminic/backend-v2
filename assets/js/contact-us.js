$("#contact-us-form").on("submit", function(e) {
  e.preventDefault();
  var name = $("#name").val();
  var email = $("#email").val();
  var phone = $("#phone").val();
  var query = $("#query").val();
  var test = {name: name, email: email, telephone: phone, query: query};
  $.post("/api/contact-us", {name: name, email: email, telephone: phone, query: query}, function(data) {

  })
  $("#submission-alert").delay(100).fadeIn(100);
  $("#sendbutton").fadeOut();
})
