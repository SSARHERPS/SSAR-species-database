SSAR Species Name Database
======================

## Columns

```php
common_name
genus
species
subspecies
deprecated_scientific # Stored as JSON object, eg {"Genus species":"Authority:Year"}
major_type # eg, squamata
major_common_type # eg, lizard, turtle. 
major_subtype # eg, snake v. non-snake, aquatic vs. tortoise. Only common, public use -- match "expectation"
minor_type # eg, lacertid, boa, pleurodire, dendrobatid; roughly a ranked "family", scientific only
linnean_class # Deprecated, included for compatibility
linnean_order # Deprecated, included for compatibility
genus_authority #  eg, "Linnaeus"
species_authority # eg, "Attenborough"
authority_year # eg, {2013:2014}
notes # Miscellaneous notes
image # hit calphotos api if this field is empty
```

## API

### Default search

1. Case 1: No space:
  Lookup columns `common_name`,`genus`,`species`,`minor_type`, and `deprecated_scientific` in that order. Filter types if specified.
2. Case 2: 1 or 2 spaces:
  Lookup matched pair for exploded string in `genus`,`species`,`subspecies`; if this returns a hit, stop. Otherwise, look at whole string in `common name`
3. Case 3: Numeric:
  Lookup by `authority_year` only.

### Search flags

1. `fuzzy`: if truthy, use a similar sounding search for results, like SOUNDEX.
2. `only`: restrict search to this csv column list. Return an error if invalid column specified.
3. `include`: Include the additional columns in this csv list. Return an error if invalid column specified.
4. `type`: restrict search to this `major_type`. Literal scientific match only. Return an error if the type does not exist.
5. `filter`: restrict search by this list of {"`column`":"value"} object list. Requires key "BOOLEAN_TYPE" set to either "AND" or "OR". Return an error if the key does not exist, or if an unknown column is specified.
6. `count`: Search result return limit.
