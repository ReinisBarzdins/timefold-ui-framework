function getHardScore(score) {
    return parseInt(score.substring(0, score.indexOf("hard")));
}

function formatTime(seconds) {
    if (seconds === null || seconds === undefined) return "-";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h + ":" + (m < 10 ? "0" : "") + m;
}

function buildIndictmentMap(indictments) {
    const map = {};
    indictments.forEach(i => {
        map[i.indictedObjectClass + "_" + i.indictedObjectID] = i;
    });
    return map;
}

  function detectiveHasRealHardViolation(indictment) {
       if (!indictment) return false;

       return indictment.constraintMatches.some(m => {
           const hard = parseInt(m.score.substring(0, m.score.indexOf("hard")));
           return hard < 0 && m.constraintName !== "Group experience exceeds detective experience";
       });
   }

function buildConstraintPart(indictment, type) {
    if (!indictment) return "<hr>No violations";

    let html = "<hr><b>Violations</b><br>";
    indictment.constraintMatches.forEach(m => {
        if (m.constraintName === "Group experience exceeds detective experience" && type === "detective") {
         // ignore
        } else if (getHardScore(m.score) < 0) {
            html += "<b>" + m.constraintName + " :</b> " + m.score + "<br>";
        } else {
            html += m.constraintName + " : " + m.score + "<br>";
        }
    });
    return html;
}

function detectivePopover(d, indictment) {
    let html =
        "<b>Detective </b>Detective_" + d.id + "<br>" +
        "<b>Experience: </b>" + d.experience + "<br>" +
        "<b>Max groups: </b>" + d.maxGroups + "<br>" +
        "<b>Working time: </b>" +
            formatTime(d.workingTime.from) + " - " + formatTime(d.workingTime.to) + "<br>" +
        "<b>Car: </b>" + (d.car !== null && d.car !== undefined ? "Has car" : "No car") + "<br>" +
        "<b>Office: </b>Office_" + d.office + "<br>" +
        "<b>Photo time: </b>" + d.photoTime + " seconds<br>" +
        "<b>Salary: </b>" + d.salaryPerSecond + " / second";

    html += buildConstraintPart(indictment, "detective");
    return html;
}

function groupPopover(g, indictment) {
    const thievesText =
        (g.thieves && g.thieves.length)
            ? g.thieves.map(t => "Thief_" + t).join(", ")
            : "-";
    const mt = g.meetingTime || {};

    let html =
        "<b>Group " + g.id + "</b><br>" +
        "<b>Experience: </b>" + (g.experience ?? "-") + "<br>" +
        "<b>Meeting time: </b>" + formatTime(mt.from) + " - " + formatTime(mt.to) + "<br>" +
        "<b>Thieves: </b>" + thievesText;

    html += buildConstraintPart(indictment, "group");
    return html;
}

$(document).ready(function () {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    // score badge
    $.getJSON("/dsp/score/" + id, function (scoreAnalysis) {
        const hard = getHardScore(scoreAnalysis.score);
        const badgeClass = hard === 0 ? "bg-success" : "bg-danger";

        $("#scoreBadge")
            .text(scoreAnalysis.score)
            .addClass("badge " + badgeClass)
            .attr({
                "data-bs-toggle": "popover",
                "data-bs-html": "true",
                "data-bs-content": scoreAnalysis.constraints
                    .map(c => {
                        const hard = parseInt(c.score.substring(0, c.score.indexOf("hard")));
                        if (hard < 0) {
                            return "<p class='mb-2'><b>" + c.name + " : </b>" + c.score + "</p>";
                        } else {
                            return "<p class='mb-2'>" + c.name + " : " + c.score + "</p>";
                        }
                    })
                    .join("")
            });

        new bootstrap.Popover($("#scoreBadge")[0]);
    });

    // solution + indictments
    $.getJSON("/dsp/" + id, function (solution) {
        $.getJSON("/dsp/" + id + "/explain-debug", function (indictments) {

            const indictmentMap = buildIndictmentMap(indictments);

            // solution.groups is list of IDs (numbers)
            const groupIds = solution.groups || [];

            // Build groupMap from the group objects that exist inside detective.groups
            const groupMap = {};
            (solution.detectives || []).forEach(d => {
                (d.groups || []).forEach(g => {
                    groupMap[g.id] = g;
                });
            });

            function getGroupObj(groupId) {
                // If unassigned group has no object anywhere, create a placeholder for popovers/header
                return groupMap[groupId] || {
                    id: groupId,
                    experience: null,
                    thieves: [],
                    meetingTime: { from: null, to: null }
                };
            }

            // header
            groupIds.forEach(gid => {
                $("#groupHeader").append("<th>Group " + gid + "</th>");
            });

            // rows
            (solution.detectives || []).forEach(d => {
                const row = $("<tr></tr>");

                const dKey = "Detective_" + d.id;
                const dInd = indictmentMap[dKey];
                const dBad = detectiveHasRealHardViolation(dInd);

                row.append(
                    $("<td></td>").append(
                        '<span class="badge ' + (dBad ? "bg-danger" : "bg-success") + '" ' +
                        'data-bs-toggle="popover" data-bs-html="true" ' +
                        'data-bs-content="' + detectivePopover(d, dInd) + '">' +
                        "Detective " + d.id +
                        "</span>"
                    )
                );

                groupIds.forEach(gid => {
                    const hasGroup = (d.groups || []).some(gr => gr.id === gid);
                    const gObj = getGroupObj(gid);

                    const gKey = "Group_" + gid;
                    const gInd = indictmentMap[gKey];
                    const gBad = gInd && getHardScore(gInd.score) < 0;

                    const cell = $("<td></td>");

                    if (hasGroup) {
                        cell.append(
                            '<span class="badge ' + (gBad ? "bg-danger" : "bg-success") + '" ' +
                            'data-bs-toggle="popover" data-bs-html="true" ' +
                            'data-bs-content="' + groupPopover(gObj, gInd) + '">' +
                             gKey +
                            "</span>"
                        );
                    } else {
                        // still allow popover on unassigned group cell if you want:
                        // cell.text("-");
                        cell.append(
                            '<span class="badge bg-secondary" ' +
                            'data-bs-toggle="popover" data-bs-html="true" ' +
                            'data-bs-content="' + groupPopover(gObj, gInd) + '">' +
                            "-" +
                            "</span>"
                        );
                    }

                    row.append(cell);
                });

                $("#scheduleBody").append(row);
            });

            $('[data-bs-toggle="popover"]').popover();
        });
         $.getJSON("/dsp/" + id + "/score-explanation", function (indictments) {

                    const indictmentMap = buildIndictmentMap(indictments);

                    // solution.groups is list of IDs (numbers)
                    const groupIds = solution.groups || [];

                    // Build groupMap from the group objects that exist inside detective.groups
                    const groupMap = {};
                    (solution.detectives || []).forEach(d => {
                        (d.groups || []).forEach(g => {
                            groupMap[g.id] = g;
                        });
                    });

                    function getGroupObj(groupId) {
                        // If unassigned group has no object anywhere, create a placeholder for popovers/header
                        return groupMap[groupId] || {
                            id: groupId,
                            experience: null,
                            thieves: [],
                            meetingTime: { from: null, to: null }
                        };
                    }

                    // header
                    groupIds.forEach(gid => {
                        $("#groupHeader").append("<th>Group " + gid + "</th>");
                    });

                    // rows
                    (solution.detectives || []).forEach(d => {
                        const row = $("<tr></tr>");

                        const dKey = "Detective_" + d.id;
                        const dInd = indictmentMap[dKey];
                        const dBad = detectiveHasRealHardViolation(dInd);

                        row.append(
                            $("<td></td>").append(
                                '<span class="badge ' + (dBad ? "bg-danger" : "bg-success") + '" ' +
                                'data-bs-toggle="popover" data-bs-html="true" ' +
                                'data-bs-content="' + detectivePopover(d, dInd) + '">' +
                                "Detective " + d.id +
                                "</span>"
                            )
                        );

                        groupIds.forEach(gid => {
                            const hasGroup = (d.groups || []).some(gr => gr.id === gid);
                            const gObj = getGroupObj(gid);

                            const gKey = "Group_" + gid;
                            const gInd = indictmentMap[gKey];
                            const gBad = gInd && getHardScore(gInd.score) < 0;

                            const cell = $("<td></td>");

                            if (hasGroup) {
                                cell.append(
                                    '<span class="badge ' + (gBad ? "bg-danger" : "bg-success") + '" ' +
                                    'data-bs-toggle="popover" data-bs-html="true" ' +
                                    'data-bs-content="' + groupPopover(gObj, gInd) + '">' +
                                     gKey +
                                    "</span>"
                                );
                            } else {
                                // still allow popover on unassigned group cell if you want:
                                // cell.text("-");
                                cell.append(
                                    '<span class="badge bg-secondary" ' +
                                    'data-bs-toggle="popover" data-bs-html="true" ' +
                                    'data-bs-content="' + groupPopover(gObj, gInd) + '">' +
                                    "-" +
                                    "</span>"
                                );
                            }

                            row.append(cell);
                        });

                        $("#scheduleBody").append(row);
                    });

                    $('[data-bs-toggle="popover"]').popover();
                });
    });
});