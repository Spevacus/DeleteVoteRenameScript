// ==UserScript==
// @name         Delete/Reopen Vote Rename
// @namespace    https://github.com/Spevacus
// @version      1.2
// @description  Renames the moderation voting buttons for Delete/Undelete/Reopen to "Retract (vote type)" if you've already voted. Also more verbosely clarifies this for keyboard shortcut users.
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
/* global StackExchange, Stacks, $ */

(function() {
    'use strict';
    var deleteButtons = document.getElementsByClassName('js-delete-post s-btn s-btn__link js-gps-track');//Delete button
    var reopenButton = document.getElementsByClassName('js-close-question-link s-btn s-btn__link js-gps-track')[0];//Close/Reopen button class

    //Hook into click event for keyboard users
    //This only looks for the pseudo-click fired by the keyboard shortcut script
    registerDeleteButtonClickEvents(deleteButtons);

    handleDeleteVoteDisplay(deleteButtons);

    handleReopenVoteDisplay(reopenButton);

    // Hook into request completions
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', function() {
            lookForReopenVoteResponses(this.responseText, reopenButton);
        });
        origOpen.apply(this, arguments);
    }
})();

function registerDeleteButtonClickEvents(deleteButtons)
{
    for(var i = 0; i <= deleteButtons.length - 1; i++)
    {
        $(deleteButtons[i]).on("click", handleDeleteButtonClick);
    }
}

function handleDeleteVoteDisplay(deleteButtons)
{
    var delVoteRegex = /\(([^)]+)\)/;//Grabs delete vote count
    for(var i = 0; i <= deleteButtons.length - 1; i++)
    {
        if(deleteButtons[i].getAttribute("data-has-active-vote") == "true")
        {
            var deleteVotes = delVoteRegex.exec(deleteButtons[i].innerText);
            if(deleteButtons[i].getAttribute("data-is-deleted") == "true")
            {
                deleteButtons[i].innerText = "Retract Undelete " + deleteVotes[0];
                deleteButtons[i].setAttribute("data-prompt", "UNDELETE VOTE RETRACTION\n\nAre you sure you want to RETRACT your vote to undelete? You will NOT be able to vote to undelete again!");
            }
            else
            {
                deleteButtons[i].innerText = "Retract Delete " + deleteVotes[0];
                deleteButtons[i].setAttribute("data-prompt", "DELETE VOTE RETRACTION\n\nAre you sure you want to RETRACT your vote to delete? You will NOT be able to vote to delete again!");
            }
        }
    }
}

function handleReopenVoteDisplay(reopenButton)
{
    if(reopenButton.getAttribute("data-has-active-vote") == "true")
    {
        //The current votes for close/reopen have their own class, contrary to delete/undelete votes.
        var currVotes = reopenButton.getElementsByClassName('existing-flag-count')[0];
        if(reopenButton.getAttribute("data-is-closed") == "true")
        {
            reopenButton.innerText = "Retract Reopen ";
            if(currVotes != null) reopenButton.appendChild(currVotes);
        }
    }
}

function lookForReopenVoteResponses(responseHTML, reopenButton, deleteButtons)
{
    var currVotes = reopenButton.getElementsByClassName('existing-flag-count')[0]; //Can be null if there are no pending reopen votes
    //15 = reopen vote
    if(responseHTML?.includes('FlagType":15'))
    {
        if(responseHTML?.includes('vote is retracted'))
        {
            reopenButton.innerText = "Reopen ";
            if(currVotes != null) reopenButton.appendChild(currVotes);
        }
        if(responseHTML?.includes('vote has been recorded'))
        {
            reopenButton.innerText = "Retract Reopen ";
            if(currVotes != null) reopenButton.appendChild(currVotes);
        }
    }
}

function handleDeleteButtonClick(eventRef)
{
    //When fired from the keyboard, this is reliably null.
    //When manually clicked, this is reliably true.
    if(eventRef.cancelable == null)
    {
        var postSelected = document.getElementsByClassName('keyboard-selected')[0];
        if(isDelVoteRetraction(postSelected))
        {
            eventRef.stopPropagation();
            handleKeyboardShortcutRetraction(postSelected);
        }
    }
}

function isDelVoteRetraction(postSelected)
{
    if(postSelected != null)
    {
        var deleteButton = postSelected.getElementsByClassName('js-delete-post s-btn s-btn__link js-gps-track')[0];
        if(deleteButton == null) return false;
        return deleteButton.getAttribute("data-has-active-vote") == "true";
    }
    return false;
}

async function handleKeyboardShortcutRetraction(postSelected)
{
    var postID = getPostID(postSelected);
    //The 'deleted-answer' class is used for deleted posts.
    if(postSelected.classList.contains('deleted-answer'))
    {
        if(await showConfirmModal("Warning: Undelete Vote Retraction", "Hey! You're about to retract your vote to undelete. Are you sure you want to do that?"))
        {
            postVoteAndRefresh(postID, 11, "Undelete");
        }
    }
    else
    {
        if(await showConfirmModal("Warning: Delete Vote Retraction", "Hey! You're about to retract your vote to delete. Are you sure you want to do that?"))
        {
            postVoteAndRefresh(postID, 10, "Delete");
        }
    }
}

function getPostID(postSelected)
{
    return postSelected.getAttribute('id') == "question" ? postSelected.getAttribute('data-questionid') : postSelected.getAttribute('data-answerid');
}

function postVoteAndRefresh(postID, voteID, type)
{
    let fkey = window.localStorage["se:fkey"].split(",")[0];
    window.setTimeout(function() {
        $.post({
            url: "https://" + document.location.host + "/posts/" + postID + "/vote/" + voteID + "?undo=true",
            data: "fkey=" + fkey,
            success: function () {
                console.log(type + " vote retracted.");
            },
            error: function (jqXHR, textStatus, errorThrown) {
                window.alert("An error occurred while retracting your vote. See the console for details.");
                console.log("Error: " + textStatus + " " + errorThrown);
            }
        });
    }, 250);
    window.setTimeout(() => {
        window.location.href = "https://" + window.location.host + "/questions/" + postID;
    }, 500);
}

async function showConfirmModal(title, bodyHtml) {
    return await StackExchange.helpers.showConfirmModal({
        title: title,
        bodyHtml: bodyHtml,
        buttonLabel: 'Yes, please retract!'
    });
}
