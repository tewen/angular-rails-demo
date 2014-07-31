angular.module('twitterapi.services').factory('services.Api',
    ['$q', '$http', 'services.transformer.ApiRequest',
        function ($q, $http, apiRequestTransformer) {
            return {
                tweet: function (tweet) {
                    var deferred = $q.defer();
                    $http({
                        method: "POST",
                        url: "/neosavvy/passthrough/api/twitter/v1/status/update",
                        data: tweet,
                        transformRequest: apiRequestTransformer
                    }).success(function (data) {
                            deferred.resolve(data);
                        });

                    return deferred.promise;
                }
            };
        }]);