'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['backbone', 'lodash'], function (Backbone, lodash) {
            return factory(Backbone, lodash);
        });

    } else if (typeof exports !== 'undefined') {
        factory(root.Backbone, root.lodash || root._);

    } else {
        root.Backbone.compatibility = factory(root.Backbone, root.lodash || root._);
    }
}(this, function (Backbone, lodash) {
    var cache = {};

    /**
     * looks for a property in prototype chain
     *
     * @param {Object} obj
     * @param {String} key
     * @returns {Object}
     */
    function getPropertyDescriptor(obj, key) {
        var descriptor = Object.getOwnPropertyDescriptor(obj, key);

        if (descriptor === undefined) {
            try {
                return getPropertyDescriptor(Object.getPrototypeOf(obj), key);
            }
            catch (exception) {
                return undefined;
            }
        }

        return descriptor;
    }

    /**
     * extends the Backbone Extends function with predefined Values
     *
     * @param {Object} prototypeProperties
     * @param {Object} staticProperties
     * @returns {Object}
     */
    function extend(prototypeProperties, staticProperties) {
        var parent           = this;
        var preDefinedValues = {};
        var prototypePropertyName;
        var prototypePropertyValue;
        var descriptor;
        var parentPredefinedValueByKey;
        var cacheObj;

        if (parent[':uid'] === undefined) {
            Object.defineProperty(parent, ':uid', {
                value: lodash.uniqueId('obj'),
                enumerable: false,
                configurable: false,
                writable: false
            });
            cache[parent[':uid']] = {};
        }
        cacheObj = cache[parent[':uid']];

        // add properties && functions to prototype
        for (prototypePropertyName in prototypeProperties) {
            if (cacheObj[prototypePropertyName] !== undefined) {
                descriptor = cacheObj[prototypePropertyName];
            }
            else {
                descriptor = getPropertyDescriptor(parent.prototype, prototypePropertyName);
                if (descriptor !== undefined) {
                    cacheObj[prototypePropertyName] = descriptor;
                }
            }
            // not defined... can be defined
            if (descriptor === undefined) {
                continue;
            }

            // defined as function not as property... can be defined
            if (descriptor.value instanceof Function) {
                continue;
            }

            prototypePropertyValue = prototypeProperties[prototypePropertyName];

            // the parent property has not a setter
            if ((descriptor.set instanceof Function) === false) {
                parentPredefinedValueByKey = this.getPrototypeValue(prototypePropertyName);
                // parent value and child value are objects.
                if (parentPredefinedValueByKey !== undefined && lodash.isPlainObject(parentPredefinedValueByKey) === true && lodash.isPlainObject(prototypePropertyValue) === true) {
                    prototypeProperties[prototypePropertyName] = lodash.extend({}, parentPredefinedValueByKey, prototypePropertyValue);
                }
            }
            // the parent property has a setter
            else {
                preDefinedValues[prototypePropertyName] = {
                    mode: 'setter',
                    value: prototypePropertyValue
                };
                // with a setter the property will be removed and will be setted if the obj will be instanciated
                delete prototypeProperties[prototypePropertyName];
            }
            // anything else is valid
        }

        /**
         * create own constructor
         */
        prototypeProperties.constructor = function () {
            // define proto props constuctor informations
            var __prototypePropertiesConstructorInformationsCreated = (this.__prototypePropertiesConstructorInformations === undefined);
            if (__prototypePropertiesConstructorInformationsCreated === true) {
                this.__prototypePropertiesConstructorInformations = {
                    level: 0,
                    preDefinedValues: {}
                };
            }
            this.__prototypePropertiesConstructorInformations.level++;

            // copy options
            var preDefinedValueName;
            var options;
            for (preDefinedValueName in preDefinedValues) {
                options = preDefinedValues[preDefinedValueName];

                // property was setted before by a child instance option
                if (this.__prototypePropertiesConstructorInformations.preDefinedValues[preDefinedValueName] !== undefined) {
                    continue;
                }

                // using setter so make it short because calling a getter can make problems
                if (options.mode === 'setter') {
                    this[preDefinedValueName]                                                               = options.value;
                    this.__prototypePropertiesConstructorInformations.preDefinedValues[preDefinedValueName] = true;
                }
            }

            // call parent constructor
            parent.apply(this, arguments);

            // remove temp vars
            if (__prototypePropertiesConstructorInformationsCreated === true) {
                delete this.__prototypePropertiesConstructorInformations;
            }
        };

        // store preDefined Values to find
        prototypeProperties.constructor.preDefinedValues = preDefinedValues;

        // make the Backbone magic
        return Backbone.View.extend.call(parent, prototypeProperties, staticProperties);
    }

    /**
     * makes the object to backbone compatible
     *
     * @param {Function} ObjectConstructor
     * @returns {Function|{extend: Function, compatibility: Function}}
     */
    function compatibility(ObjectConstructor) {
        ObjectConstructor.compatibility         = compatibility;
        ObjectConstructor.extend                = extend;
        ObjectConstructor.prototype.constructor = ObjectConstructor;

        /**
         * @param {String} propertyName
         * @returns {*}
         */
        ObjectConstructor.getPrototypeValue = function (propertyName) {
            if (this.prototype[propertyName] !== undefined && this.prototype[propertyName] !== null) {
                return this.prototype[propertyName];
            }
            if (ObjectConstructor.prototype[propertyName] !== undefined && ObjectConstructor.prototype[propertyName] !== null) {
                return ObjectConstructor.prototype[propertyName];
            }

            if (this.preDefinedValues !== undefined && this.preDefinedValues[propertyName] !== undefined && this.preDefinedValues[propertyName] !== null) {
                return this.preDefinedValues[propertyName].value;
            }

            return undefined;
        };

        return ObjectConstructor;
    }

    Backbone.compatibility = compatibility;

    return compatibility;
}));
