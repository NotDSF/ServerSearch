// ==UserScript==
// @name         RoSearcher
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Find empty Roblox servers at the click of a button.
// @author       https://github.com/NotDSF
// @match        https://www.roblox.com/games/*
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let GameID = document.URL.match(/games\/(\d+)\//)[1];

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

    async function main() {
        if (!confirm("Are you sure you want to find an empty server?")) return;

        let Status   = document.getElementById("server-status");
        let Index    = 0;
        let Iterator = 30;
        let LowestServer;

        Status.innerHTML = "Looking for servers...";

        while (true) {
            if (LowestServer && LowestServer.Len <= 4) {
                Status.innerHTML = `Found server! Players: ${LowestServer.Len}. Joining...`;
                eval(LowestServer.JoinScript);
                break;
            }

            let Servers = await GetServers(Index)
                .catch(er => {
                    throw er;
                });

            if (!Servers.Collection.length) {
                if (LowestServer && Iterator === 10) {
                    Status.innerHTML = `Found server! Players: ${LowestServer.Len}. Joining...`;
                    eval(LowestServer.JoinScript);
                    break;
                }

                if (LowestServer) {
                    Iterator = 10;
                    Index -= (Index > 60 ? 60 : 30); // Just incase
                    continue;
                }

                alert("Game has no active servers!");
                Status.innerHTML = "";
                break;
            }
            
            for (let Server of Servers.Collection) {
                let PlayerLen = Server.CurrentPlayers.length;

                if (!LowestServer) {
                    LowestServer = { Len: PlayerLen, JoinLink: Server.JoinScript }
                    continue;
                }

                if (PlayerLen < LowestServer.Len) {
                    LowestServer = { Len: PlayerLen, JoinScript: Server.JoinScript }
                }
            }

            Index += Iterator;
            Status.innerHTML = `Index: ${Index}, Lowest: ${LowestServer.Len}...`;
        }
    }

    let GameInstances = document.getElementById("game-instances");
    let ParentDiv     = document.createElement("div");
    let ContainerHead = document.createElement("div");

    ParentDiv.className = "stack";
    GameInstances.prepend(ParentDiv);

    // container header

    let Title = document.createElement("h3");
    Title.innerHTML = "Tools";

    ContainerHead.className = "container-header";
    ContainerHead.prepend(Title);

    // container children

    let status = document.createElement("span");
    status.className = "section-content-off";
    status.id = "server-status";

    let fakeButton = document.createElement("span");
    fakeButton.className = "btn-secondary-md btn-more";
    fakeButton.innerHTML = "Find empty server";
    fakeButton.onclick = main;

    ParentDiv.prepend(ContainerHead, fakeButton, status);
})();
