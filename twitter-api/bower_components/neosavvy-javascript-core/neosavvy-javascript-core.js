/*! neosavvy-javascript-core - v0.0.5 - 2013-12-11
* Copyright (c) 2013 Neosavvy, Inc.; Licensed  */
var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Builders = Neosavvy.Core.Builders || {};

/**
 * @class Neosavvy.Core.Builders.Collection
 * @constructor
 **/
Neosavvy.Core.Builders.CollectionBuilder = function (collection) {
    if (collection) {
        this.operations = {};
        this.collection = collection;
    } else {
        throw "You must pass in a collection as the base upon which to build!";
    }
};
Neosavvy.Core.Builders.CollectionBuilder.prototype = {
    /**
     * Operates on the collection to nest each item down to the level of the property string specified
     * @param {String} propertyString
     * @returns Neosavvy.Core.Builders.Collection
     * @method nest
     **/
    nest: function (propertyString) {
        if (!_.isEmpty(propertyString)) {
            this.operations.nest = propertyString;
        } else {
            throw "You must pass a valid propertyString to nest a collection.";
        }
        return this;
    },
    /**
     * Returns the output of all the operations on the builder. If none specified, returns the base collection.
     * @returns Array
     * @method build
     **/
    build: function () {
        if (_.keys(this.operations).length) {
            //Nest
            var nest = function (item, propertyString) {
                var ar = propertyString.split(".");
                while (ar.length) {
                    var tempObj = {};
                    tempObj[ar.pop()] = item;
                    item = tempObj;
                }
                return item;
            };
            return _.map(this.collection, function (item) {
                if (this.operations.nest) {
                    item = nest(item, this.operations.nest);
                }
                return item;
            }, this);
        }
        return this.collection;
    }
};
var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Builders = Neosavvy.Core.Builders || {};

/**
 * @class Neosavvy.Core.Utils.RequestUrlBuilder
 * @constructor
 **/
Neosavvy.Core.Builders.RequestUrlBuilder = function (baseUrl) {
    if (!baseUrl) {
        throw "You must provide a base url for every request url built.";
    }
    this.keyValues = {};
    this.replacements = {};
    this.baseUrl = baseUrl;
};
Neosavvy.Core.Builders.RequestUrlBuilder.prototype = {
    /**
     * Adds a url parameter style param (key=value) to the url being built. Pass in either a key value pair, or an object with one or many key values.
     * @param {String|Object} key
     * @param {String} value
     * @returns Neosavvy.Core.Builders.RequestUrlBuilder
     * @method addParam
     **/
    addParam: function (key, value) {
        if (typeof(key) === 'object') {
            if (Neosavvy.Core.Utils.MapUtils.keysDistinct(this.keyValues, key)) {
                this.keyValues = _.merge(this.keyValues, key);
            } else {
                throw "You have passed overlapping keys for object arguments."
            }
        } else if (key && value) {
            this.keyValues = this.keyValues || {};
            if (this.keyValues[key] === undefined) {
                this.keyValues[key] = value;
            } else {
                throw "You have attempted to overwrite an existing key value in the request url.";
            }
        }
        else {
            throw "You must provide either a keyValue object, or a key value as arguments.";
        }
        return this;
    },
    /**
     * Replaces a key in the url with the value specified. Pass in a key value pair as separate arguments or an object with one or many key value pairs defined.
     * @param {String|Object} key
     * @param {String} value
     * @returns Neosavvy.Core.Builders.RequestUrlBuilder
     * @method paramReplace
     **/
    paramReplace: function (key, value) {
        if (typeof(key) === 'object') {
            if (Neosavvy.Core.Utils.MapUtils.keysDistinct(this.replacements, key)) {
                this.replacements = _.merge(this.replacements, key);
            } else {
                throw "You have passed overlapping keys for object arguments."
            }
        } else if (key && value) {
            this.replacements = this.replacements || {};
            if (this.replacements[key] === undefined) {
                this.replacements[key] = value;
            } else {
                throw "You have attempted to overwrite an existing key value in the request url.";
            }
        }
        else {
            throw "You must provide either a keyValue object, or a key value as arguments.";
        }
        return this;
    },
    /**
     * Runs all the operations specified and generates the appropriate request url output.
     * @returns String
     * @method build
     **/
    build: function () {
        if (this.replacements) {
            for (var key in this.replacements) {
                this.baseUrl = this.baseUrl.replace(new RegExp(key, "g"), String(this.replacements[key]))
            }
        }
        if (this.keyValues) {
            var count = 0;
            for (var key in this.keyValues) {
                if (count === 0) {
                    this.baseUrl += "?";
                } else {
                    this.baseUrl += "&";
                }
                this.baseUrl += key + "=" + String(this.keyValues[key]);
                count++;
            }
        }
        return this.baseUrl;
    }
};

var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Builders = Neosavvy.Core.Builders || {};

/**
 * @class Neosavvy.Core.Builders.StringBuilder
 * @constructor
 **/
Neosavvy.Core.Builders.StringBuilder = function (input) {
    //Nothing defined here yet
    if (input) {
        this.input = input;
        this.output = input;
    } else {
        throw "Do not try to build a string with no input, it is pointless.";
    }
};

Neosavvy.Core.Builders.StringBuilder.prototype = {
    /**
     * Converts any camel case in a string to dash case: myNameMike >> my-name-mike.
     * @returns Neosavvy.Core.Builders.StringBuilder
     * @method camelToDash
     **/
    camelToDash: function () {
        this.output = this.output.replace(/\W+/g, '-')
            .replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
        return this;
    },
    /**
     * Changes a standard constant syntax to standard dash syntax: MY_NAME_MIKE >> my-name-mike.
     * @returns Neosavvy.Core.Builders.StringBuilder
     * @method constantToDash
     **/
    constantToDash: function () {
        this.output = this.output.replace(/_/g, '-').toLowerCase();
        return this;
    },
    /**
     * Changes the string to proper case, first letters of words capitalized.
     * @returns Neosavvy.Core.Builders.StringBuilder
     * @method properCase
     **/
    properCase: function () {
        this.output = this.output.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        return this;
    },
    /**
     * Runs all the operations specified for the builder.
     * @returns String
     * @method build
     **/
    build: function () {
        return this.output;
    }
};

(function (global) {
    "use strict";
    /**
     * Memoize caches input output functions return values. Just alter the function by passing it into memoize, and you have the cached version.
     * @method memoize
     * @param {Function} func
     * @returns Function
     *
     **/
    global.memoize || (global.memoize = (typeof JSON === 'object' && typeof JSON.stringify === 'function' ?
        function (func) {
            var stringifyJson = JSON.stringify,
                cache = {};

            var cachedfun = function () {
                var hash = stringifyJson(arguments);
                return (hash in cache) ? cache[hash] : cache[hash] = func.apply(this, arguments);
            };
            cachedfun.__cache = (function(){
                cache.remove || (cache.remove = function(){
                    var hash = stringifyJson(arguments);
                    return (delete cache[hash]);
                });
                return cache;
            }).call(this);
            return cachedfun;
        } : function (func) {
        return func;
    }));
}(this));

(function (window, _) {
    if (_ && memoize) {
        window._cached = window._cached || {};
        for (var fn in _) {
            //No need to re-cache the memoization function in Lodash
            if (fn !== "memoize") {
                window._cached[fn] = memoize(_[fn]);
            }
        }
    } else {
        throw "Either Lodash or global memoize has not been loaded within this application. Please load these files before cached-lodash.js";
    }
})(window, window._);
var Neosavvy = Neosavvy || {};

/**
 * @class Neosavvy.Core
 * @static
 **/
Neosavvy.Core = Neosavvy.Core || {};

/**
 * @class Neosavvy.Core.Utils
 * @static
 **/
Neosavvy.Core.Utils = Neosavvy.Core.Utils || {};

/**
 * @class Neosavvy.Core.Builders
 * @static
 **/
Neosavvy.Core.Builders = Neosavvy.Core.Builders || {};


var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Utils = Neosavvy.Core.Utils || {};

/**
 * @class Neosavvy.Core.Utils.CollectionUtils
 * @static
 **/
Neosavvy.Core.Utils.CollectionUtils = (function () {
    return {
        /**
         * does a thing...
         * @param {type} name
         * @returns type
         * @method itemByProperty
         **/
        itemByProperty: function (collection, property, value) {
            if (collection && collection.length && value) {
                for (var i = 0; i < collection.length; i++) {
                    var found = Neosavvy.Core.Utils.MapUtils.get(collection[i], property);
                    if (found === value) {
                        return collection[i];
                    }
                }
            }
            return null;
        },
        /**
         * does a thing...
         * @param {type} name
         * @returns type
         * @method updateByProperty
         **/
        updateByProperty: function (collection, item, propertyName) {
            if (collection && collection.length && item && item[propertyName] && propertyName) {
                for (var i = 0; i < collection.length; i++) {
                    if (collection[i] != undefined && collection[i] != null && collection[i][propertyName] === item[propertyName]) {
                        collection[i] = item;
                        break;
                    }
                }
            }
        },
        /**
         * does a thing...
         * @param {type} name
         * @returns type
         * @method removeByProperty
         **/
        removeByProperty: function (collection, item, propertyName) {
            if (collection && collection.length && item && item[propertyName] && propertyName) {
                for (var i = 0; i < collection.length; i++) {
                    if (collection[i] != undefined && collection[i] != null && collection[i][propertyName] === item[propertyName]) {
                        collection.splice(i, 1);
                        break;
                    }
                }
            }
        },
        /**
         * does a thing...
         * @param {type} name
         * @returns type
         * @method uniqueMap
         **/
        uniqueMap: function (collection, properties) {
            var map = {};
            if (collection && collection.length) {
                for (var i = 0; i < collection.length; i++) {
                    map[String(Neosavvy.Core.Utils.MapUtils.get(collection[i], properties))] = collection[i];
                }
            }
            return map;
        },
        /**
         * Returns true if two collections contain at least one match by a property value, ie a.id === b.id.
         * @param {Array} collectionA
         * @param {Array} collectionB
         * @param {String} propertyName
         * @returns Boolean
         * @method containMatchByProperty
         **/
        containMatchByProperty: function (collectionA, collectionB, propertyName) {
            if (collectionA && collectionB && collectionA.length && collectionB.length) {
                var compare = collectionB.map(function (item) {
                    return Neosavvy.Core.Utils.MapUtils.get(item, propertyName);
                });

                var item;
                for (var i = 0; i < collectionA.length; i++) {
                    item = Neosavvy.Core.Utils.MapUtils.get(collectionA[i], propertyName);
                    if (item !== undefined &&
                        compare.indexOf(item) !== -1) {
                        return true;
                    }
                }
            }
            return false;
        },
        /**
         * Matches the containing of an exclusive set of items by property. Supports deep properties as well.
         * @param {Array} collection
         * @param {Array} otherItems
         * @param {String} propertyName
         * @returns Boolean
         * @method collectionContainsAllOtherItems
         **/
        collectionContainsAllOtherItems: function (collection, otherItems, propertyName) {
            if (collection && collection.length && otherItems && otherItems.length) {
                var collectionProperties = collection.map(function (item) {
                    return Neosavvy.Core.Utils.MapUtils.get(item, propertyName);
                });

                var item;
                for (var i = 0; i < otherItems.length; i++) {
                    item = typeof otherItems[i] === 'object' ? Neosavvy.Core.Utils.MapUtils.get(otherItems[i], propertyName) : undefined;
                    if (item === undefined && collectionProperties.indexOf(item) === -1) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        },
        /**
         * Returns true for an exclusive contents but not order match of collections.
         * @param {Array} collection
         * @param {Array} compare
         * @returns Boolean
         * @method containsExclusively
         **/
        containsExclusively: function (collection, compare) {
            if (collection && compare) {
                for (var i = 0; i < collection.length; i++) {
                    if (compare.indexOf(collection[i]) === -1) {
                        return false;
                    }
                }
                for (var i = 0; i < compare.length; i++) {
                    if (collection.indexOf(compare[i]) === -1) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
    };
})();

var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Utils = Neosavvy.Core.Utils || {};

/**
 * @class Neosavvy.Core.Utils.DomUtils
 * @static
 **/
Neosavvy.Core.Utils.DomUtils = (function () {
    return {
        /**
         * returns an array of DOM elements that contain the passed
         * in attribute matching value
         * @param {string} tagName
         * @param {string} attr
         * @param {string} value
         * @returns array
         * @method getElementsByAttribute
         **/
        getElementsByAttribute:function (tagName, attr, value) {
            var matchingElements = [];
            var allElements = document.getElementsByTagName(tagName);
            for (var i = 0; i < allElements.length; i++) {
                if (allElements[i].getAttribute(attr) == value) {
                    // Element exists with attribute. Add to array.
                    matchingElements.push(allElements[i]);
                }
            }
            return matchingElements;
        }
    };
})();

var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Utils = Neosavvy.Core.Utils || {};

/**
 * @class Neosavvy.Core.Utils.MapUtils
 * @static
 **/
Neosavvy.Core.Utils.MapUtils = (function () {
    return {
        /**
         * returns the value in map that matches the passed in property.
         * also supports dotted properties.
         * @param {Obj} map
         * @param {String} properties
         * @returns Obj
         * @method get
         *
         * @example
         get({name: 'Bob Pollard'}, 'name') => 'Bob Pollard'
         get({location: {state: 'OH', city: 'Dayton'}}, 'location') => { state: 'OH', city: 'Dayton' }
         get({location: {state: 'OH', city: 'Dayton'}}, 'location.city') => 'Dayton'
         **/
        get: function (map, properties) {
            if (map && properties) {
                properties = properties.split(".");
                while (properties.length) {
                    if (map) {
                        map = map[properties.shift()];
                    } else {
                        break;
                    }
                }
            }
            return map;
        },
        /**
         * returns the value in map that matches the passed in property.
         * also supports dotted properties. Limited to 10 length property chain.
         * @param {Obj} map
         * @param {String} properties
         * @returns Obj
         * @method highPerformanceGet
         *
         * @example
         highPerformanceGet({name: 'Bob Pollard'}, 'name') => 'Bob Pollard'
         highPerformanceGet({location: {state: 'OH', city: 'Dayton'}}, 'location') => { state: 'OH', city: 'Dayton' }
         highPerformanceGet({location: {state: 'OH', city: 'Dayton'}}, 'location.city') => 'Dayton'
         **/
        highPerformanceGet: function (map, properties) {
            if (map && properties) {
                properties = properties.split(".");
                if (properties.length > 10) {
                    throw "You cannot pass in a string of properties greater than 10";
                }
                try {
                    switch (properties.length) {
                        case 1:
                            return map[properties[0]];
                        case 2:
                            return map[properties[0]][properties[1]];
                        case 3:
                            return map[properties[0]][properties[1]][properties[2]];
                        case 4:
                            return map[properties[0]][properties[1]][properties[2]][properties[3]];
                        case 5:
                            return map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]];
                        case 6:
                            return map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]][properties[5]];
                        case 7:
                            return map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]][properties[5]][properties[6]];
                        case 8:
                            return map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]][properties[5]][properties[6]][properties[7]];
                        case 9:
                            return map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]][properties[5]][properties[6]][properties[7]][properties[8]];
                        case 10:
                            return map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]][properties[5]][properties[6]][properties[7]][properties[8]][properties[9]];
                    }
                } catch (e) {
                    return undefined;
                }
            }
            return map;
        },
        /**
         * Applies a value to the property string on the existing map object. Returns the map.
         * @param {Obj} map
         * @param {String} properties
         * @param {Obj} value
         * @returns Obj
         * @method applyTo
         *
         * @example
         applyTo({name: 'Bob Pollard'}, 'name', 'George Jones') => {name: 'George Jones'}
         highPerformanceGet({location: {state: 'OH', city: 'Dayton'}}, 'location', { state: 'TX', city: 'Austin' }) => {location: {state: 'TX', city: 'Austin'}}
         highPerformanceGet({location: {state: 'OH', city: 'Dayton'}}, 'location.city', 'Cleveland') => {location: {state: 'OH', city: 'Cleveland'}}
         **/
        applyTo: function (map, properties, value) {
            if (map && properties) {
                properties = properties.split(".");
                if (properties.length > 10) {
                    throw "You cannot pass in a string of properties greater than 10";
                }
                switch (properties.length) {
                    case 1:
                        map[properties[0]] = value;
                        break;
                    case 2:
                        map[properties[0]][properties[1]] = value;
                        break;
                    case 3:
                        map[properties[0]][properties[1]][properties[2]] = value;
                        break;
                    case 4:
                        map[properties[0]][properties[1]][properties[2]][properties[3]] = value;
                        break;
                    case 5:
                        map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]] = value;
                        break;
                    case 6:
                        map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]][properties[5]] = value;
                        break;
                    case 7:
                        map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]][properties[5]][properties[6]] = value;
                        break;
                    case 8:
                        map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]][properties[5]][properties[6]][properties[7]] = value;
                        break;
                    case 9:
                        map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]][properties[5]][properties[6]][properties[7]][properties[8]] = value;
                        break;
                    case 10:
                        map[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]][properties[5]][properties[6]][properties[7]][properties[8]][properties[9]] = value;
                        break;
                }
            }
            return map;
        },
        /**
         * returns true or false based on whether or not the passed
         * in set of objects all have unique keys
         *
         * @example
         keysDistinct({whoomp: 'there it is'}, {whoomp: 'here it goes'}) => false
         keysDistinct({whoomp: 'there it is'}, {tagTeam: 'back again'}) => true
         * @param {obj} arguments
         * @returns Boolean
         * @method keysDistinct
         **/
        keysDistinct: function () {
            if (arguments.length > 1) {
                var accumulatedLength = 0;
                for (var i = 0; i < arguments.length; i++) {
                    accumulatedLength += _.keys(arguments[i]).length;
                }
                return (_.keys(_.merge.apply(this, arguments)).length === accumulatedLength);
            }
            return true;
        }
    }
})();

var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Utils = Neosavvy.Core.Utils || {};

/**
 * @class Neosavvy.Core.Utils.NumberUtils
 * @static
 **/
Neosavvy.Core.Utils.NumberUtils = (function () {

    return {
        asOrdinal:function (n) {
            var s = ["th", "st", "nd", "rd"], v = Math.abs(n) % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        },
        roundUpIfFloat:function (n) {
            var absN = Math.abs(n);
            if ((absN - parseInt(absN)) > 0) {
                return parseInt(n) + (n < 0 ? -1 : 1);
            }
            return n;
        },
        leadingZeroes:function (n, digits) {
            if (n != undefined && n != null) {
                if (digits == undefined || digits == null) {
                    digits = 2;
                }
                var s = String(n);
                var negative = (s.charAt(0) == "-");
                if (negative) {
                    s = s.slice(1);
                }
                var split = s.split(".");
                if (split.length == 2) {
                    s = split[0];
                }
                while (s.length < digits) {
                    s = "0" + s;
                }
                if (split.length == 2) {
                    s += "." + split[1];
                }
                return negative ? "-" + s : s;
            }
            return n;
        }
    }

})();

var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Utils = Neosavvy.Core.Utils || {};

/**
 * @class Neosavvy.Core.Utils.RegexUtils
 * @static
 **/
Neosavvy.Core.Utils.RegexUtils = (function () {
    var EMAIL_REGEX = /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/;
    return {
        matchStringAndLeadup: function(str) {
            if (!_.isEmpty(str)) {
                str = String(str);
                var re = "", idx = 0;
                while (idx < str.length) {
                    re += "^" + str.slice(0, idx + 1) + "$";
                    if (idx < (str.length - 1)) {
                        re += "|";
                    }
                    idx++;
                }
                return new RegExp(re.replace(/([.?*+[\]\\(){}-])/g, "\\$1"), "i");
            }
            return undefined;
        },
        isEmail: function(str) {
            if (str !== undefined && str !== null) {
                return String(str).search(EMAIL_REGEX) != -1;
            }
            return false;
        }
    };
})();

var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Utils = Neosavvy.Core.Utils || {};

/**
 * @class Neosavvy.Core.Utils.SpecialUtils
 * @static
 **/
Neosavvy.Core.Utils.SpecialUtils = (function () {
    return {
        /**
         * Allows the developer to functionally stack up methods that may fail and move on to the next in that case.
         * @param {Function...} arguments
         * @returns *
         * @method keepTrying
         **/
        keepTrying:function () {
            function _keepTrying() {
                if (arguments.length) {
                    if ((arguments.length % 2) === 0) {
                        try {
                            return arguments[0].apply(this, arguments[1]);
                        } catch (e) {
                            return _keepTrying.apply(this, Array.prototype.slice.call(arguments, 2));
                        }
                    } else {
                        throw "Keep trying requires an even number of arguments. Even indices are functions and odd indices are arrays or empty arrays of their arguments!";
                    }
                }
                return null;
            }

            return _keepTrying.apply(this, arguments);
        }
    }
})();

var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Utils = Neosavvy.Core.Utils || {};

/**
 * @class Neosavvy.Core.Utils.StringUtils
 * @static
 **/
Neosavvy.Core.Utils.StringUtils = (function () {
    var BLANK_STRING_REGEX = /^\s*$/;

    return {
        /** truncate method deprecated, use _.truncate instead **/
        /** remove method deprecated, use .replace(GLOBAL_REGEX, "") instead **/
        /**
         * Tests whether or not a string is blank with no contents. Also works with numbers, unlike _.isEmpty
         * @param {String} str
         * @returns Boolean
         * @method isBlank
         **/
        isBlank:function (str) {
            return (str === undefined || str === null || BLANK_STRING_REGEX.test(str));
        }
    }
})();

var Neosavvy = Neosavvy || {};
Neosavvy.Core = Neosavvy.Core || {};
Neosavvy.Core.Utils = Neosavvy.Core.Utils || {};

/**
 * Thanks to philidem on github for this great starting point.
 * https://github.com/philidem/url-util-js/blob/master/test/url-util-spec.js
 *
 * @class Neosavvy.Core.Utils.UrlUtils
 * @static
 **/
Neosavvy.Core.Utils.UrlUtils = (function () {

        function URL(url, queryString) {
            if (url) {
                this._parse(url);
            } else {
                throw Error("Can not create a url with undefined URL param");
            }

            if (queryString) {
                this.getQueryString().parse(queryString);
            }
        }

        var protocolChars = 'abcdefghijklmnopqrstuvwxyz0123456789+-.';
        var validProtocolChars = {};

        for ( var i = 0; i < protocolChars.length; i++) {
            validProtocolChars[protocolChars.charAt(i)] = true;
        }

        URL.parse = function(url, queryString) {
            return new URL(url, queryString);
        };

        URL.isValidProtocol = function(protocol) {
            for (var i = 0; i < protocol.length; i++) {
                /*
                 * If we find an illegal character in the protocol then this is not
                 * the protocol...
                 */
                if (!validProtocolChars[protocol.charAt(i)]) {
                    return false;
                }
            }

            return true;
        };

        URL.prototype = {
            _parse : function(url) {

                var pos;

                /*
                 * parse the fragment (part after hash symbol) first according to
                 * RFC
                 */
                pos = url.indexOf('#');
                if (pos !== -1) {
                    if ((pos + 1) < url.length) {
                        this.hash = url.substring(pos + 1);
                    }

                    /* continue parsing everything before the hash symbol */
                    url = url.substring(0, pos);
                }

                /* parse the protocol according to RFC */
                pos = url.indexOf(':');
                if (pos !== -1) {
                    /*
                     * We found what might be the protocol but let's make sure it
                     * doesn't contain any invalid characters..
                     */
                    var possibleProtocol = url.substring(0, pos).toLowerCase();

                    if (URL.isValidProtocol(possibleProtocol)) {
                        this.protocol = possibleProtocol;
                        pos++;

                        if (pos === url.length) {
                            /*
                             * reached the end of the string (input was something
                             * like "http:"
                             */
                            return;
                        }

                        /* continue parsing everything past the protocol */
                        url = url.substring(pos);
                    }
                }

                if ((url.charAt(0) === '/') && (url.charAt(1) === '/')) {

                    // URL will contain network location (i.e. <host>:<port>)

                    /* find where the path part starts */
                    pos = url.indexOf('/', 2);
                    if (pos === -1) {
                        /*
                         * There is no path and there can't be a query according to
                         * the RFC
                         */
                        if (url.length > 2) {
                            this._parseNetworkLocation(url.substring(2));
                        }
                        return;
                    } else {
                        /*
                         * there is a path so parse network location before the path
                         */
                        this._parseNetworkLocation(url.substring(2, pos));
                        url = url.substring(pos);
                    }
                }

                var protocol = this.protocol;
                if (!protocol || (protocol === 'http') || (protocol === 'https')) {
                    /*
                     * Now parse the path and query string.. If there is no '?'
                     * character then the remaining portion is just the path.
                     */
                    pos = url.indexOf('?');
                    if (pos === -1) {
                        this.path = url;
                    } else {
                        this.path = url.substring(0, pos);
                        if ((pos + 1) < url.length) {
                            this.queryString = new QueryString(url.substring(pos + 1));
                        }
                    }
                } else {
                    this.path = url;
                }
            },

            /**
             * Parse the network location which will contain the host and possibly
             * the port.
             *
             * @param networkLocation
             *            the network location portion of URL being parsed
             */
            _parseNetworkLocation : function(networkLocation) {
                var pos = networkLocation.indexOf(':');
                if (pos === -1) {
                    this.host = networkLocation;
                } else {
                    this.host = networkLocation.substring(0, pos);
                    if (pos < (networkLocation.length - 1)) {
                        this.port = networkLocation.substring(pos + 1);
                    }
                }
            },

            setHost : function(host) {
                this.host = host;
            },

            getHost : function() {
                return this.host;
            },

            setPath : function(path) {
                this.path = path;
            },

            getPath : function() {
                return this.path;
            },

            getQueryString : function() {
                if (!this.queryString) {
                    this.queryString = new QueryString();
                }

                return this.queryString;
            },

            setQueryString : function(queryString) {
                this.queryString = queryString;
            },

            /**
             * converts the URL to its string representation
             *
             * @return {String} string representation of URL
             */
            toString : function() {
                var queryString = (this.queryString)
                    ? this.queryString.toString() : null;

                var parts = [];

                if (this.protocol) {
                    parts.push(this.protocol);
                    parts.push('://');
                }

                if (this.host !== undefined) {
                    parts.push(this.host);
                }

                if (this.port !== undefined) {
                    parts.push(':');
                    parts.push(this.port);
                }

                parts.push(this.path);

                if (queryString) {
                    parts.push('?');
                    parts.push(queryString);
                }

                if (this.hash) {
                    parts.push('#');
                    parts.push(this.hash);
                }

                return parts.join('');
            },

            /**
             * removes a parameter from the query string
             *
             * @param {String}
             *            name parameter name
             */
            removeParameter : function(name) {
                this.getQueryString().remove(name);
            },

            /**
             * sets the value of a query string parameter
             *
             * @param {String}
             *            name parameter name
             * @param {Strign}
             *            value parameter value
             */
            setParameter : function(name, value) {
                this.getQueryString().set(name, value);
            },

            /**
             * retrieves a value of parameter from the query string
             *
             * @param {String}
             *            name parameter name
             */
            getParameter : function(name) {
                return this.getQueryString().get(name);
            },

            getPort : function() {
                if (this.port !== undefined && this.port !== null) {
                    return parseInt(this.port);
                }

                if (this.protocol === 'http') {
                    return 80;
                }

                if (this.protocol === 'https') {
                    return 443;
                }

                return undefined;
            }
        };

        function QueryString(queryString) {
            this._params = {};

            if (queryString) {
                this.parse(queryString);
            }
        }

        QueryString.parse = function(queryString) {
            if (!queryString) {
                return new QueryString();
            } else {
                return new QueryString(queryString.toString());
            }
        };

        QueryString.prototype = {

            getParameters: function() {
                return this._params;
            },

            parse : function(queryString) {

                if (typeof queryString === 'object') {
                    for (var key in queryString) {
                        if (queryString.hasOwnProperty(key)) {
                            this.add(key, queryString[key]);
                        }
                    }
                } else {
                    var parameters = queryString.split('&');

                    for (var i = 0; i < parameters.length; i++) {
                        var param = parameters[i];
                        pos = param.indexOf('=');

                        var name, value;

                        if (pos == -1) {
                            name = param;
                            value = null;
                        } else {
                            name = param.substring(0, pos);
                            value = decodeURIComponent(param.substring(pos + 1));
                        }

                        if (name == '') {
                            continue;
                        }

                        this.add(name, value);
                    }
                }
            },

            /**
             * removes a parameter from the query string
             *
             * @param {String} name parameter name
             */
            remove : function(name) {
                delete this._params[name];
            },

            /**
             * sets the value of a query string parameter
             *
             * @param {String} name parameter name
             * @param {Strign} value parameter value
             */
            set : function(name, value) {
                if (value === undefined || value === null) {
                    this.remove(name);
                } else {
                    this._params[name] = value;
                }
            },

            /**
             * sets the value of a query string parameter
             *
             * @param {String} name parameter name
             * @param {Strign} value parameter value
             */
            add : function(name, value) {
                var existingValue = this._params[name];

                if (existingValue !== undefined) {
                    if (existingValue.constructor === Array) {
                        if (value.constructor === Array) {
                            for ( var i = 0; i < value.length; i++) {
                                existingValue.push(value[i]);
                            }
                        } else {
                            existingValue.push(value);
                        }
                        value = existingValue;
                    } else {
                        value = [ existingValue, value ];
                    }
                }

                this._params[name] = value;
            },

            /**
             * retrieves a value of parameter from the query string
             *
             * @param {String} name parameter name
             */
            get : function(name) {
                var value = this._params[name];
                if (value === undefined) {
                    return null;
                }

                return value;
            },


            /**
             * converts the URL to its string representation
             *
             * @return {String} string representation of URL
             */
            toString : function() {
                var parts = [];

                for ( var name in this._params) {
                    if (this._params.hasOwnProperty(name)) {
                        var value = this._params[name];

                        if ((value === undefined) || (value === null)) {
                            parts.push(name);
                        } else if (value.constructor === Array) {

                            for ( var i = 0; i < value.length; i++) {
                                parts.push(name + '=' + encodeURIComponent(value[i]));
                            }
                        } else {
                            parts.push(name + '=' + encodeURIComponent(value));
                        }
                    }
                }

                return parts.join('&');
            }
        };

        return {
            URL : URL,
            QueryString : QueryString,
            parse : function(url, queryString) {
                return this.URL.parse.apply(this, arguments);
            }
        }
})();
