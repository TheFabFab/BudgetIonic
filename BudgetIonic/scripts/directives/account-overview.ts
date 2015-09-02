/// <reference path="../typings/angularjs/angular.d.ts" />
module Budget {

    interface IAccountOverviewScope extends ng.IScope {
        account: any;
        showLabels: boolean;
        showArc: boolean;
        showFullCircle: boolean;
        accountEx: AccountEx;
    }

    class AccountEx {
        public balance: number;
        public progress: number;
        public progressPath: string;
        public xArcEnd: number;
        public yArcEnd: number;
        public warning: boolean;
        public error: boolean;

        public recalculate(): void {
            var progress = this.progress || 0;
            this.warning = progress > 90;
            this.error = progress > 100;
            if (progress > 100) progress = 100;
            var alpha = 2 * Math.PI * progress / 100;
            var x = 40 + 35 * Math.sin(alpha);
            var y = 40 - 35 * Math.cos(alpha);
            var largeArcFlag = progress > 50 ? 1 : 0;
            this.progressPath = "M40,5 A35,35 0 " + largeArcFlag + ",1 " + x + "," + y;
            this.xArcEnd = x;
            this.yArcEnd = y;
        }
    }

    export class AccountOverview implements ng.IDirective {
        restrict = "E";
        replace = false;
        templateUrl = "/templates/account-overview.html";
        scope = {
            account: "=",
            showLabels: "="
        };
        link = function (scope: IAccountOverviewScope, elements: HTMLElement[]) {
            scope.accountEx = new AccountEx();

            scope.$watch("account", () => {
                if (scope.account) {
                    scope.accountEx.balance = scope.account.credited - scope.account.debited;
                    scope.accountEx.progress =
                        scope.account.credited
                            ? Math.round(100 * scope.account.debited / scope.account.credited)
                        : 0;

                    var spent = scope.accountEx.progress;
                    scope.showArc = spent > 0 && spent < 100;
                    scope.showFullCircle = spent >= 100;
                    scope.accountEx.recalculate();
                }
            });

        };

        public static IID = "accountOverview";

        constructor(private $log: ng.ILogService) {
            $log.debug("Constructing account overview");
        }

        static factory(): ng.IDirectiveFactory {
            const directive = ($log: ng.ILogService) => new AccountOverview($log);
            directive.$inject = ["$log"];
            return directive;
        }

    }
}