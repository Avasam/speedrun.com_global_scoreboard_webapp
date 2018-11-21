var scoreboard;
var ajaxResponseMessage;
var loginResponseMessage;
var timeFormat = "YYYY-MM-DD HH:mm";
var userZone = moment.tz.guess();
function serverToUserTime(serverTime){
    // Create a moment using server's timezone
    var serverTimeMoment = moment.tz(serverTime, timeFormat, "Europe/London");
    // Set the time to user local time
    return serverTimeMoment.tz(userZone).format(timeFormat);
}

$(function() {
    var currentTimeOnLoad = moment();
    ajaxResponseMessage = $('#ajaxResponseMessage');
    loginResponseMessage = $('#loginResponseMessage');
    scoreboard = $('#scoreboard');
    scoreboard.DataTable( {
        ajax: '?action=ajaxDataTable',
        columns: [
            { data: 'rank' },
            { data: 'name' },
            { data: 'score' },
            { data: 'last_update' },
            { data: 'user_id' },
        ],
        fnCreatedRow: function( nRow, aData, iDataIndex ) {
            // Adapt the times to user's timezone
            $('td:eq(3)', nRow).html( serverToUserTime(aData[3]) );
            // Fill the preview's missing data using the scoreboard
            var userID = $('td:eq(4)', nRow).html()
            $('td:eq(0)', `#preview-${userID}`).html($('td:eq(0)', nRow).html())
            $('td:eq(1)', `#preview-${userID}`).html($('td:eq(1)', nRow).html())
            $('td:eq(2)', `#preview-${userID}`).html($('td:eq(2)', nRow).html())
        },
        fnRowCallback: function( nRow, aData, iDisplayIndex ) {
            // Set the color of the cell according to the last time user was updated
            var cell = $('td:eq(3)', nRow);
            var daysSince = currentTimeOnLoad.diff(aData[3], 'days');
            if (daysSince < 1) {
                cell.attr("class","daysSince1");
            } else if (daysSince < 7) {
                cell.attr("class","daysSince7");
            } else if (daysSince < 30) {
                cell.attr("class","daysSince30");
            } else {
                cell.attr("class","daysSince");
            }

        }
    });
    $("#scoreboard_filter").parent().attr("class","col-xs-6");
    $("#scoreboard_length").parent().attr("class","col-xs-6");
    $("#scoreboard_info").parent().attr("class","col-xs-12");
    $("#scoreboard_paginate").parent().attr("class","col-xs-12");
    scoreboard.css( 'display', '' );

    sortTable("preview");
    ajaxResponseMessage.css('visibility','hidden');

    // Login
    $("#login-form").submit(function( event ) {
        $("#login-button").prop('disabled', true);
        $("#api-key").prop('readonly', true);
        $.post('/', $(this).serialize(), function() {}, "json")
        .done(function(data) {
            if (data.state == "success"){ location.reload(); }
            loginResponseMessage.attr('class', `alert alert-${data.state}`);
            loginResponseMessage.html(htmlReplace(data.message));
            loginResponseMessage.css('visibility','visible');
        })
        .fail(function(data){
            alert( `There was an unknown error with the AJAX request. Status code: ${data.status}` );
        })
        .always(function (data) {
            console.log(data);
            $("#login-button").prop('disabled', false);
            $("#api-key").prop('readonly', false);
        })
        event.preventDefault();
    });

    // Updating a user
    $("#update-user-form").submit(function( event ) {
        var name_or_id = $('#name-or-id').val();
        try {
            var row = scoreboard.DataTable().row(`[name='${name_or_id}'], [id='${name_or_id}']`);
        }
        catch (_) {
            ajaxResponseMessage.attr('class', 'alert alert-danger');
            ajaxResponseMessage.html(`"${name_or_id}" isn't a valid username or ID.`);
            ajaxResponseMessage.css('visibility','visible');
            event.preventDefault();
            return;
        }
        var unfriendbefriend = $(row.node()).hasClass("highlight-friend") ? "unfriend" : "befriend";
        var userData = row.data();
        if (userData) {
            var daysSince = currentTimeOnLoad.diff(userData[3], 'days');
        }
        if (!window.bypass_update_restrictions && userData && daysSince < 1 ) {
            ajaxResponseMessage.attr('class', 'alert alert-warning');
            ajaxResponseMessage.html(`Runner ${userData[1]} has already been updated in the last 24h.`);
            ajaxResponseMessage.css('visibility','visible');
        } else {
            ajaxResponseMessage.attr('class', 'alert alert-info');
            ajaxResponseMessage.html(`Updating "${name_or_id}". This may take some time depending on the ammount of runs to analyse. Please Wait...`);
            ajaxResponseMessage.css('visibility','visible');
            $("#update-runner-button").prop('disabled', true);
            $("#name-or-id").prop('readonly', true);

            $.post('/', $(this).serialize(), function() {}, "json")
            .done(function(data) {
                if (data.state == "success"){
                    var tableData = scoreboard.DataTable().row(`#${data.user_id}`).data();
                    console.log(tableData);
                    if (tableData) {
                        // Update the row
                        tableData[0] = data.rank;
                        tableData[1] = `<a href="https://www.speedrun.com/user/${data.name}" target="_blank">${data.name}</a>
                                        <span
                                            class="pull-right friend-icon"
                                            onClick="javascript:${unfriendbefriend}('${data.user_id}');"
                                        ></span>`;
                        tableData[2] = data.score;
                        tableData[3] = serverToUserTime(data.last_updated);
                        // Redraw the entire table (TODO: will be required to recalculate the rank)
                        scoreboard.DataTable().row(`#${data.user_id}`).data(tableData).draw(); //TODO: might be able to do better here

                        // Update the preview table
                        previewRow = $(`#preview-${tableData[4]}`);
                        $('td:eq(0)', previewRow).html(tableData[0])
                        $('td:eq(1)', previewRow).html(tableData[1])
                        $('td:eq(2)', previewRow).html(tableData[2])
                        sortTable("preview");
                    } else {
                        // Add a new row
                        scoreboard.DataTable().row.add( [
                            data.rank,
                            `<a href="https://www.speedrun.com/user/${data.name}" target="_blank">${data.name}</a>
                            <span
                                class="pull-right friend-icon"
                                onClick="javascript:befriend('${data.user_id}');"
                            ></span>`,
                            data.score,
                            data.last_updated,
                            data.user_id
                        // Redraw the table
                        ] ).draw();
                    }
                }
                ajaxResponseMessage.attr('class', `alert alert-${data.state}`);
                ajaxResponseMessage.html(htmlReplace(data.message));
                ajaxResponseMessage.css('visibility','visible');
            })
            .fail(function(data){
                alert( `There was an unknown error with the AJAX request. Status code: ${data.status}` );
            })
            .always(function (data) {
                console.log(data);
                $("#update-runner-button").prop('disabled', false);
                $("#name-or-id").prop('readonly', false);
            })

        }
        event.preventDefault();
    });
    // This is to prevent the form being submitted before we take control of it's submit function
    $( 'form.ajax button' ).attr('type', 'submit');

    /*// Autoupdater
    // Get all rows
    var rows = scoreboard.DataTable().rows().data();
    var i = 0;
    //autoUpdater();
    function autoUpdater(){
        while (currentTimeOnLoad.diff(rows[i][3], 'days') < 30) {
            i++
        }
        $.post('/', {'action':'update-user', 'name-or-id':rows[i][4]}, function() {}, "json")
        .done(function(data) {
            //var row = scoreboard.DataTable().row('#'+data.user_id);
            var tableData = scoreboard.DataTable().row('#'+data.user_id).data()
            if (data.state == "success"){
                // Update the row
                tableData[0] = data.rank;
                tableData[1] = '<a href="https://www.speedrun.com/user/"'+data.name+' target="_blank">'+data.name+'</a>';
                tableData[2] = data.score;
                tableData[3] = serverToUserTime(data.last_updated);
                // Redraw the table
                scoreboard.DataTable().draw(); //TODO: might be able to do better here using invalidate --> row.invalidate().draw()
            }

            ajaxResponseMessage.attr('class', `alert alert-${data.state}`);
            ajaxResponseMessage.html(htmlReplace(data.message));
            ajaxResponseMessage.css('visibility','visible');
            i++;
            autoUpdater();
        })
        .fail(function(data){
            alert( `There was an unknown error with the AJAX request. Status code: ${data.status}` );
        })
        .always(function (data) {
            console.log(data);
        })

    }*/

});

function jumpToPlayer(user_id) {
    scoreboard.DataTable().search('').draw();
    scoreboard.DataTable().page.jumpToData( user_id, 4 );
}

// Add a friend
function befriend(friendID) {
    $.post('/', {'action':'befriend', 'friend-id':friendID}, function() {}, 'json')
    .done(function(data) {
        if (data.state == "success") {
            // Add on the scoreboard
            var row = scoreboard.DataTable().row(`#${friendID}`)
            var rowData = row.data();
            var rowNode = row.node();
            $( rowNode ).addClass("highlight-friend");
            $( rowNode ).find("span.friend-icon").attr('onClick', `javascript:unfriend('${friendID}');`);

            // Add on the preview
            var friendRank = rowData[0];
            var nameLink = rowData[1];
            var friendScore = rowData[2];
            $('tbody', $("#preview")).append(
                `<tr class="highlight-friend" id="preview-${friendID}">
                    <td>${friendRank}</td>
                    <td>${nameLink.replace("befriend","unfriend")}</td>
                    <td>${friendScore}</td>
                    <td><a href="javascript:jumpToPlayer('${friendID}');"><span class="pull-right glyphicon glyphicon-circle-arrow-right"></span></a></td>
                </tr>`
            );
            sortTable("preview");
        }
        ajaxResponseMessage.attr('class', `alert alert-${data.state}`);
        ajaxResponseMessage.html(htmlReplace(data.message));
        ajaxResponseMessage.css('visibility','visible');
    })
    .fail(function(data) {
        alert( `There was an unknown error with the AJAX request. Status code: ${data.status}` );
    })
    .always(function(data) {
        console.log(data);
    })
}

// Remove a friend
function unfriend(friendID) {
    // Remove a friend
    $.post('/', {'action':'unfriend', 'friend-id':friendID}, function() {}, 'json')
    .done(function(data) {
        if (data.state == "success") {
            // Remove from the scoreboard
            var rowNode = scoreboard.DataTable().row(`#${friendID}`).node();
            $( rowNode ).removeClass("highlight-friend");
            $( rowNode ).find("span.friend-icon").attr('onClick', `javascript:befriend('${friendID}');`);

            // Remove from the preview table
            $(`#preview-${friendID}`).remove();
            sortTable("preview");
        }
        ajaxResponseMessage.attr('class', `alert alert-${data.state}`);
        ajaxResponseMessage.html(htmlReplace(data.message));
        ajaxResponseMessage.css('visibility','visible');
    })
    .fail(function(data) {
        alert( `There was an unknown error with the AJAX request. Status code: ${data.status}` );
    })
    .always(function(data) {
        console.log(data);
    })
}

// https://stackoverflow.com/a/7558600
// Sort a table by first column
function sortTable(tableID){
    var tbl = document.getElementById(tableID).tBodies[0];
    var store = [];
    for(var i=0, len=tbl.rows.length; i<len; i++){
        var row = tbl.rows[i];
        var sortnr = parseFloat(row.cells[0].textContent || row.cells[0].innerText);
        if(!isNaN(sortnr)) store.push([sortnr, row]);
    }
    store.sort(function(x,y){
        return x[0] - y[0];
    });
    for(var i=0, len=store.length; i<len; i++){
        tbl.appendChild(store[i][1]);
    }
    store = null;
}

function isString (value) {
    return typeof value === 'string' || value instanceof String;
};

function htmlReplace(message){
    if (!isString(message)) return "";
    return message
        .replace(/</g, "&lt")
        .replace(/>/g, "&gt")
        .replace(/\n/g, "<br />");
}