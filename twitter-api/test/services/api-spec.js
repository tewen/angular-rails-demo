describe("services.Api", function () {
    var $http, service;

    beforeEach(function () {
        module('twitterapi.services',
            'twitterapi.transformers', {
            $http: jasmine.createSpy('$http')
        });
        inject(function ($injector, _$http_) {
            $http = _$http_;
            $http.andReturn({success: function (fn) {
                return fn();
            }});
            service = $injector.get('services.Api');
        });
    });

    it("Should call the $http with the parameters", function () {
        service.tweet("Hey Trevor, this is a tweet!");
        expect($http).toHaveBeenCalledWith({
            method: "POST",
            url: "/neosavvy/passthrough/api/twitter/v1/status/update",
            data: "Hey Trevor, this is a tweet!",
            transformRequest: jasmine.any(Function)
        });
    });

});