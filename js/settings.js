(function() {
    var browser = chrome;


    function saveOptions(e) {
        browser.storage.local.set({
            gitlab_url: document.querySelector("#gitlab_url").value,
            gitlab_key: document.querySelector("#gitlab_key").value,
            check_interval: document.querySelector("#check_interval").value,
            project_name: document.querySelector("#project_name").value
        });
    }


    function restoreOptions() {
        function setCurrentChoice(result) {
            document.querySelector("#gitlab_url").value = result.gitlab_url || "";
            document.querySelector("#gitlab_key").value = result.gitlab_key || "";
            document.querySelector("#check_interval").value = result.check_interval || 15;
            document.querySelector("#project_name").value = result.project_name || "";
        }

        function onError(error) {
            console.log(`Error: ${error}`);
        }

        var getting = browser.storage.local.get([
            "gitlab_url", 
            "gitlab_key", 
            "check_interval", 
            "project_name"
        ], setCurrentChoice);
    }


    document.addEventListener("DOMContentLoaded", restoreOptions);
    document.querySelector("form").addEventListener("submit", saveOptions);
}());