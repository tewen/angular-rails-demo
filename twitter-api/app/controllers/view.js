angular.module('twitterapi.controllers').controller('controllers.View',
    ['$scope', 'services.Api',
        function ($scope, api) {

            $scope.request = {
                tweet: "",
                commaSeparatedAutoTags: ""
            };

            $scope.onTweet = function (event, valid) {
                event.preventDefault();
                if (valid) {
                    api.tweet($scope.request).then(function (result) {
                        $scope.request.tweet = "";
                    });
                }
            };
        }]);