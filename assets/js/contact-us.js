$(document).ready(function(){

  $("#contact-us-form").on("submit", function(e) {
    e.preventDefault();
    var name = $("#itemNameEdit").val();
    var email = $("#itemQuantityEdit").val();
    var phone = $("#itemStorageEdit").val();
    var query = $("#itemBuyEdit").val();
    var test = {name: name, email: email, telephone: phone, query: query};
    $.post("/api/contact-us", {name: name, email: email, telephone: phone, query: query}, function(data) {

    })
  })

}
