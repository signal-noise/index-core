# index-core

This ES module provides a way to calculate an EIU style index [what is an index](#what-is-an-index) from a couple of data sources.

- The first data source defines the index's structure, what indicators are taken into account, the nature of those indicators (min & max value, weighting etc). 
- The second provides data on the entities which are being indexed (cities, countries, schools, companies or whatever) primarily what the entities score on each of the indicators but also may include background detail e.g. a region into which a country is grouped, the address of a hospital, the size of corporation and so on.

These data sources are typically derived from CSV spreadsheets and take the form of two arrays of objects with each object representing the data from one row of the CSV -- this is the default form of Javascript object produced by D3's CSV parser. Example sheets can be found in this repos [data](data) directory.

Let's look at the data sources in more depth!

## Indicators
Defines the structure and properties of the index
### required
- __id:__ The `id` property of an tells _index-core_ how an indicator fits into the indexes heirachy as well as providing a unique identifier. The `id` takes the form of a string of single dot separated characters. For example if the `id` is `3.2.4` the indicator belongs to group _3_ and subgroup _2_. Similarly `3.2.4.a` belongs to  group _3_, sub-group _2_, sub- sub-group _4_.
- __weighting:__ The `weighting` property defines how much influence an indicator has on the score of its parent group. It is typically expressed as a proportion between 0 and 1 but can be any number. So typically a group of 3 indicators might have `weighting`s `0.33333`,`0.33333`,`0.33333`. Each indicator's value will contribute one-third towards the parent group score. It might be easier to give them weightings `1`,`1`,`1` which will also mean they all contribute an equal amount but usually a 0-1 or 0-100 scheme is preferable as this is typically what the research team uses. 
- __type:__ This is required on indicators who derive their value from sub indicators and should be set to `calculated`. _Future versions may alow other behaviors to be specified, for example inclusion/exclusion catefories._
### optional
- __max:__ (default `100`) The `max` property specifies the maximum numeric value that an indicator can have. Whilst optional it's a good idea to specify this for clarity and most of the time it will be neccesary for the majority of indicators.That said, on `calculated` indicators it has no meaning or effect.
- __min:__ (default `0`) The minimum value that an indicator can take, this is more oftent han not 0.
- __invert:__ (default `false`) Most indicators contribute positively towards the score of their parent group e.g. high literacy rates are considered a good thing so a big number leads to a big score. Sometimes this is not the case for example a high unemployment rate is usually considered a bad thing so we want high number to contribute negatively to the parent group score. This is achieved by setting the `invert` property to `true`.

## Entities
Defines the things which are being indexed, the content.
### required
- __name:__ a unique identifier string, this is normally the name of an countrty or city or whatever but can be anything as long as it's unique.
- __indicator properties:__ Each entity in the index needs to have a property for each indicator which belongs to the main index structure
### optional
everything else