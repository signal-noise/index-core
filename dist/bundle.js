(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.indexCore = factory());
})(this, (function () { 'use strict';

    function clone(o) {
        return JSON.parse(JSON.stringify(o));
    }
    function clamper(range, value) {
        return Math.min(Math.max(Number(value), range[0]), range[1]);
    }
    function normalise(value, range, normaliseTo, clamp) {
        if (range === void 0) { range = [0, 100]; }
        if (normaliseTo === void 0) { normaliseTo = 100; }
        if (clamp === void 0) { clamp = false; }
        var x = Number(value);
        if (clamp) {
            x = clamper(range, value);
        }
        return ((x - range[0]) / (range[1] - range[0])) * normaliseTo;
    }
    function calculateWeightedMean(weightedValues, normaliseTo, clamp) {
        if (normaliseTo === void 0) { normaliseTo = 100; }
        if (clamp === void 0) { clamp = false; }
        var weightedSum = 0;
        var cumulativeWeight = 0;
        for (var i = 0; i < weightedValues.length; i += 1) {
            var indicator = weightedValues[i];
            var normalisedValue = normalise(indicator.value, indicator.range, normaliseTo, clamp);
            var weightedValue = indicator.invert
                ? ((normaliseTo - normalisedValue) * indicator.weight)
                : (normalisedValue * indicator.weight);
            weightedSum += weightedValue;
            cumulativeWeight += indicator.weight;
        }
        return weightedSum / cumulativeWeight;
    }

    var IndicatorType;
    (function (IndicatorType) {
        IndicatorType["CALCULATED"] = "calculated";
        IndicatorType["DISCRETE"] = "discrete";
        IndicatorType["CONTINUOUS"] = "continuous";
    })(IndicatorType || (IndicatorType = {}));

    var indicatorIdTest = /^([\w]\.)*\w{1}$/;
    // TODO: the last 3 args, (indexMax, allowOverwrite, clamp) should proabbly be an options object
    var index = function indexCore(indicatorsData, entitiesData, indexMax, allowOverwrite, clamp) {
        if (indicatorsData === void 0) { indicatorsData = []; }
        if (entitiesData === void 0) { entitiesData = []; }
        if (indexMax === void 0) { indexMax = 100; }
        if (allowOverwrite === void 0) { allowOverwrite = true; }
        if (clamp === void 0) { clamp = false; }
        if (indicatorsData.length === 0 || entitiesData.length === 0)
            return {};
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
            // If user has changed the value of the indicator, return that changed value instead of the original
            if (indexedData[entityName].user && indexedData[entityName].user[indicatorID]) {
                return indexedData[entityName].user[indicatorID];
            }
            return indexedData[entityName][indicatorID];
        }
        // return the NAMES of the entities
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
            if (indicatorID === void 0) { indicatorID = 'value'; }
            if (normalised === void 0) { normalised = true; }
            // get the mean index value for a given indicator id,
            // if the value of an indicator on an entiry is falsey
            // dont take it into account
            var entityValues = Object.values(indexedData);
            var indicator = indicatorLookup[indicatorID]
                ? indicatorLookup[indicatorID]
                : {
                    min: 0,
                    max: indexMax,
                    id: '',
                    value: null,
                    type: IndicatorType.CONTINUOUS,
                    diverging: false,
                    invert: false
                };
            var indicatorRange = [
                indicator.min ? Number(indicator.min) : 0,
                indicator.max ? Number(indicator.max) : indexMax,
            ];
            var length = entityValues.length;
            var sum = entityValues.reduce(function (acc, v) {
                if (Number.isNaN(Number(v[indicatorID]))) {
                    length -= 1;
                    return acc;
                }
                if (!normalised) {
                    return acc + Number(v[indicatorID]);
                }
                return acc + normalise(Number(v[indicatorID]), indicatorRange, indexMax, clamp);
            }, 0);
            return sum / length;
        }
        // format an indicator for passing to the weighted mean function
        function formatIndicator(indicator, entity, max) {
            var diverging = (indicator.diverging === true || String(indicator.diverging).toLocaleLowerCase() === 'true');
            var value = entity.user && entity.user[indicator.id]
                ? Number(entity.user[indicator.id])
                : Number(entity[indicator.id]);
            var range = [
                indicator.min ? Number(indicator.min) : 0,
                indicator.max ? Number(indicator.max) : max,
            ];
            if (diverging) {
                // currently no way to set this diffeently included here as a signpost for the future
                var centerpoint = 0;
                if (indicator.max) {
                    range = [0, indicator.max];
                    if (indicator.min) {
                        range = [0, Math.max(Math.abs(indicator.min), Math.abs(indicator.max))];
                    }
                }
                else {
                    range = [0, max];
                }
                value = Math.abs(value - centerpoint);
            }
            return {
                id: indicator.id,
                value: value,
                type: indicator.type,
                diverging: diverging,
                weight: indicator.userWeighting
                    ? Number(indicator.userWeighting)
                    : Number(indicator.weighting),
                invert: indicator.invert,
                // invert: indicator.invert === true,
                range: range,
            };
        }
        function indexEntity(entity, calculationList, overwrite) {
            if (overwrite === void 0) { overwrite = allowOverwrite; }
            var newEntity = clone(entity);
            calculationList.forEach(function (parentIndicatorID) {
                if ((newEntity[parentIndicatorID] && overwrite === true) || !newEntity[parentIndicatorID]) {
                    // get the required component indicators to calculate the parent value
                    // this is a bit brittle maybe?
                    var componentIndicators = indicatorsData
                        .filter(function (indicator) { return (indicator.id.indexOf(parentIndicatorID) === 0 // the
                        && indicator.id.split('.').length === parentIndicatorID.split('.').length + 1); })
                        .filter(function (indicator) { return excludeIndicator(indicator) === false; })
                        .map(function (indicator) { return formatIndicator(indicator, newEntity, indexMax); });
                    // calculate the weighted mean of the component indicators on the newEntity
                    // assign that value to the newEntity
                    newEntity[parentIndicatorID] = calculateWeightedMean(componentIndicators, indexMax, clamp);
                }
                else {
                    console.warn("retaining existing value for ".concat(newEntity.name, " - ").concat(parentIndicatorID, " : ").concat(Number(entity[parentIndicatorID])));
                    newEntity[parentIndicatorID] = Number(entity[parentIndicatorID]);
                }
            });
            var pillarIndicators = indicatorsData
                .filter(function (indicator) { return String(indicator.id).match(indicatorIdTest) && indicator.id.split('.').length === 1; })
                .map(function (indicator) { return formatIndicator(indicator, newEntity, indexMax); });
            newEntity.value = calculateWeightedMean(pillarIndicators, indexMax, clamp);
            if (!newEntity.user) {
                newEntity.user = {};
            }
            return newEntity;
        }
        function getIndexableIndicators() {
            return indicatorsData
                .filter(function (i) {
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
            if ((!indicatorID && !value) || !e.user) {
                var newUser = {};
                e.user = newUser; // no value or indicator specified, reset
            }
            else if (!value && e.user) {
                delete e.user[indicatorID]; // no value specified, reset the indicator
            }
            if (indicatorLookup[indicatorID] && indicatorLookup[indicatorID].type === IndicatorType.CALCULATED) {
                console.warn("".concat(indicatorID, " is a calculated value and can not be adjusted directly, perhaps you meant to adjust the weighting?"));
                return clone(e);
            }
            if (indicatorID !== undefined && value !== undefined) {
                e.user[indicatorID] = value;
            }
            var onlyIdIndicators = getIndexableIndicators();
            var calculationList = getCalculationList(onlyIdIndicators);
            indexedData[e.name] = indexEntity(e, calculationList, true);
            // console.log(indexedData[e.name])
            var adjustedEntity = Object.assign(clone(indexedData[e.name]), indexedData[e.name].user);
            delete adjustedEntity.user;
            delete adjustedEntity.data;
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
            var onlyIdIndicators = getIndexableIndicators();
            var calculationList = getCalculationList(onlyIdIndicators);
            indexStructure = createStructure(onlyIdIndicators.map(function (i) { return i.id; }));
            entitiesData.forEach(function (entity) {
                var indexedEntity = indexEntity(entity, calculationList, overwrite);
                indexedEntity.data = entity;
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
            if (exclude === void 0) { exclude = function () { return false; }; }
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
            indexStructure: indexStructure,
            debug: indexStructure
        };
    };

    return index;

}));
//# sourceMappingURL=bundle.js.map
