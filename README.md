SSAR Species Name Database
======================

## Installation

Install this in the `cndb` folder below the root directory of the site. **If this is to be located elsewhere**, change the variable `searchParams.targetApi` in `/coffee/search.coffee` and recompile the coffeescript.

You can re-prepare the files by running `grunt compile` at the root directory.

## Setting up the database

### Manually preparing the database

1. Take your root Excel file and save it as a CSV
2. Run the file [`parsers/db/clean_and_parse_to_sql.py`](https://github.com/tigerhawkvok/SSAR-species-database/blob/master/parsers/db/clean_and_parse_to_sql.py)
3. The resulting file in the directory root is ready to be imported into the database

### Manually importing into the database

**NOTE: This will delete the existing table**

1. You can SSH into the database and paste the contents of the `sql` file generated above.
2. Otherwise, you can upload the file, then SSH into the database, and run `source FILENAME.sql` when visiting the database in the `mysql` prompt:
  
  ```
  mysql> \r DATABASE_NAME
  mysql> source FILENAME.sql
  ```

  This is the most reliable way to do it.

### Manually updating the database

1. Run the file [`parsers/db/update_sql_from_csv.py`](https://github.com/tigerhawkvok/SSAR-species-database/blob/master/parsers/db/update_sql_from_csv.py) and do as above.

### Columns

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
authority_year # eg, {2013:2014} in the format {"Genus Authority Year":"Species Authority Year"}
notes # Miscellaneous notes
image # hit calphotos api if this field is empty
```

## API

### Default search

1. Case 1: No space:
  Lookup columns `common_name`,`genus`,`species`,`major_common_type`,`major_subtype`, and `deprecated_scientific` in that order. Filter types if specified.
2. Case 2: 1 or 2 spaces:
  Lookup matched pair for exploded string in `genus`,`species`,`subspecies`; if this returns a hit, stop. Otherwise, look at whole string in `common name`
3. Case 3: Numeric:
  Lookup by `authority_year` only.

### Search flags

1. `fuzzy`: if truthy, use a similar sounding search for results, like SOUNDEX. Note this won't work for authority years or deprecated scientific names.
2. `only`: restrict search to this csv column list. Return an error if invalid column specified.
3. `include`: Include the additional columns in this csv list. Return an error if invalid column specified.
4. `type`: restrict search to this `major_type`. Literal scientific match only. Return an error if the type does not exist.
5. `filter`: restrict search by this list of {"`column`":"value"} object list. Requires key "BOOLEAN_TYPE" set to either "AND" or "OR". Return an error if the key does not exist, or if an unknown column is specified.
6. `limit`: Search result return limit.
7. `loose`: Don't check for strict matches, allow partials
8. `order`: A csv list of columns to order by. Defaults to genus, species, subspecies.
