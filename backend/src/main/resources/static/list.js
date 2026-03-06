$(document).ready(function () {
    $.getJSON("/dsp", function (solutions) {
        var listofsolutions = $("#listofsolutions");
        listofsolutions.empty();

        $.each(solutions, function (idx, value) {
            listofsolutions.append(
                $('<li><a href="solution.html?id=' + value + '">' + value + '</a></li>')
            );
        });
    });

    $("#solveBtn").click(function () {

        $.ajax({
            url: "/dsp",
            type: "POST",
            contentType: "application/json",
            data: {},
            success: function (response) {
                $("#result").text(JSON.stringify(response, null, 2));
                location.reload();
            },
            error: function (xhr) {
                $("#result").text("Error: " + xhr.responseText);
            }
        });
    });

});