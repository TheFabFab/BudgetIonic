/// <reference path="../../typings/rx/rx.d.ts" />
/// <reference path="../data/firebase-service.ts" />
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
            Data.FirebaseService.IID,
            AuthenticationService.IID
        ];

        constructor($state: ng.ui.IStateService, $timeout: ng.ITimeoutService, $log: ng.ILogService, $ionicSideMenuDelegate, private dataService: IDataService, private firebaseService: Data.FirebaseService, authenticationService: IAuthenticationService) {
            $log.debug("Initializing news feed control");
            var userData = authenticationService.userData;

            if (userData) {

                const subscription = firebaseService.users
                    .user(userData.uid).projects()
                    .flatMap(project => 
                        firebaseService.projects
                        .project(project.projectId)
                        .transactions.byTimestamp()
                        .map(transaction => ({
                            projectId: project.projectId,
                            transaction: transaction
                        }))
                    )
                    .subscribe(x => {
                        var messageText = `Transferred ${x.transaction.amount} from ${x.transaction.debitAccountName} to ${x.transaction.creditAccountName}`;
                        var action = () => {
                            $ionicSideMenuDelegate.toggleRight(false);
                            $timeout(() => {
                                $state.go("logged-in.project.account", { projectId: x.projectId, accountId: x.transaction.credit });
                            }, 150);
                        };
                        var messageVm = new MessageViewModel(userData.uid, messageText, x.transaction.timestamp, action);
                        this.insertMessage(messageVm);
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