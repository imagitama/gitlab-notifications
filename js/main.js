(function() { 
    var browser = chrome,
        checkInterval = 15,
        checkLoop = null,
        gitlabUrl = "",
        gitlabKey = "",
        currentMergeRequests = [],
        projectName = "";


    function onError(message) {
        sendNotification("Error", { body: "Failed to query GitLab API - please check your settings"});
    }


    function createNotification(title, opts) {
        var notification = new Notification(title, opts);
        return notification;
    }


    function sendNotification(title, opts, onDone) {
        if (!opts) {
            opts = {}
        }

        if (!opts.icon) {
            opts.icon = "icons/icon128.png";
        }
        if (!opts.image) {
            opts.image = "icons/icon128.png";
        }

        if (!onDone) {
            onDone = function() {}
        }

        if (Notification === undefined) {
            return false;
        } 
        
        switch (Notification.permission) {
            case "granted":
                onDone(createNotification(title, opts));
                break;
            
            case "denied":
                break;

            default:
                Notification.requestPermission.then(function (permission) {
                    if (permission === "granted") {
                        onDone(createNotification(title, opts));
                    }
                });
        }
    }


    function onGitResponse(resp) {
        var remoteMergeRequests = resp,
            temp = [],
            diff = [],
            lastDiffUrl = "";

        remoteMergeRequests.forEach(function(mergeRequest) {
            temp.push({
                id:             mergeRequest.id,
                web_url:        mergeRequest.web_url,
                project_id:     mergeRequest.project_id,
                title:          mergeRequest.title,
                description:    mergeRequest.description,
                author:         mergeRequest.author.name
            });
        });

        remoteMergeRequests = temp;

        for (var i = 0, len = remoteMergeRequests.length, remote, found = false; i < len; i++) {
            remote = remoteMergeRequests[i];

            currentMergeRequests.forEach(function(current) {
                if (current.id == remote.id) { //Can't use indexOf() here :(
                    found = true;
                }
            });

            if (found == false) {
                diff.push(remote);
                
                lastDiffUrl = remote.web_url;
            }
        }

        function onDone(notification) {
            notification.onclick = function() {
                if (lastDiffUrl) {
                    browser.tabs.create({ url: lastDiffUrl });
                }
            }
        }

        if (diff.length) {
            sendNotification("Notification", { body: "There are " + diff.length + " new merge requests" }, onDone);
        }

        currentMergeRequests = remoteMergeRequests;
    }


    function checkGit() {
        var getting = browser.storage.local.get(["gitlab_url", "gitlab_key", "project_name"], function(items) {
            if (items.project_name) {
                projectName = items.project_name;
            }

            if (items.gitlab_url) {
                gitlabUrl = items.gitlab_url;
            }

            if (items.gitlab_key) {
                gitlabKey = items.gitlab_key;
            }

            gitlabUrl = gitlabUrl.replace(/\/$/, "") + "/projects/" + projectName.replace("/", "%2F") + "/merge_requests?state=opened";

            var xhr = new XMLHttpRequest();
            xhr.open("GET", gitlabUrl, true);
            xhr.setRequestHeader("PRIVATE-TOKEN", gitlabKey);
            xhr.onreadystatechange = function(resp) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        var resp = JSON.parse(xhr.responseText);

                        onGitResponse(resp);
                    } else {
                        onError("Bad error code: " + xhr.status);
                        settingsChanged = false;
                    }
                }
            }
            xhr.send();
        });
    }


    function startCheckLoop() {
        var getting = browser.storage.local.get(["check_interval"], function(items) {
            storedCheckInterval = items.check_interval;

            if (storedCheckInterval > 0) {
                checkInterval = storedCheckInterval;
            }

            checkLoop = setInterval(checkGit, checkInterval * 1000);
        });
    }


    function sendWelcomeNotification() {
        var getting = browser.storage.local.get(["gitlab_url", "gitlab_key", "project_name"], function(items) {
            if (!items.gitlab_url || !items.gitlab_key || !items.project_name) {
                 sendNotification("Hello world!", { body: "Please configure the extension settings" });
            } else {
                checkGit();
            }
        });
    }


    sendWelcomeNotification();
    startCheckLoop();
}());