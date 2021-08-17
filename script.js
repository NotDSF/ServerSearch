// ==UserScript==
// @name         RoSearcher
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Find empty Roblox servers at the click of a button.
// @author       https://github.com/NotDSF
// @match        https://www.roblox.com/games/*
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let Cookie = document.cookie.match(/rosearch=(?<json>{.*?});/);
    let Options = Cookie?.groups.json ? JSON.parse(Cookie?.groups.json) : {};
    
    let Version = "0.4";
    let GameID = document.URL.match(/games\/(\d+)\//)[1];
    let GameOptions = Options[GameID] || {};

    function GetServers(Index) {
        return new Promise((resolve, reject) => {
            fetch(`https://www.roblox.com/games/getgameinstancesjson?placeId=${GameID}&startIndex=${Index}&_=1`, {
                method: "GET",
            })
            .then(res => res.text())
            .then(json => resolve(JSON.parse(json)))
            .catch(er => reject(er));
        });
    }

    function SaveOptions() {
        let Status     = document.getElementById("server-status");
        let MaxPing    = document.getElementById("ping-box").value;
        let Iterator   = document.getElementById("iterator-box").value;
        let MaxPlayers = document.getElementById("player-box").value;
        let CookieData = {};
        
        if (MaxPing.length) CookieData.MaxPing = MaxPing;
        if (Iterator.length) CookieData.Iterator = Iterator;
        if (MaxPlayers.length) CookieData.MaxPlayers = MaxPlayers;

        let StatusBackup = Status.innerHTML;
        
        Options[GameID] = CookieData;
        Status.innerHTML = "Saved options!";
        document.cookie = `rosearch=${JSON.stringify(Options)}; path=/games; expires=Fri, 31 Dec 9999 23:59:59 GMT;`;

        setTimeout(() => Status.innerHTML = StatusBackup, 2000);
    }

    fetch("https://raw.githubusercontent.com/NotDSF/RoSearcher/main/script-version")
        .then(res => res.text())
        .then(body => {
            if (body.trim() !== Version) {
                if (confirm("A new version of RoSearch is available, would you like to download it?")) {
                    document.location.href = "https://greasyfork.org/en/scripts/430402-rosearcher";
                }
            }
        })
        .catch(er => {
            alert("RoSearcher Error: " + er.toString());
            throw er;
        });

    async function main() {
        if (!confirm("Are you sure you want to find an empty server?")) return;

        let Status      = document.getElementById("server-status");
        let MaxPingB    = document.getElementById("ping-box");
        let IteratorB   = document.getElementById("iterator-box");
        let MaxPlayersB = document.getElementById("player-box");

        let MaxPing     = MaxPingB.value.length ? parseInt(MaxPingB.value) : 300;
        let Iterator    = IteratorB.value.length ? parseInt(IteratorB.value) : 30;
        let MaxPlayers  = MaxPlayersB.value.length ? parseInt(MaxPlayersB.value) : 4;

        let Index = 0;
        let LowestServer;

        Status.innerHTML = "Looking for servers...";

        while (true) {
            if (LowestServer && LowestServer.Len <= MaxPlayers && LowestServer.Ping <= MaxPing) {
                Status.innerHTML = `Found server! Players: ${LowestServer.Len} Ping: ${LowestServer.Ping} Index: ${Index}. Joining...`;
                eval(LowestServer.JoinScript);
                break;
            }

            let Servers = await GetServers(Index)
                .catch(er => {
                    throw er;
                });

            if (!Servers.Collection.length) {
                if (LowestServer && Iterator === 10) {
                    if (LowestServer.Len > MaxPlayers) alert(`We couldn't find a server with ${MaxPlayers} players or below! (Try editing your options)`);
                    if (LowestServer.Ping > MaxPing) alert(`We couldn't find a server with ${MaxPing} ping or below! (Try editing your options)`);

                    Status.innerHTML = `Found server! Players: ${LowestServer.Len} Ping: ${LowestServer.Ping} Index: ${Index}. Joining...`;
                    eval(LowestServer.JoinScript);
                    break;
                }

                if (LowestServer) {
                    Iterator = 10;
                    Index -= (Index > (Iterator * 2)) ? (Iterator * 2) : Iterator; // Just incase
                    continue;
                }

                alert("Sorry we couldn't find a server!");
                Status.innerHTML = "";
                break;
            }
            
            for (let Server of Servers.Collection) {
                let PlayerLen = Server.CurrentPlayers.length;

                if (!LowestServer) {
                    LowestServer = { Len: PlayerLen, Ping: Server.Ping, JoinLink: Server.JoinScript }
                    continue;
                }

                if (PlayerLen < LowestServer.Len) {
                    LowestServer = { Len: PlayerLen, Ping: Server.Ping, JoinScript: Server.JoinScript }
                }
            }

            Index += Iterator;
            Status.innerHTML = `Index: ${Index}, Lowest Server: ${LowestServer.Len}, Ping: ${LowestServer.Ping}...`;
        }
    }

    let GameInstances = document.getElementById("game-instances");
    let ParentDiv     = document.createElement("div");
    let ContainerHead = document.createElement("div");

    ParentDiv.className = "stack";
    GameInstances.prepend(ParentDiv);

    // container header

    let Title = document.createElement("h3");
    Title.innerHTML = "RoSearch";

    ContainerHead.className = "container-header";
    ContainerHead.prepend(Title);

    // container children

    let pingbox = document.createElement("textarea");
    pingbox.className = "dialog-input ng-valid ng-isolate-scope ng-touched ng-not-empty ng-dirty ng-valid-parse";
    pingbox.rows = 1;
    pingbox.style = "overflow: hidden; overflow-wrap: break-word; resize: none; height: 30px; margin-bottom: 5px; display: inherit; border-radius: 3px; width: 330px;";
    pingbox.placeholder = "Max Ping (Leave Blank For Default)";
    pingbox.innerHTML = GameOptions.MaxPing || "";
    pingbox.id = "ping-box";

    let maxPlayer = document.createElement("textarea");
    maxPlayer.className = "dialog-input ng-valid ng-isolate-scope ng-touched ng-not-empty ng-dirty ng-valid-parse";
    maxPlayer.rows = 1;
    maxPlayer.style = "overflow: hidden; overflow-wrap: break-word; resize: none; height: 30px; margin-bottom: 5px; display: inherit; border-radius: 3px; width: 330px;";
    maxPlayer.placeholder = "Max Players (Leave Blank For Default)";
    maxPlayer.innerHTML = GameOptions.MaxPlayers || "";
    maxPlayer.id = "player-box";

    let Iterator = document.createElement("textarea");
    Iterator.className = "dialog-input ng-valid ng-isolate-scope ng-touched ng-not-empty ng-dirty ng-valid-parse";
    Iterator.rows = 1;
    Iterator.style = "overflow: hidden; overflow-wrap: break-word; resize: none; height: 30px; margin-bottom: 5px; display: inherit; border-radius: 3px; width: 330px;";
    Iterator.placeholder = "Iterator (Leave Blank For Default)";
    Iterator.innerHTML = GameOptions.Iterator || "";
    Iterator.id = "iterator-box";
    
    let fakeButton = document.createElement("span");
    fakeButton.className = "btn-secondary-md btn-more";
    fakeButton.innerHTML = "Find Empty Server";
    fakeButton.onclick = main;
    fakeButton.style = "display: inherit; width: min-content; margin-bottom: 20px;";

    let fakeButton2 = document.createElement("span");
    fakeButton2.className = "btn-secondary-md btn-more";
    fakeButton2.innerHTML = "Save Options";
    fakeButton2.onclick = SaveOptions;
    fakeButton2.style = "display: inherit; width: min-content; margin-bottom: 5px;";

    let status = document.createElement("span");
    status.className = "section-content-off";
    status.id = "server-status";
    status.style = "display: inherit;";

    ParentDiv.prepend(ContainerHead, maxPlayer, pingbox, Iterator, fakeButton2, fakeButton, status);
})();
