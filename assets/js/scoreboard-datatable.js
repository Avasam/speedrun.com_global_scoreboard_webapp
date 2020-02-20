var scoreboard;
var ajaxResponseMessage;
var loginResponseMessage;
var timeFormat = "YYYY-MM-DD HH:mm";
var userZone = moment.tz.guess();

function serverToUserTime(serverTime) {
  // Create a moment using server's timezone
  var serverTimeMoment = moment.tz(serverTime, timeFormat, window.server_timezone);
  // Set the time to user local time
  return serverTimeMoment.tz(userZone).format(timeFormat);
}

$(function () {
  var currentTimeOnLoad = moment();
  ajaxResponseMessage = $('#ajaxResponseMessage');
  loginResponseMessage = $('#loginResponseMessage');
  scoreboard = $('#scoreboard');
  scoreboard.DataTable({
    ajax: '?action=ajaxDataTable',
    columns: [
      { data: 'rank' },
      { data: 'name' },
      { data: 'score' },
      { data: 'last_update' },
      { data: 'user_id' },
    ],
    fnCreatedRow: function (nRow, aData, iDataIndex) {
      // Adapt the times to user's timezone
      $('td:eq(3)', nRow).html(serverToUserTime(aData['last_update']));
      // ID and name for quick find and update
      $(nRow).attr("id", aData['user_id']);
      $(nRow).attr("name", aData['name']);
      // User link and friend button
      var friendFunction = "befriend";
      if (window.friends && window.friends[aData['user_id']]) {
        $(nRow).attr("class", "highlight-friend");
        friendFunction = "unfriend";
      }
      $('td:eq(1)', nRow).html(
        `<a href="https://www.speedrun.com/user/${aData['name']}" target="_blank">${aData['name']}</a>
                <span class="pull-right friend-icon" onClick="javascript:${friendFunction}('${aData['user_id']}');"></span>`
      );

      // Fill the friends preview's missing data using the scoreboard
      $('td:eq(0)', `#preview-${aData['user_id']}`).html(aData['rank']);
      $('td:eq(1)', `#preview-${aData['user_id']}`).html(
        `<a href="https://www.speedrun.com/user/${aData['name']}" target="_blank">${aData['name']}</a>
                <span class="pull-right friend-icon" onClick="javascript:unfriend('${aData['user_id']}');"></span>`
      );
      $('td:eq(2)', `#preview-${aData['user_id']}`).html(aData['score']);
    },
    fnRowCallback: function (nRow, aData, iDisplayIndex) {
      // Set the color of the cell according to the last time user was updated
      var cell = $('td:eq(3)', nRow);
      var daysSince = currentTimeOnLoad.diff(aData['last_update'], 'days');
      if (daysSince < 1) {
        cell.attr("class", "daysSince1");
      } else if (daysSince < 7) {
        cell.attr("class", "daysSince7");
      } else if (daysSince < 30) {
        cell.attr("class", "daysSince30");
      } else {
        cell.attr("class", "daysSince");
      }
    },
    fnInitComplete: function (oSettings, json) {
      sortTable("preview");
    }
  });
  $("#scoreboard_filter").parent().attr("class", "col-xs-6");
  $("#scoreboard_length").parent().attr("class", "col-xs-6");
  $("#scoreboard_info").parent().attr("class", "col-xs-12");
  $("#scoreboard_paginate").parent().attr("class", "col-xs-12");
  scoreboard.css('display', '');

  ajaxResponseMessage.css('visibility', 'hidden');

  // Login
  $("#login-form").submit(function (event) {
    $("#login-button").prop('disabled', true);
    $("#api-key").prop('readonly', true);
    $.post('/', $(this).serialize(), function () { }, "json")
      .done(function (data) {
        if (data.state == "success") { location.reload(); }
        loginResponseMessage.attr('class', `alert alert-${data.state}`);
        loginResponseMessage.html(htmlReplace(data.message));
        loginResponseMessage.css('visibility', 'visible');
      })
      .fail(function (data) {
        alert(`There was an unknown error with the AJAX request. Status code: ${data.status}`);
      })
      .always(function (data) {
        console.log(data);
        $("#login-button").prop('disabled', false);
        $("#api-key").prop('readonly', false);
      })
    event.preventDefault();
  });

  // Updating a user
  $("#update-user-form").submit(function (event) {
    var name_or_id = $('#name-or-id').val();
    try {
      var row = scoreboard.DataTable().row(`[name='${name_or_id}'], [id='${name_or_id}']`);
    }
    catch (_) {
      ajaxResponseMessage.attr('class', 'alert alert-danger');
      ajaxResponseMessage.html(`"${name_or_id}" isn't a valid username or ID.`);
      ajaxResponseMessage.css('visibility', 'visible');
      event.preventDefault();
      return;
    }
    var unfriendBefriend = $(row.node()).hasClass("highlight-friend") ? "unfriend" : "befriend";
    var userData = row.data();
    if (userData) {
      var daysSince = currentTimeOnLoad.diff(userData["last_update"], 'days');
    }
    if (!window.bypass_update_restrictions && userData && daysSince < 1) {
      ajaxResponseMessage.attr('class', 'alert alert-warning');
      ajaxResponseMessage.html(`Runner ${userData["name"]} has already been updated in the last 24h.`);
      ajaxResponseMessage.css('visibility', 'visible');
    } else {
      ajaxResponseMessage.attr('class', 'alert alert-info');
      ajaxResponseMessage.html(`Updating "${name_or_id}". This may take some time depending on the amount of runs to analyse. Please Wait...`);
      ajaxResponseMessage.css('visibility', 'visible');
      $("#update-runner-button").prop('disabled', true);
      $("#name-or-id").prop('readonly', true);

      $.post('/', $(this).serialize(), function () { }, "json")
        .done(function (data) {
          if (data.state == "success") {
            var rowData = scoreboard.DataTable().row(`#${data.user_id}`).data();
            console.log(rowData);
            if (rowData) {
              // Update the row
              rowData['rank'] = data.rank;
              rowData['name'] = data.name;
              rowData['score'] = data.score;
              rowData['last_update'] = serverToUserTime(data.last_updated);
              // Update the data, clear the search bar, redraw the entire table and jump to user
              scoreboard.DataTable().row(`#${data.user_id}`).data(rowData).order([2, 'desc']).search('').draw();
              scoreboard.DataTable().page.jumpToData(data.user_id, 4);

              var nameLink = `<a href="https://www.speedrun.com/user/${data.name}" target="_blank">${data.name}</a>
                                        <span
                                            class="pull-right friend-icon"
                                            onClick="javascript:${unfriendBefriend}('${data.user_id}');"
                                        ></span>`;
              $('td:eq(1)', `#${rowData['user_id']}`).html(nameLink);

              // Update the friends preview table
              previewRow = $(`#preview-${rowData['user_id']}`);
              console.log(rowData['name']);
              if (previewRow) {
                $('td:eq(0)', previewRow).html(rowData['rank']);
                $('td:eq(1)', previewRow).html(nameLink);
                $('td:eq(2)', previewRow).html(rowData['score']);
                sortTable("preview");
              }
            } else {
              // Add a new row
              scoreboard.DataTable().row.add({
                'rank': data.rank,
                'name': data.name,
                'score': data.score,
                'last_update': data.last_updated,
                'user_id': data.user_id,
                // Redraw the table
              }).draw();
            }
          }
          ajaxResponseMessage.attr('class', `alert alert-${data.state}`);
          ajaxResponseMessage.html(htmlReplace(data.message));
          ajaxResponseMessage.css('visibility', 'visible');
        })
        .fail(function (data) {
          alert(`There was an unknown error with the AJAX request. Status code: ${data.status}`);
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
  $('form.ajax button').attr('type', 'submit');

  $('#scoreboard_info').parent().prepend(`
    <div>
      <label>Updated:</label>
      <span class="daysSince1">Today</span>,
      <span class="daysSince7">This week</span>,
      <span class="daysSince30">This month</span>,
      <span class="daysSince">Over a month ago</span>
    </div>
  `)

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
              tableData["rank"] = data.rank;
              tableData["name"] = '<a href="https://www.speedrun.com/user/"'+data.name+' target="_blank">'+data.name+'</a>';
              tableData["score"] = data.score;
              tableData["last_updated"] = serverToUserTime(data.last_updated);
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
  scoreboard.DataTable().page.jumpToData(user_id, 4);
}

// Add a friend
function befriend(friendID) {
  $.post('/', { 'action': 'befriend', 'friend-id': friendID }, function () { }, 'json')
    .done(function (data) {
      if (data.state == "success") {
        // Add on the scoreboard
        var row = scoreboard.DataTable().row(`#${friendID}`)
        var rowData = row.data();
        var rowNode = row.node();
        $(rowNode).addClass("highlight-friend");
        $(rowNode).find("span.friend-icon").attr('onClick', `javascript:unfriend('${friendID}');`);

        // Add on the preview
        $('tbody', $("#preview")).append(
          `<tr class="highlight-friend" id="preview-${friendID}">
                    <td>${rowData["rank"]}</td>
                    <td>
                        <a href="https://www.speedrun.com/user/${rowData['name']}" target="_blank">${rowData['name']}</a>
                        <span class="pull-right friend-icon" onClick="javascript:unfriend('${rowData['user_id']}');"></span>
                    </td>
                    <td>${rowData["score"]}</td>
                    <td>
                        <a href="javascript:jumpToPlayer('${friendID}');">
                            <span class="pull-right glyphicon glyphicon-circle-arrow-right"></span>
                        </a>
                    </td>
                </tr>`
        );
        sortTable("preview");
      }
      ajaxResponseMessage.attr('class', `alert alert-${data.state}`);
      ajaxResponseMessage.html(htmlReplace(data.message));
      ajaxResponseMessage.css('visibility', 'visible');
    })
    .fail(function (data) {
      alert(`There was an unknown error with the AJAX request. Status code: ${data.status}`);
    })
    .always(function (data) {
      console.log(data);
    })
}

// Remove a friend
function unfriend(friendID) {
  // Remove a friend
  $.post('/', { 'action': 'unfriend', 'friend-id': friendID }, function () { }, 'json')
    .done(function (data) {
      if (data.state == "success") {
        // Remove from the scoreboard
        var rowNode = scoreboard.DataTable().row(`#${friendID}`).node();
        $(rowNode).removeClass("highlight-friend");
        $(rowNode).find("span.friend-icon").attr('onClick', `javascript:befriend('${friendID}');`);

        // Remove from the preview table
        $(`#preview-${friendID}`).remove();
        sortTable("preview");
      }
      ajaxResponseMessage.attr('class', `alert alert-${data.state}`);
      ajaxResponseMessage.html(htmlReplace(data.message));
      ajaxResponseMessage.css('visibility', 'visible');
    })
    .fail(function (data) {
      alert(`There was an unknown error with the AJAX request. Status code: ${data.status}`);
    })
    .always(function (data) {
      console.log(data);
    })
}

// https://stackoverflow.com/a/7558600
// Sort a table by third (score) column
function sortTable(tableID) {
  var tbl = document.getElementById(tableID).tBodies[0];
  var store = [];
  for (var i = 0, len = tbl.rows.length; i < len; i++) {
    var row = tbl.rows[i];
    var sortnr = parseFloat(row.cells[2] ? (row.cells[2].textContent || row.cells[2].innerText) : 0);
    if (!isNaN(sortnr)) store.push([sortnr, row]);
  }
  store.sort(function (x, y) {
    return y[0] - x[0];
  });
  for (var i = 0, len = store.length; i < len; i++) {
    tbl.appendChild(store[i][1]);
  }
  store = null;
}

function isString(value) {
  return typeof value === 'string' || value instanceof String;
};

function htmlReplace(message) {
  if (!isString(message)) return "";
  return message
    .replace(/</g, "&lt")
    .replace(/>/g, "&gt")
    .replace(/\n/g, "<br />");
}
