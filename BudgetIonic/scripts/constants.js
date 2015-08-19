var Budget;
(function (Budget) {
    var FirebaseEvents = (function () {
        function FirebaseEvents() {
        }
        FirebaseEvents.value = 'value';
        FirebaseEvents.child_added = 'child_added';
        FirebaseEvents.child_changed = 'child_changed';
        FirebaseEvents.child_removed = 'child_removed';
        FirebaseEvents.child_moved = 'child_moved';
        return FirebaseEvents;
    })();
    Budget.FirebaseEvents = FirebaseEvents;
})(Budget || (Budget = {}));
//# sourceMappingURL=constants.js.map