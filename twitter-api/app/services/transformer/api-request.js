angular.module('twitterapi.transformers').factory('services.transformer.ApiRequest',
    function () {
        return function (data) {
            if (data.commaSeparatedAutoTags) {
                var ar = data.commaSeparatedAutoTags.split(", ");
                for (var i = 0; i < ar.length; i++) {
                    var tag = ar[i];
                    data.tweet = data.tweet.replace(tag, "#" + tag);
                }
            }
            return JSON.stringify({status: data.tweet});
        };
    });