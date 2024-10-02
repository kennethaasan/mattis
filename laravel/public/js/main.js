$(document).ready(function($) {

	//Add active class to navbar
	$('ul.nav > li > a[href="' + document.location.href + '"]').parent().addClass('active');

	var url = document.location.href.slice(0, document.location.href.length - 1);
	$('ul.nav > li > a[href="' + url + '"]').parent().addClass('active');

	//Hide alert message after 10 seconds
	$('div.flash-message').delay(20000).slideUp();


	//Clickable row
	$('#delete').click(function() {
	    if (!confirm('Vil du slette denne runden?')) {
			return false;
	    }
	});

	//Clickable row
	$('.delete-fett').click(function() {
	    if (!confirm('Vil du slette denne fettmattisen?')) {
			return false;
	    }
	});


});
