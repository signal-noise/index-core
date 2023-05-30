(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.indexCore = factory());
})(this, (function () { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    function clone(o) {
        return JSON.parse(JSON.stringify(o));
    }
    function clamper(range, value) {
        return Math.min(Math.max(value, range[0]), range[1]);
    }
    function normalise(value, range, normaliseTo, clamp) {
        if (range === void 0) { range = [0, 100]; }
        if (normaliseTo === void 0) { normaliseTo = 100; }
        if (clamp === void 0) { clamp = false; }
        var x = Number(value);
        if (clamp) {
            x = clamper(range, value);
        }
        var res = ((x - range[0]) / (range[1] - range[0])) * normaliseTo;
        return res;
    }
    function calculateWeightedMean(weightedValues, normaliseTo, clamp) {
        if (normaliseTo === void 0) { normaliseTo = 100; }
        if (clamp === void 0) { clamp = false; }
        var weightedSum = 0;
        var cumulativeWeight = 0;
        weightedValues.forEach(function (indicator) {
            var value = indicator.value, range = indicator.range, invert = indicator.invert, weighting = indicator.weighting;
            var normalisedValue = normalise(value, range, normaliseTo, clamp);
            var weightedValue = invert ? ((normaliseTo - normalisedValue) * weighting) : (normalisedValue * weighting);
            weightedSum += weightedValue;
            cumulativeWeight += weighting;
        });
        return weightedSum / cumulativeWeight;
    }

    var IndicatorType;
    (function (IndicatorType) {
        IndicatorType["CALCULATED"] = "calculated";
        IndicatorType["DISCRETE"] = "discrete";
        IndicatorType["CONTINUOUS"] = "continuous";
    })(IndicatorType || (IndicatorType = {}));

    var validateIndicator = function (indicator, indexMax) {
        if (!indicator.id) {
            console.warn("Skipping: Indicator doesn't have an id and is probably invalid: ".concat(JSON.stringify(indicator)));
            return;
        }
        if (indicator.id.includes('BG')) {
            // We're not counting background indicators for now
            // TODO: return a separate array of background indicators
            console.warn("Skipping: Background Indicator: ".concat(JSON.stringify(indicator)));
            return;
        }
        var getIndicatorType = function () {
            switch (indicator.type) {
                case "calculated":
                    return IndicatorType.CALCULATED;
                case "discrete":
                    return IndicatorType.DISCRETE;
                case "continuous":
                    return IndicatorType.CONTINUOUS;
                default:
                    return IndicatorType.CONTINUOUS;
            }
        };
        var coerceBoolean = function (prop) {
            if (prop && prop.toLowerCase() === "true") {
                return true;
            }
            else {
                return false;
            }
        };
        var getRange = function (min, max) {
            // If the max is absent we're going to set it to 0 here and then change it again in index-core to whatever the custom max is
            var range = [
                !Number.isNaN(Number(min)) ? Number(min) : 0,
                !Number.isNaN(Number(max)) && Number(max) !== 0 ? Number(max) : indexMax
            ];
            return range;
        };
        var result = {
            id: indicator.id,
            diverging: coerceBoolean(indicator.diverging),
            type: getIndicatorType(),
            invert: coerceBoolean(indicator.invert),
            range: getRange(indicator.min, indicator.max),
            weighting: Number(indicator.weighting),
            indicatorName: indicator.indicatorName || '',
            value: 0
        };
        return result;
    };
    var validateEntity = function (entity) {
        var scores = Object.entries(entity).reduce(function (acc, _a) {
            var key = _a[0], value = _a[1];
            if (!Number.isNaN(Number(value))) {
                acc[key] = Number(value);
            }
            return acc;
        }, {});
        scores[0] = 0;
        var newEntity = {
            name: entity.name || '',
            scores: scores,
            user: {},
            data: {}
        };
        return newEntity;
    };

    var indicatorIdTest = /^([\w]\.)*\w{1}$/;
    // TODO: the last 3 args, (indexMax, allowOverwrite, clamp) should proabbly be an options object
    var index = function indexCore(rawIndicatorsData, rawEntitiesData, indexMax, allowOverwrite, clamp) {
        if (rawIndicatorsData === void 0) { rawIndicatorsData = []; }
        if (rawEntitiesData === void 0) { rawEntitiesData = []; }
        if (indexMax === void 0) { indexMax = 100; }
        if (allowOverwrite === void 0) { allowOverwrite = true; }
        if (clamp === void 0) { clamp = false; }
        if (rawIndicatorsData.length === 0 || rawEntitiesData.length === 0)
            return {};
        var indicatorsData = rawIndicatorsData.map(function (i) { return validateIndicator(i, indexMax); }).filter(function (i) { return i !== undefined; });
        var entitiesData = rawEntitiesData.map(function (e) { return validateEntity(e); }).filter(function (i) { return i !== undefined; });
        var indicatorLookup = Object.fromEntries(indicatorsData
            .map(function (indicator) { return ([indicator.id, indicator]); }));
        var indexedData = {};
        var indexStructureChildren = [];
        var indexStructure = {
            id: '',
            children: indexStructureChildren
        };
        // I assume the following is meant to be replaced with a custom function responsible for determining whether an indicator should be excluded
        /* eslint-disable  @typescript-eslint/no-unused-vars */
        var excludeIndicator = function (indicator) { return false; }; // by default no valid indicators are excluded
        function getEntity(entityName) {
            return indexedData[entityName];
        }
        function getEntityIndicator(entityName, indicatorID) {
            var _a;
            if (indexedData[entityName].user && ((_a = indexedData[entityName].user) === null || _a === void 0 ? void 0 : _a[indicatorID])) {
                return indexedData[entityName].user[indicatorID];
            }
            return indexedData[entityName].scores[indicatorID];
        }
        function getEntities() {
            return entitiesData.map(function (d) { return d.name; });
        }
        function getIndicator(id) {
            return indicatorLookup[id];
        }
        function getIndicatorLookup() {
            return indicatorLookup;
        }
        function getIndexMean(indicatorID, normalised) {
            if (indicatorID === void 0) { indicatorID = '0'; }
            if (normalised === void 0) { normalised = true; }
            // get the mean index value for a given indicator id,
            // if the value of an indicator on an entiry is falsey
            // dont take it into account
            var entityValues = Object.values(indexedData);
            // If it doesn't exist in the lookup, create new indicator for top level value
            var indicator = indicatorLookup[indicatorID]
                ? indicatorLookup[indicatorID] : {
                id: indicatorID,
                type: IndicatorType.CONTINUOUS,
                range: [0, indexMax],
                diverging: false,
                invert: false,
                weighting: 0,
                indicatorName: '',
                value: 0
            };
            var length = entityValues.length;
            var sum = entityValues.reduce(function (acc, v) {
                if (Number.isNaN(Number(v.scores[indicatorID]))) {
                    length -= 1;
                    return acc;
                }
                if (!normalised) {
                    return acc + Number(v.scores[indicatorID]);
                }
                return acc + normalise(Number(v.scores[indicatorID]), indicator.range, indexMax, clamp);
            }, 0);
            return sum / length;
        }
        // format an indicator for passing to the weighted mean function
        function formatIndicator(indicator, entity, max) {
            var value = entity.user[indicator.id]
                ? Number(entity.user[indicator.id])
                : Number(entity.scores[indicator.id]);
            var range = __spreadArray([], indicator.range, true);
            if (indicator.diverging) {
                // TODO: set centerpoint somewhere in a config
                var centerpoint = 0;
                // TODO do we need to check if these exist anymore?
                if (indicator.range[1]) {
                    if (indicator.range[0]) {
                        range = [0, Math.max(Math.abs(indicator.range[0]), Math.abs(indicator.range[1]))];
                    }
                    else {
                        range = [0, max];
                    }
                }
                value = Math.abs(value - centerpoint);
            }
            var result = {
                id: indicator.id,
                value: value,
                type: indicator.type,
                diverging: indicator.diverging,
                weighting: indicator.userWeighting
                    ? Number(indicator.userWeighting)
                    : Number(indicator.weighting),
                invert: indicator.invert,
                range: range,
                indicatorName: indicator.indicatorName
            };
            return result;
        }
        function indexEntity(entity, calculationList, overwrite) {
            if (overwrite === void 0) { overwrite = allowOverwrite; }
            var newEntityScores = clone(entity.scores);
            var newEntity = {
                name: entity.name,
                scores: newEntityScores,
                data: {},
                user: entity.user ? entity.user : {}
            };
            calculationList.forEach(function (parentIndicatorID) {
                if ((newEntityScores[parentIndicatorID] && overwrite === true) || !newEntityScores[parentIndicatorID]) {
                    // get the required component indicators to calculate the parent value
                    // this is a bit brittle maybe?
                    var componentIndicators = indicatorsData
                        .filter(function (indicator) { return (indicator.id.indexOf(parentIndicatorID) === 0 // the
                        && indicator.id.split('.').length === parentIndicatorID.split('.').length + 1); })
                        .filter(function (indicator) { return excludeIndicator(indicator) === false; })
                        .map(function (indicator) { return formatIndicator(indicator, newEntity, indexMax); });
                    // calculate the weighted mean of the component indicators on the newEntity
                    // assign that value to the newEntity
                    newEntityScores[parentIndicatorID] = calculateWeightedMean(componentIndicators, indexMax, clamp);
                }
                else {
                    console.warn("retaining existing value for ".concat(entity.name, " - ").concat(parentIndicatorID, " : ").concat(Number(entity.scores[parentIndicatorID])));
                    newEntityScores[parentIndicatorID] = Number(entity.scores[parentIndicatorID]);
                }
            });
            var pillarIndicators = indicatorsData
                .filter(function (indicator) { return String(indicator.id).match(indicatorIdTest) && indicator.id.split('.').length === 1; })
                .map(function (indicator) { return formatIndicator(indicator, newEntity, indexMax); });
            newEntity.scores[0] = calculateWeightedMean(pillarIndicators, indexMax, clamp);
            return newEntity;
        }
        function getIndexableIndicators(indicatorsData) {
            return indicatorsData
                .filter(function (i) {
                if (!i.id) {
                    console.warn("Missing id: ".concat(JSON.stringify(i)));
                }
                var isIndicator = String(i.id).match(indicatorIdTest);
                var isExcluded = excludeIndicator(i);
                return isIndicator && !isExcluded;
            });
        }
        function getCalculationList(indicators) {
            return indicators
                .filter(function (i) { return (i.type === IndicatorType.CALCULATED && !excludeIndicator(i)); })
                .map(function (i) { return i.id; })
                .sort(function (i1, i2) { return (i2.split('.').length - i1.split('.').length); });
        }
        function adjustValue(entityName, indicatorID, value) {
            var e = getEntity(entityName);
            var isEmpty = function (obj) { return Object.keys(obj).length === 0; };
            if ((!indicatorID && !value) || !e.user) {
                var newUser = {};
                e.user = newUser;
            }
            else if (!value && !isEmpty(e.user)) {
                delete e.user[indicatorID]; // no value specified, reset the indicator
            }
            if (indicatorLookup[indicatorID] && indicatorLookup[indicatorID].type === IndicatorType.CALCULATED) {
                console.warn("".concat(indicatorID, " is a calculated value and can not be adjusted directly, perhaps you meant to adjust the weighting?"));
                return clone(e);
            }
            if (indicatorID !== undefined && value !== undefined) {
                e.user[indicatorID] = value;
            }
            var onlyIdIndicators = getIndexableIndicators(indicatorsData);
            var calculationList = getCalculationList(onlyIdIndicators);
            indexedData[e.name] = indexEntity(e, calculationList, true);
            var adjustedEntityScores = Object.assign(clone(indexedData[e.name].scores), indexedData[e.name].user);
            var adjustedEntity = __assign(__assign({}, indexedData[e.name]), { scores: adjustedEntityScores });
            adjustedEntity.user = {};
            adjustedEntity.data = {};
            return adjustedEntity;
        }
        function createStructure(indicatorIds) {
            var tree = { id: 'root', children: [] };
            indicatorIds.forEach(function (id) {
                var bits = id.split('.');
                var current = tree;
                var builtId = '';
                bits.forEach(function (bit, i) {
                    builtId = (i === 0)
                        ? "".concat(bit)
                        : "".concat(builtId, ".").concat(bit);
                    var next = current.children.find(function (c) { return c.id === builtId; });
                    if (next === undefined) {
                        next = {
                            id: builtId,
                            children: [],
                        };
                        current.children.push(next);
                    }
                    current = next;
                });
            });
            return tree;
        }
        function calculateIndex(overwrite) {
            if (overwrite === void 0) { overwrite = allowOverwrite; }
            // get a list of the values we need to calculate
            // in order of deepest in the heirachy to the shallowist
            var onlyIdIndicators = getIndexableIndicators(indicatorsData);
            var calculationList = getCalculationList(onlyIdIndicators);
            indexStructure = createStructure(onlyIdIndicators.map(function (i) { return i.id; }));
            entitiesData.forEach(function (entity) {
                var indexedEntity = indexEntity(entity, calculationList, overwrite);
                indexedEntity.data = entity.scores;
                indexedData[entity.name] = indexedEntity;
            });
        }
        function adjustWeight(indicatorID, weight) {
            // TODO: make the index recalculating take into account what
            //    has changed in the data rather than doing the whole shebang
            indicatorLookup[indicatorID].userWeighting = weight;
            calculateIndex(true);
        }
        function filterIndicators(exclude, overwrite) {
            if (exclude === void 0) { exclude = function (indicator) { return false; }; }
            if (overwrite === void 0) { overwrite = allowOverwrite; }
            excludeIndicator = exclude;
            calculateIndex(overwrite);
        }
        calculateIndex(allowOverwrite);
        return {
            adjustValue: adjustValue,
            adjustWeight: adjustWeight,
            filterIndicators: filterIndicators,
            getEntities: getEntities,
            getEntity: getEntity,
            getEntityIndicator: getEntityIndicator,
            getIndexMean: getIndexMean,
            getIndicator: getIndicator,
            getIndicatorLookup: getIndicatorLookup,
            indexedData: indexedData,
            indexStructure: indexStructure
        };
    };

    return index;

}));
//# sourceMappingURL=bundle.js.map
