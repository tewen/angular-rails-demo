spyOnAngularService = function (service, methodName, result) {
    return spyOn(service, methodName).andReturn({then: function (fn) {
        fn(result);
    }});
};

spyOnAngularServiceError = function (service, methodName, result) {
    return spyOn(service, methodName).andReturn({then: function (fn, errorFn) {
        errorFn(result);
    }});
};