/*! neosavvy-javascript-angular-core - v0.1.4 - 2013-12-16
* Copyright (c) 2013 Neosavvy, Inc.; Licensed  */
var Neosavvy = Neosavvy || {};
Neosavvy.AngularCore = Neosavvy.AngularCore || {};
Neosavvy.AngularCore.Analytics = angular.module('neosavvy.angularcore.analytics', []);
Neosavvy.AngularCore.Controllers = angular.module('neosavvy.angularcore.controllers', []);
Neosavvy.AngularCore.Directives = angular.module('neosavvy.angularcore.directives', []);
Neosavvy.AngularCore.Filters = angular.module('neosavvy.angularcore.filters', []);
Neosavvy.AngularCore.Services = angular.module('neosavvy.angularcore.services', []);
Neosavvy.AngularCore.Dependencies = ['neosavvy.angularcore.analytics', 'neosavvy.angularcore.controllers', 'neosavvy.angularcore.directives', 'neosavvy.angularcore.filters', 'neosavvy.angularcore.services'];

(function (window, angular) {
    var newInstantiatedController;

    function NsAnalyticsProvider() {
        var config = {delay: 1000};
        var ALL_SCOPE_REGEX = /{{\$scope\..*?}}/g,
            SCOPE_REPLACE_REGEX = /({{\$scope\.|}})/g,
            ALL_CONTROLLER_REGEX = /{{\$controller\..*?}}/g,
            CONTROLLER_REPLACE_REGEX = /({{\$controller\.|}})/g,
            ALL_ARGS_REGEX = /{{arguments\[\d\]}}/g,
            INJECTED_VALUES_REGEX = /{{[^\s]+?#[^\s]+?}}/g,
            SCOPE_CONDITION_REGEX = /\$scope\.[^=<>\s&\|\(\)\!\%\+\-\*\\]*/g,
            CONTROLLER_CONDITION_REGEX = /\$controller\.[^=<>\s&\|\(\)\!\%\+\-\*\\]*/g,
            INJECTABLE_CONDITION_REGEX = /[^=<>\s&\|\(\)\!\%\+\-\*\\]*?#[^=<>\s&\|\(\)\!\%\+\-\*\\]*/g;

        this.config = function (options) {
            if (options && typeof options === 'object' && options.callBack) {
                config = _.merge(config, options);
            } else {
                throw "nsAnalytics needs a config object with a callback defined as a single function or an array.";
            }

            config.baseOptions = options.baseOptions;
        };

        this.$get = ['$injector', '$rootScope', 'nsControllers', '$parse',
            function ($injector, $rootScope, nsControllers, $parse) {
                var CONTROLLER_DESIGNATION = '$controller',
                    SCOPE_DESIGNATION = '$scope',
                    DESIGNATION_TO_PROPERTIES = {'$controller': 'instance', '$scope': 'scope'},
                    hashedTrackingStrings = {};

                function _properValFormat(val) {
                    if (_.isUndefined(val)) {
                        return 'undefined';
                    } else if (_.isNull(val)) {
                        return 'null';
                    }
                    else if (_.isBoolean(val) ||
                        (_.isNumber(parseInt(val)) && !_.isNaN(parseInt(val)))) {
                        return val;
                    } else {
                        return "'" + val + "'";
                    }
                }

                function _passesCondition(item, condition) {
                    if (!Neosavvy.Core.Utils.StringUtils.isBlank(condition)) {
                        condition = condition.replace(SCOPE_CONDITION_REGEX,function (match) {
                                return _properValFormat(Neosavvy.Core.Utils.MapUtils.highPerformanceGet(item.scope, match.replace('$scope.', '')));
                            }).replace(CONTROLLER_CONDITION_REGEX,function (match) {
                                return _properValFormat(Neosavvy.Core.Utils.MapUtils.highPerformanceGet(item.instance, match.replace('$controller.', '')));
                            }).replace(INJECTABLE_CONDITION_REGEX, function (match) {
                                var ar = match.split("#");
                                return _properValFormat(Neosavvy.Core.Utils.MapUtils.highPerformanceGet($injector.get(ar[0]), ar[1]));
                            });

                        return $parse(condition)();
                    }
                    return true;
                }

                function _track(item, uniqueId, parentArguments, log) {
                    //Name, Options: $scope, $controller, and arguments[x] variables
                    var tracking = hashedTrackingStrings[uniqueId].hashString;
                    if (_passesCondition(item, hashedTrackingStrings[uniqueId].condition)) {
                        if (hashedTrackingStrings[uniqueId].hasScopeVars) {
                            tracking = tracking.replace(ALL_SCOPE_REGEX, function (match) {
                                return Neosavvy.Core.Utils.MapUtils.highPerformanceGet(item.scope, match.replace(SCOPE_REPLACE_REGEX, ""));
                            });
                        }
                        if (hashedTrackingStrings[uniqueId].hasControllerVars) {
                            tracking = tracking.replace(ALL_CONTROLLER_REGEX, function (match) {
                                return Neosavvy.Core.Utils.MapUtils.highPerformanceGet(item.instance, match.replace(CONTROLLER_REPLACE_REGEX, ""));
                            });
                        }
                        if (hashedTrackingStrings[uniqueId].hasArgumentsVars) {
                            tracking = tracking.replace(ALL_ARGS_REGEX, function (match) {
                                return parentArguments[parseInt(match.match(/\d/)[0])];
                            });
                        }
                        if (hashedTrackingStrings[uniqueId].hasInjectedVars) {
                            tracking = tracking.replace(INJECTED_VALUES_REGEX, function (match) {
                                var ar = match.replace(/{{|}}/g, "").split("#");
                                return Neosavvy.Core.Utils.MapUtils.highPerformanceGet($injector.get(ar[0]), ar[1]);
                            });
                        }
                        tracking = JSON.parse(tracking);

                        if (config.callBack) {
                            if (config.baseOptions) {
                                tracking.options = _.merge(config.baseOptions, tracking.options);
                            }

                            if (_.isArray(config.callBack)) {
                                for (var i = 0; i < config.callBack.length; i++) {
                                    config.callBack[i](tracking.name, tracking.options);
                                }
                            } else {
                                config.callBack(tracking.name, tracking.options);
                            }
                        }

                        if (log) {
                            log.push(JSON.stringify({name: tracking.name, options: tracking.options}));
                        }
                    }
                }

                function _chooseTrackingDelay(item, tracking, parentArguments, delay, log) {
                    if (delay <= 0) {
                        _track(item, tracking, parentArguments, log);
                    } else {
                        setTimeout(function () {
                            _track(item, tracking, parentArguments, log);
                        }, delay);
                    }
                }

                function _cacheTrackingAndReturnUid(hash) {
                    var uniqueId = uuid.v1();
                    var hashString = JSON.stringify(hash);
                    var injectedMatch = hashString.match(INJECTED_VALUES_REGEX);
                    hashedTrackingStrings[uniqueId] = {hashString: hashString,
                        hasScopeVars: hashString.indexOf("{{$scope.") !== -1,
                        hasControllerVars: hashString.indexOf("{{$controller") !== -1,
                        hasArgumentsVars: hashString.indexOf("{arguments[") !== -1,
                        hasInjectedVars: (injectedMatch && injectedMatch.length),
                        condition: hash["condition"]
                    };
                    return uniqueId;
                }

                function _createFn(item, copy, uniqueId, delay, log) {
                    var fn = function () {
                        copy.apply(copy, arguments);
                        _chooseTrackingDelay(item, uniqueId, arguments, delay, log);
                    };
                    fn.toString = function() {
                        return copy.toString();
                    };
                    return fn;
                }

                function _applyMethodTracking(item, designation, methods, delay, log) {
                    if (item && methods) {
                        var particularItem = item[DESIGNATION_TO_PROPERTIES[designation]];
                        if (particularItem) {
                            for (var thing in particularItem) {
                                //Methods
                                if (methods[thing] && typeof particularItem[thing] === 'function' && thing !== 'constructor') {
                                    var uniqueId = _cacheTrackingAndReturnUid(methods[thing]);
                                    particularItem[thing] = _createFn(item, particularItem[thing], uniqueId, delay, log);
                                }
                            }
                        }
                    }
                }

                function _applyWatcherTracking(item, designation, watches, delay, log) {
                    if (item && watches) {
                        var scope = item[DESIGNATION_TO_PROPERTIES[designation]];
                        if (scope) {
                            if (scope && scope.$$watchers && scope.$$watchers.length) {
                                _.forEach(scope.$$watchers, function (watcher) {
                                    if (watches[watcher.exp]) {
                                        var uniqueId = _cacheTrackingAndReturnUid(watches[watcher.exp]);
                                        watcher.fn = _createFn(item, watcher.fn, uniqueId, delay, log);
                                    }
                                });
                            }
                        }
                    }
                }

                function _applyEventTracking(item, designation, listeners, delay, log) {
                    if (item && listeners) {
                        var scope = item[DESIGNATION_TO_PROPERTIES[designation]];
                        if (scope && scope.$$listeners) {
                            for (var eventStack in scope.$$listeners) {
                                if (listeners[eventStack] && scope.$$listeners[eventStack].length) {
                                    var uniqueId = _cacheTrackingAndReturnUid(listeners[eventStack]);
                                    for (var i = 0; i < scope.$$listeners[eventStack].length; i++) {
                                        scope.$$listeners[eventStack][i] = _createFn(item, scope.$$listeners[eventStack][i], uniqueId, delay, log);
                                    }
                                }
                            }
                        }
                    }
                }

                function _applyAllTracking(item, methods, watches, listeners, delay, log) {
                    //Watchers and listeners cannot be applied to a controller instance
                    _applyMethodTracking(item, CONTROLLER_DESIGNATION, methods, delay, log);
                    //Watchers and listeners can be applied to a controller scope
                    _applyMethodTracking(item, SCOPE_DESIGNATION, methods, delay, log);
                    _applyWatcherTracking(item, SCOPE_DESIGNATION, watches, delay, log);
                    _applyEventTracking(item, SCOPE_DESIGNATION, listeners, delay, log);
                }

                var instantiatedAnalytics = {};

                function nsAnalytics(injectedName, methods, watches, listeners, delay, log) {
                    var myControllers;
                    try {
                        myControllers = nsControllers.get(injectedName);
                    } catch (e) {
                        //No controllers instantiated yet
                    }
                    delay = delay || delay === 0 ? delay : config.delay;
                    if (newInstantiatedController) {
                        if (instantiatedAnalytics[injectedName] && instantiatedAnalytics[injectedName].length) {
                            for (var i = 0; i < instantiatedAnalytics[injectedName].length; i++) {
                                var args = instantiatedAnalytics[injectedName][i];
                                _applyAllTracking(newInstantiatedController, args.methods, args.watches, args.listeners, args.delay, args.log);
                            }
                        }
                    }
                    else if (myControllers && myControllers.length) {
                        for (var i = 0; i < myControllers.length; i++) {
                            _applyAllTracking(myControllers[i], methods, watches, listeners, delay, log);
                        }
                    }

                    //Store as instantiated
                    if (methods || watches || listeners) {
                        //Newly instantiated controllers, getting them up to speed
                        instantiatedAnalytics[injectedName] = instantiatedAnalytics[injectedName] || [];
                        instantiatedAnalytics[injectedName].push({methods: methods, watches: watches, listeners: listeners, delay: delay, log: log});
                    }
                }

                //Always clear this out after a run
                newInstantiatedController = null;

                return nsAnalytics;
            }];
    }

    function ngControllerDirective(nsAnalytics) {
        var CNTRL_REG = /^(\S+)(\s+as\s+(\w+))?$/;
        return {
            scope: false,
            priority: -200,
            require: 'ngController',
            link: function (scope, element, attrs, ctrl) {
                //matches[1] is the controller name matches[3] is the name in the DOM
                var matches = attrs.ngController.match(CNTRL_REG);
                var name = matches[1];

                //Get the new controller up to speed
                newInstantiatedController = {scope: scope, instance: ctrl};
                nsAnalytics(name);
                newInstantiatedController = null;
            }
        }
    }

    angular.module('neosavvy.angularcore.analytics').provider('nsAnalytics', NsAnalyticsProvider);
    angular.module('neosavvy.angularcore.analytics').directive('ngController', ['nsAnalytics', ngControllerDirective]);
})(window, window.angular);
(function (window, angular) {
    var controllers = {};
    var newInstantiatedController = null;

    function ngControllerDirective(nsAnalytics) {
        var CNTRL_REG = /^(\S+)(\s+as\s+(\w+))?$/;
        return {
            scope: false,
            priority: -100,
            require: 'ngController',
            link: function (scope, element, attrs, ctrl) {
                //matches[1] is the controller name matches[3] is the name in the DOM
                var matches = attrs.ngController.match(CNTRL_REG);
                var name = matches[1];
                controllers[name] = controllers[name] || [];
                controllers[name].push({id: (attrs.id || undefined), name: name, scope: scope, instance: ctrl});

                //Get the new controller up to speed
                newInstantiatedController = controllers[name][controllers[name].length - 1];
                //nsAnalytics(name);
            }
        }
    }

    function nsControllersFactory() {
        return {
            get: function (name) {
                if (!Neosavvy.Core.Utils.StringUtils.isBlank(name)) {
                    if (controllers[name] && controllers[name].length) {
                        return controllers[name];
                    } else {
                        throw "No controllers have been instantiated with this name. Either you have a type or race condition.";
                    }
                } else {
                    return controllers;
                }
            },
            getById: function (name, id) {
                if (controllers[name] && controllers[name].length) {
                    var item = Neosavvy.Core.Utils.CollectionUtils.itemByProperty(controllers[name], "id", id);
                    if (item) {
                        return item;
                    } else {
                        throw "A controller with that dom based ID does not exist, check your spelling or initialization.";
                    }
                } else {
                    throw "No controllers have been instantiated with this name. Either you have a type or race condition.";
                }
            },
            getByScope: function(scope) {
                if (scope) {
                    var item;
                    var id = _.isString(scope) ? scope : scope.$id;
                    for (var i = 0; i < _.values(controllers).length; i++) {
                        var myControllers = _.values(controllers)[i];
                        item = Neosavvy.Core.Utils.CollectionUtils.itemByProperty(myControllers, "scope.$id", id);
                        if (item) {
                            break;
                        }
                    }
                    if (item) {
                        return item;
                    } else {
                        throw "No controller instance was found for the passed in scope or hashKey.";
                    }
                } else {
                    throw "You have passed in an empty scope or $$hashKey for a scope.";
                }
            },
            getLast: function() {
                return newInstantiatedController;
            }
        };
    }

    angular.module('neosavvy.angularcore.controllers').factory('nsControllers', nsControllersFactory);
    angular.module('neosavvy.angularcore.controllers').directive('ngController', ['nsAnalytics', ngControllerDirective]);

    //Clears out controllers for testing and app reloads.
    angular.module('neosavvy.angularcore.controllers').config(function() {
        controllers = {};
    });
})(window, window.angular);
Neosavvy.AngularCore.Directives
    .directive('nsInlineHtml',
        ['$compile',
            function ($compile) {
                return {
                    restrict:'E',
                    template:'<div></div>',
                    replace:true,
                    scope:false,
                    link:function (scope, element, attrs) {
                        if (!attrs.hasOwnProperty('value')) {
                            throw 'You must provide an html value on the scope in order to bind inline html!';
                        } else {
                            var dereg = attrs.$observe('value', function (val) {
                              if (val) {
                                  var thing = $compile(element.replaceWith(val))(scope);
                                  dereg();
                              }
                            });
                        }
                    }
                }
            }]);

Neosavvy.AngularCore.Directives.directive('nsModal', [
    'nsModal',
    function (nsModalService) {
        return {
            restrict: 'E',
            transclude: 'element',
            replace: true,
            scope: false,
            compile: function (tElem, tAttr, transclude) {
                return function (scope, elem, attr) {
                    var childScope = scope.$new();

                    if (typeof attr.open !== 'string') {
                        throw 'an open handler was not specified';
                    }

                    // close modal on route change
                    scope.$on('$routeChangeStart', function (e) {
                        nsModalService.close();
                    });

                    var closeCallback = scope[attr.callback] || angular.noop;

                    scope[attr.open] = function () {
                        transclude(childScope, function (clone) {
                            nsModalService.open(childScope, clone, closeCallback);
                        });
                    };

                    scope[attr.close] = function () {
                        nsModalService.close();
                    };
                }
            }
        }
    }
]);


Neosavvy.AngularCore.Directives
    .directive('nsStaticInclude',
    ['$http', '$templateCache', '$compile',
        function ($http, $templateCache, $compile) {
            return {
                restrict:'E',
                template:'<div></div>',
                replace:true,
                scope:false,
                compile:function (tElement, tAttrs) {
                    if (_.isEmpty(tAttrs.src)) {
                        throw "You must pass in a source to render a Neosavvy static include directive.";
                    }

                    var waitFor = tAttrs.waitFor,
                        watchWaitFor = tAttrs.watchWaitFor,
                        waitForRender = tAttrs.waitForRender,
                        watchWaitForRender = tAttrs.watchWaitForRender;

                    //If there are no 'waiting' indicators, warm up the cache, by requesting the template
                    if (_.isEmpty(waitFor) && _.isEmpty(watchWaitFor)) {
                        $http.get(tAttrs.src, {cache:$templateCache});
                        if (!_.isEmpty(watchWaitForRender)) {
                            watchWaitFor = watchWaitForRender;
                        } else if (!_.isEmpty(waitForRender)) {
                            waitFor = waitForRender;
                        }
                    }

                    //Return link function
                    return function (scope, element, attrs) {
                        var replace = function (result) {
                            element.replaceWith($compile(angular.element(result.data))(scope));
                        };
                        var dereg, request = function (val) {
                            $http.get(attrs.src, {cache:$templateCache}).then(replace);
                            if (dereg) {
                                dereg();
                            }
                        };

                        if (!_.isEmpty(watchWaitFor)) {
                            dereg = scope.$watch(watchWaitFor, function(val) {
                                 if(angular.isDefined(val)) {
                                      request();
                                 }
                                 
                            });
                        }
                        else if (!_.isEmpty(waitFor) && parseFloat(waitFor) > 0) {
                            setTimeout(request, parseFloat(waitFor));
                        } else {
                            request();
                        }

                    };
                }
            }
        }]);

Neosavvy.AngularCore.Directives
    .directive('nsSerialize', ['$injector',
        function ($injector) {
            return {
                restrict: 'EA',
                scope: false,
                link: function (scope, element, attrs) {
                    if (attrs.data === undefined) {
                        throw "You must provide a data attribute for the nsSerialize directive!";
                    }
                    if (attrs.property === undefined) {
                        throw "nsSerialize requires a property to place the data into!";
                    }
                    var data = JSON.parse(attrs.data);
                    var item = attrs.inject ? $injector.get(attrs.inject) : scope;
                    var property = Neosavvy.Core.Utils.MapUtils.highPerformanceGet(item, attrs.property.replace(/\(.*\)/g, ""));
                    if (typeof property === 'function') {
                        property.call(property, data);
                    } else {
                        Neosavvy.Core.Utils.MapUtils.applyTo(item, attrs.property, data);
                    }
                    if (attrs.clean !== "false" && attrs.clean !== "0") {
                        element.removeAttr("data");
                    }
                }
            }
        }]);
Neosavvy.AngularCore.Directives
    .directive('nsEvent', ['$rootScope', function ($rootScope) {
    return {
        restrict:'A',
        scope:false,
        link:function (scope, element, attrs) {
            var nsEvent = attrs.nsEvent.replace(/ /g, '').split(",");
            var bindFirst = (!_.isUndefined(attrs.nsEventHighPriority) ? true : false);
            if (nsEvent.length < 2) {
                throw "Specify an event and handler in order to use the ns-event directive!";
            }

            function matchKey(key) {
                return key.match(/.*?(?=\(|$)/i)[0];
            }

            function findScope(scope, name) {
                if (!_.isUndefined(scope[matchKey(name)])) {
                    return scope;
                } else if (scope.$parent) {
                    return findScope(scope.$parent, name);
                } else {
                    throw "Your handler method has not been found in the scope chain, please add " + name + " to the scope chain!";
                }
            }

            function handler(e) {
                var myScope = findScope(scope, nsEvent[1]);
                myScope.$event = e;
                myScope.$apply(function() {
                    myScope[nsEvent[1]]();
                });
            }

            //Initialize event listeners
            if (nsEvent.length === 2) {
                if (bindFirst) {
                    element.bindFirst(nsEvent[0], handler);
                } else {
                    element.bind(nsEvent[0], handler);
                }
            } else {
                for (var i = 2; i < nsEvent.length; i++) {
                    var selector = $(element).find(nsEvent[i]);
                    if (bindFirst) {
                        selector.bindFirst(nsEvent[0], handler);
                    } else {
                        selector.bind(nsEvent[0], handler);
                    }
                }
            }
        }
    }
}]);

Neosavvy.AngularCore.Directives
    .directive('nsModelOnBlur', function () {
        return {
            restrict:'A',
            require:'ngModel',
            link:function (scope, elm, attr, ngModelCtrl) {
                if (attr.type === 'radio' || attr.type === 'checkbox') return;

                elm.unbind('input').unbind('keydown').unbind('change');
                elm.bind('blur', function () {
                    scope.$apply(function () {
                        ngModelCtrl.$setViewValue(elm.val());
                    });
                });
            }
        };
    });

Neosavvy.AngularCore.Directives
    .directive('nsRequiredIfShown',
    function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    var valid = (!element.is(':visible') || !Neosavvy.Core.Utils.StringUtils.isBlank(viewValue));
                    ctrl.$setValidity('nsRequiredIfShown', valid);
                    return valid ? viewValue : undefined;
                })
            }
        }
    });
Neosavvy.AngularCore.Directives
    .directive('nsZurbCheckbox',
    function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<label for="{{id}}-checkbox" ng-click="_onClick()"><input type="checkbox" ' +
                'id="{{id}}-checkbox" style="display: none;"><span class="custom checkbox">' +
                '</span><span ng-bind="label"></span></label>',
            scope: {
                'label': '@',
                'onClick': '&',
                'value': '=ngModel'
            },
            link: function (scope, element, attrs) {
                //Initialization
                var modifiedOnClick = false
                var $checkbox = element.find('span.checkbox');
                scope.id = attrs.id || uuid.v1();

                //Watchers
                scope.$watch('value', function (val) {
                    if (!modifiedOnClick) {
                        if (val) {
                            if (!$checkbox.hasClass('checked')) {
                                $checkbox.addClass('checked');
                            }
                        } else {
                            $checkbox.removeClass('checked');
                        }
                    }
                    modifiedOnClick = false;
                });

                //Action Handlers
                scope._onClick = function () {
                    //The class will switch after the click method has fired
                    modifiedOnClick = true;
                    scope.value = !$checkbox.hasClass('checked');
                    if (scope.onClick) {
                        scope.onClick({value: scope.value})
                    }
                };
            }
        }
    });
Neosavvy.AngularCore.Filters.filter('nsCollectionFilterProperties', function () {
    return function (collection, property, values) {
        if (collection && values) {
            return collection.filter(function (item) {
                return (values.indexOf(Neosavvy.Core.Utils.MapUtils.get(item, property)) !== -1);
            });
        }
        return collection;
    };
});
Neosavvy.AngularCore.Filters.filter('nsCollectionFilterPropertyContains', function () {
    return function (collection, property, value) {
        if (collection && value) {
            return collection.filter(function (item) {
                return (String(Neosavvy.Core.Utils.MapUtils.get(item, property)).toLowerCase().indexOf(String(value).toLowerCase()) !== -1);
            });
        }
        return collection;
    };
});
Neosavvy.AngularCore.Filters.filter('nsCollectionFilterProperty', function () {
    return function (collection, property, value) {
        if (collection && value) {
            return collection.filter(function (item) {
                return (Neosavvy.Core.Utils.MapUtils.get(item, property) === value);
            });
        }
        return collection;
    };
});
Neosavvy.AngularCore.Filters.filter('nsCollectionNumericExpression', ['$parse', function ($parse) {
    return function (data, expressionsAndIndexes, property) {
        if (data && data.length) {
            if (expressionsAndIndexes && expressionsAndIndexes.length) {
                return data.filter(function (item) {
                    for (var i = 0; i < expressionsAndIndexes.length; i++) {
                        var expressionAndProperty = expressionsAndIndexes[i];
                        var expression = expressionAndProperty.expression;
                        if (!(/</.test(expression)) && !(/>/.test(expression))) {
                            expression = expression.replace(/=/g, "==");
                        }
                        var value = (property ? item[parseInt(expressionAndProperty.index)][property] : item[parseInt(expressionAndProperty.index)]);
                        if (expression && /\d/.test(expression) && !$parse(String(value) + expression)()) {
                            return false;
                        }
                    }
                    return true;
                });
            }
            return data;
        }
        return [];
    };
}]);
Neosavvy.AngularCore.Filters.filter('nsCollectionPage', function () {
    return function (collection, page, count) {
        if (collection && collection.length) {
            if (page !== undefined && count) {
                var start = page * count;
                return collection.slice(start, Math.min(start + count, collection.length));
            }
        } else {
            collection = [];
        }
        return collection;
    };
});
Neosavvy.AngularCore.Filters.filter('nsLogicalIf', function () {
    return function (input, trueValue, falseValue) {
        return input ? trueValue : falseValue;
    };
});
Neosavvy.AngularCore.Filters.filter('nsNumericClamp', function () {
    return function (val, min, max) {
        if (_.isNumber(val)) {
            min = (min || min === 0) ? parseFloat(min) : undefined;
            max = (max || max === 0) ? parseFloat(max) : undefined;
            val = parseFloat(val);
            if (_.isNumber(max) && _.isNumber(min) && max < min) {
                throw "You have created an impossible clamp with this filter.";
            }
            if (min || min === 0) {
                val = Math.max(min, val);
            }
            if (max || max === 0) {
                val = Math.min(max, val);
            }
        }
        return val
    };
});
Neosavvy.AngularCore.Filters.filter("nsTextReplace", function() {
    return function(val) {
        if (!_.isEmpty(val) && arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                val = val.replace(new RegExp(arguments[i], 'g'), "");
            }
        }
        return val;
    };
});

Neosavvy.AngularCore.Filters.filter("nsTruncate", function () {
    return function (val, length) {
        if (!_.isEmpty(val) && length < val.length) {
            val = val.slice(0, length) + "...";
        }
        return val;
    };
});
(function($) {
    var splitVersion = $.fn.jquery.split(".");
    var major = parseInt(splitVersion[0]);
    var minor = parseInt(splitVersion[1]);

    var JQ_LT_17 = (major < 1) || (major == 1 && minor < 7);

    function eventsData($el) {
        return JQ_LT_17 ? $el.data('events') : $._data($el[0]).events;
    }

    function moveHandlerToTop($el, eventName, isDelegated) {
        var data = eventsData($el);
        var events = data[eventName];

        if (!JQ_LT_17) {
            var handler = isDelegated ? events.splice(events.delegateCount - 1, 1)[0] : events.pop();
            events.splice(isDelegated ? 0 : (events.delegateCount || 0), 0, handler);

            return;
        }

        if (isDelegated) {
            data.live.unshift(data.live.pop());
        } else {
            events.unshift(events.pop());
        }
    }

    function moveEventHandlers($elems, eventsString, isDelegate) {
        var events = eventsString.split(/\s+/);
        $elems.each(function() {
            for (var i = 0; i < events.length; ++i) {
                var pureEventName = $.trim(events[i]).match(/[^\.]+/i)[0];
                moveHandlerToTop($(this), pureEventName, isDelegate);
            }
        });
    }

    $.fn.bindFirst = function() {
        var args = $.makeArray(arguments);
        var eventsString = args.shift();

        if (eventsString) {
            $.fn.bind.apply(this, arguments);
            moveEventHandlers(this, eventsString);
        }

        return this;
    };

    $.fn.delegateFirst = function() {
        var args = $.makeArray(arguments);
        var eventsString = args[1];

        if (eventsString) {
            args.splice(0, 2);
            $.fn.delegate.apply(this, arguments);
            moveEventHandlers(this, eventsString, true);
        }

        return this;
    };

    $.fn.liveFirst = function() {
        var args = $.makeArray(arguments);

        // live = delegate to document
        args.unshift(this.selector);
        $.fn.delegateFirst.apply($(document), args);

        return this;
    };

    if (!JQ_LT_17) {
        $.fn.onFirst = function(types, selector) {
            var $el = $(this);
            var isDelegated = typeof selector === 'string';

            $.fn.on.apply($el, arguments);

            // events map
            if (typeof types === 'object') {
                for (var type in types)
                    if (types.hasOwnProperty(type)) {
                        moveEventHandlers($el, type, isDelegated);
                    }
            } else if (typeof types === 'string') {
                moveEventHandlers($el, types, isDelegated);
            }

            return $el;
        };
    }

})(jQuery);

Neosavvy.AngularCore.Services.factory('nsModal', 
    [
        '$compile',
        '$document',
        '$animate',
        '$timeout',
        function($compile, $document, $animate, $timeout) {

    var body = $document.find('body'),
        backdrop,
        overlay,
        callback;

    function open (scope, template, closeCallback) {

        var positionWrapper;

        if (!scope || typeof scope !== 'object') {
            throw 'missing scope parameter';
        }

        if (template) {
            callback = closeCallback || undefined;

            backdrop = $compile(angular.element('<div ng-click="close()" class="modal-backdrop" style="background:rgba(10,10,10, 0.6); position:fixed; top:0px;right:0px;left:0px;bottom:0px;"></div>'))(scope);

            // add the inner modal-position wrapper in order to center dynamically sized modals
            positionWrapper = angular.element('<div class="modal-position"></div>');

            // accept angular.element objects and template URLs
            if (typeof template === 'object') {
                positionWrapper.append(template);
            } else if (typeof template === 'string') {
                var cTemplate = $compile(angular.element('<ng-include src="\'' + template + '\' "></ng-include>'))(scope);
                positionWrapper.append(cTemplate);
            } else {
                throw "template parameter must be of type object or string";
            }

            overlay = $compile(angular.element('<div class="modal-overlay" ng-class="modalOverlayClass"></div>'))(scope);
            overlay.append(positionWrapper);

            scope.close = close;

            $timeout(function () {
                scope.$apply(function () {
                    body.append(backdrop);
                    body.append(overlay);
                });
            }, 0);

        } else {
            throw 'missing template parameter';
        }
    };

    function close () {
        if (overlay) {
            $animate.leave(overlay, function () {
                backdrop.remove();
            });

            if (typeof callback === 'function') {
                callback();
            }
        }
    };

    return {

        /**
         * @ngdoc method
         * @name neosavvy.angularcore.services.services:nsModal#open
         * @methodOf neosavvy.angularcore.services.services:nsModal
         *
         * @description
         * Calling nsModal.open will open a modal on the screen. 
         *
         * @param {Object} scope (required) the scope to use inside the modal. can pass in $scope.$new() for new child scope.
         * @param {String|Object} template (required) the location of the template to include in the modal OR an angular.element to include
         * @param {Function} closeCallback (optional) a function call when the modal closes
         */
        open: open,

        /**
         * @ngdoc method
         * @name neosavvy.angularcore.services.services:nsModal#close
         * @methodOf neosavvy.angularcore.services.services:nsModal
         *
         * @description
         * Calling nsModal.close will close all open modals
         *
         */
        close: close
    }
}]);

Neosavvy.AngularCore.Services.factory('nsServiceExtensions',
    ['$q', '$http',
        function ($q, $http) {
            /**
             * Parse headers into key value object
             *
             * @param {string} headers Raw headers as a string
             * @returns {Object} Parsed headers as key value object
             */
            function parseHeaders(headers) {
                var parsed = {}, key, val, i;

                if (!headers) return parsed;

                _.forEach(headers.split('\n'), function (line) {
                    i = line.indexOf(':');
                    key = _.lowercase(_.trim(line.substr(0, i)));
                    val = _.trim(line.substr(i + 1));

                    if (key) {
                        if (parsed[key]) {
                            parsed[key] += ', ' + val;
                        } else {
                            parsed[key] = val;
                        }
                    }
                });

                return parsed;
            }

            function getFromCache(params) {
                if (params.cache && params.method === 'GET') {
                    var cached = params.cache.get(params.url);
                    if (cached && cached.length) {
                        return cached;
                    }
                }
                return undefined;
            }

            function storeInCache(params, status, response, headers) {
                if (params.cache && params.method === 'GET') {
                    params.cache.put(params.url, [status, response, parseHeaders(headers)]);
                }
            }

            return {
                /**
                 * @ngdoc method
                 * @name neosavvy.angularcore.services.services:nsServiceExtensions#request
                 * @methodOf neosavvy.angularcore.services.services:nsServiceExtensions
                 *
                 * @description
                 * The standard $http request method helper with error handling, transformers, and added response handlers.
                 *
                 * @param {Object} parameters all service parameters
                 * @param {Function} additionalSuccess additional success method
                 * @param {function} additionalError additonal error method
                 * @returns {Promise} $q promise object
                 */
                request: function (params, additionalSuccess, additionalError) {
                    if (!params.method) {
                        throw "You must provide a method for each service request.";
                    }
                    if (!params.url) {
                        throw "You must provide a url for each service request.";
                    }

                    var deferred = $q.defer();
                    $http(params).
                        success(function (data, status, headers, config) {
                            deferred.resolve(data);
                            if (additionalSuccess) {
                                additionalSuccess(data);
                            }
                        }).
                        error(function (data, status, headers, config) {
                            deferred.reject(data);
                            if (additionalError) {
                                additionalError(data);
                            }
                        });

                    return deferred.promise;
                },
                /**
                 * @ngdoc method
                 * @name neosavvy.angularcore.services.services:nsServiceExtensions#xhr
                 * @methodOf neosavvy.angularcore.services.services:nsServiceExtensions
                 *
                 * @description
                 * The native XHR request method helper with error handling, transformers, and added response handlers.
                 *
                 * @param {Object} params all service params
                 * @returns {Promise} Q promise object
                 */
                xhr: function (params) {
                    if (!params.method) {
                        throw "You must provide a method for each service request.";
                    }
                    if (!params.url) {
                        throw "You must provide a url for each service request.";
                    }

                    // use Q by default, use angular $q if specified
                    var deferred = (params.$q) ? $q.defer() : Q.defer();

                    var cached = getFromCache(params);
                    if (cached) {
                        //cached[0] is status, cached[1] is response, cached[2] is headers
                        deferred.resolve(cached[1]);
                    } else {
                        var xhr = new XMLHttpRequest();
                        xhr.onreadystatechange = function () {
                            if (xhr.readyState === 4) {
                                var resp = xhr.responseText;
                                if (xhr.status === 200) {
                                    storeInCache(params, xhr.status, resp, xhr.getAllResponseHeaders());

                                    if (params.transformResponse) {
                                        resp = params.transformResponse(resp);
                                    } else if (xhr.getResponseHeader("Content-Type") === "application/json") {
                                        resp = JSON.parse(resp);
                                    }

                                    deferred.resolve(resp, xhr.status, xhr.getAllResponseHeaders());
                                } else {
                                    deferred.reject(resp, xhr.status, xhr.getAllResponseHeaders());
                                }
                            }
                        };

                        xhr.onerror = function () {
                            deferred.reject(xhr, xhr.status, xhr.getAllResponseHeaders());
                        };

                        var data = params.data;
                        if (data) {
                            if (params.transformRequest) {
                                data = params.transformRequest(data);
                            } else if (!_.isString(data)) {
                                data = JSON.stringify(data);
                            }
                        }

                        xhr.withCredentials = params.cors || false;
                        xhr.open(params.method, params.url, true);
                        xhr.send(data);
                    }

                    return deferred.promise;
                },
                /**
                 * @ngdoc method
                 * @name neosavvy.angularcore.services.services:nsServiceExtensions#jqRequest
                 * @methodOf neosavvy.angularcore.services.services:nsServiceExtensions
                 *
                 * @description
                 * ThejQuery xDomain supporting request method helper with error handling, transformers, and added response handlers.
                 *
                 * @param {Object} params all service params
                 * @returns {Promise} Q promise object
                 */
                jqRequest: function(params) {
                    if (!params.method) {
                        throw "You must provide a method for each service request.";
                    }
                    if (!params.url) {
                        throw "You must provide a url for each service request.";
                    }

                    //use Angular $q by default, big Q if specified
                    var deferred = (params.q) ? Q.defer() : $q.defer();

                    var cached = getFromCache(params);
                    if (cached) {
                        //cached[0] is status, cached[1] is response, cached[2] is headers
                        deferred.resolve(cached[1]);
                    } else {
                        var request = {type: params.method, url: params.url};
                        if (params.data) {
                            request.data = params.transformRequest ? params.transformRequest(params.data) : params.data;
                        }
                        if (params.ajax) {
                            request = _.merge(request, params.ajax);
                        }
                        var jqXhr = $.ajax(request);
                        jqXhr.done(function (data) {
                                if (params.transformResponse) {
                                    //responseJSON for IE9 compatibility
                                    data = params.transformResponse(
                                        jqXhr.responseText || JSON.stringify(jqXhr.responseJSON));
                                }
                                deferred.resolve(data);
                            })
                            .fail(function(data) {
                                deferred.reject(data);
                            });
                    }

                    return deferred.promise;
                }
            };
        }]);
