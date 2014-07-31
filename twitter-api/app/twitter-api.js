angular.module('twitterapi.controllers', []);
angular.module('twitterapi.services', []);
angular.module('twitterapi.transformers', []);
angular.module('twitterapi.constants', []);

angular.module('twitterapi',
        [   'base64',
            'twitterapi.controllers',
            'twitterapi.services',
            'twitterapi.transformers',
            'twitterapi.constants'
        ]).config(['$httpProvider', function ($httpProvider) {
        angular.module('twitterapi.services').$httpProvider = $httpProvider;
    }]);