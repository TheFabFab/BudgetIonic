var Budget;
(function (Budget) {
    var ProjectNode = (function () {
        function ProjectNode(projectData, transactions, accounts, users) {
            this.projectData = projectData;
            this.transactions = transactions;
            this.accounts = accounts;
            this.users = users;
        }
        return ProjectNode;
    })();
    Budget.ProjectNode = ProjectNode;
    {
    }
})(Budget || (Budget = {}));
var ProjectUserData = (function () {
    function ProjectUserData(lastAccessTime) {
        this.lastAccessTime = lastAccessTime;
    }
    return ProjectUserData;
})();
exports.ProjectUserData = ProjectUserData;
var ProjectOfUser = (function () {
    function ProjectOfUser(title, lastAccessTime, key) {
        this.title = title;
        this.lastAccessTime = lastAccessTime;
        this.key = key;
    }
    return ProjectOfUser;
})();
exports.ProjectOfUser = ProjectOfUser;
//# sourceMappingURL=project-data.js.map