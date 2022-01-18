// ==UserScript==
// @name         Delete Vote Rename
// @namespace    https://github.com/Spevacus
// @version      1.0
// @description  Renames the Delete button to "Retract Delete" if you've already voted to delete. Same applies for Undelete votes.
// @author       Spevacus
// @match       *://*.stackexchange.com/questions/*
// @match       *://*.stackoverflow.com/questions/*
// @match       *://*.superuser.com/questions/*
// @match       *://*.serverfault.com/questions/*
// @match       *://*.stackapps.com/questions/*
// @match       *://*.mathoverflow.net/questions/*
// @match       *://*.askubuntu.com/questions/*
// @exclude     https://stackoverflow.com/c/*
// @icon        https://i.imgur.com/3M05BaN.png
// @downloadURL https://github.com/Spevacus/DeleteVoteRenameScript/raw/main/Delete Vote Rename.user.js
// @updateURL   https://github.com/Spevacus/DeleteVoteRenameScript/raw/main/Delete Vote Rename.user.js
// @grant       none
// ==/UserScript==

(function() {
    'use strict';
    var deleteButton = document.getElementsByClassName('js-delete-post s-btn s-btn__link js-gps-track');//Delete button class
    var delVoteRegex = /\(([^)]+)\)/;//Grabs delete vote count
    for(var i = 0; i <= deleteButton.length; i++)
    {
        if(deleteButton[i].getAttribute("data-has-active-vote") == "true")
        {
            var deleteVotes = delVoteRegex.exec(deleteButton[i].innerText);
            if(deleteButton[i].getAttribute("data-is-deleted") == "true")
            {
                deleteButton[i].innerText = "Retract Undelete " + deleteVotes[0];
                deleteButton[i].setAttribute("data-prompt", "Are you sure you want to RETRACT your vote to undelete? You will NOT be able to vote to undelete again!");
            }
            else
            {
                deleteButton[i].innerText = "Retract Delete " + deleteVotes[0];
                deleteButton[i].setAttribute("data-prompt", "Are you sure you want to RETRACT your vote to delete? You will NOT be able to vote to delete again!");
            }
        }
    }
})();
