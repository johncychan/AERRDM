// function openLeftNav() {
//     document.getElementById("leftSideNav").style.width = "250px";
// }

// function closeLeftNav() {
//     document.getElementById("leftSideNav").style.width = "0";
// }
// function openRightNav() {
//     document.getElementById("rightSideNav").style.width = "250px";
// }

// function closeRightNav() {
//     document.getElementById("rightSideNav").style.width = "0";
// }


$(document).ready(function(){
    $('#setting-menu').on('click', function(){
    	$('#rightSideNav').css('width', '250px');
    });

    $('#rightNavClose').on('click', function(){
    	$('#rightSideNav').css('width', '0px');
    });
});