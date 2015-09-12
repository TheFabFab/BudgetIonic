/// <reference path="../services/data-service.ts" />
/// <reference path="../services/authentication-service.ts" />
module Budget {
    export class MessageViewModel {
        public profilePicture = {};

        constructor(public userId: string, public label: string, public timestamp: number, public action: () => void) {
            
        }
    }

    export class NewsFeedCtrl {
        public static IID = "newsFeedCtrl";

        public messages: MessageViewModel[] = [];

        public static $inject = [
            "$state",
            "$timeout",
            "$log",
            "$ionicSideMenuDelegate",
            DataService.IID,
            AuthenticationService.IID
        ];

        constructor($state: ng.ui.IStateService, $timeout: ng.ITimeoutService, $log: ng.ILogService, $ionicSideMenuDelegate, private dataService: IDataService, authenticationService: IAuthenticationService) {
            $log.debug("Initializing news feed control");
            var userData = authenticationService.userData;

            if (userData) {
                dataService.getProjectsForUser(userData.uid)
                    .then(projects => {
                        projects.forEach(project => {
                            const projectId = project.key;

                            dataService.getProjectsReference()
                                .child(projectId)
                                .child("transactions")
                                .orderByChild("timestamp")
                                .on(FirebaseEvents.child_added, snapshot => {
                                var transaction = snapshot.exportVal<ITransactionData>();
                                    var messageText = `Transferred ${transaction.amount} from ${transaction.debitAccountName} to ${transaction.creditAccountName}`;
                                    var action = () => {
                                        $ionicSideMenuDelegate.toggleRight(false);
                                        $timeout(() => {
                                            $state.go("logged-in.project.account", { projectId: projectId, accountId: transaction.credit });
                                        }, 150);
                                    };
                                    var messageVm = new MessageViewModel(userData.uid, messageText, transaction.timestamp, action);
                                    this.insertMessage(messageVm);
                                });
                        });
                    });
            }
            
        }

        private insertMessage(messageViewModel: MessageViewModel): void {
            if (messageViewModel.userId) {
                this.dataService
                    .getUserPicture(messageViewModel.userId)
                    .then(picture => {
                        messageViewModel.profilePicture = {
                            "background-image": `url('${picture}')`
                        };
                    });
            }

            var index = 0;
            this.messages.forEach(x => {
                if (x.timestamp > messageViewModel.timestamp) index++;
            });
            this.messages.splice(index, 0, messageViewModel);
        }
    }
}