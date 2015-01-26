SSAR Species Name Database
======================

You can find the most current version at http://ssarherps.org/cndb/

The adminstrative page can be accessed by going to http://ssarherps.org/cndb/admin-page.html

## API

### Default search

1. Case 1: No space:
  Lookup columns `common_name`,`genus`,`species`,`major_common_type`,`major_subtype`, and `deprecated_scientific` in that order. Filter types if specified.
2. Case 2: 1 or 2 spaces:
  Lookup matched pair for exploded string in `genus`,`species`,`subspecies`; if this returns a hit, stop. Otherwise, look at whole string in `common name`
3. Case 3: Numeric:
  Lookup by `authority_year` only.

### Search flags

1. `fuzzy`: if truthy, use a similar sounding search for results, like SOUNDEX. Note this won't work for authority years or deprecated scientific names. **Default `false`**
2. `loose`: Truthy. Don't check for strict matches, allow partials and case-insensitivity **Application default `true`; API default `false`**
3. `only`: restrict search to this csv column list. Return an error if invalid column specified.
4. `include`: Include additional search columns in this csv list. Return an error if invalid column specified.
5. `type`: restrict search to this `major_type`. Literal scientific match only. Return an error if the type does not exist. **Default none**
6. `filter`: restrict search by this list of {"`column`":"value"} object list. Requires key "BOOLEAN_TYPE" set to either "AND" or "OR". Return an error if the key does not exist, or if an unknown column is specified. **Default none**
7. `limit`: Search result return limit. **Default unlimited**
8. `order`: A csv list of columns to order by. **Defaults to genus, species, subspecies**

### Search behaviour

The search algorithm behaves as follows:

1. If the search `is_numeric()`, a `loose` search is done against the
   `authority_year` column in the database. The returned `method` with
   the JSON is `authority_year`. [Example](http://ssarherps.org/cndb/commonnames_api.php?q=2014&loose=true):

    ```json
    {"status":true,"result":{"0":{"id":"562","genus":"eurycea","species":"subfluvicola","subspecies":"","common_name":"ouachita streambed salamander","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"brook salamanders","minor_type":"","linnean_order":"caudata","genus_authority":"rafinesque","species_authority":"steffen, irwin, blair, and bonett","authority_year":"{\"1822\": \"2014\"}","deprecated_scientific":"","notes":""},"1":{"id":"70","genus":"macrochelys","species":"appalachicolae","subspecies":"","common_name":"suwannee alligator snapping turtle","image":"","major_type":"testudines","major_common_type":"turtles","major_subtype":"alligator snapping turtles","minor_type":"","linnean_order":"testudines","genus_authority":"gray","species_authority":"thomas, granatosky, bourque, krysko, moler, gamble, suarez, leone, enge, and roman","authority_year":"{\"1855\": \"2014\"}","deprecated_scientific":"","notes":""}},"count":2,"method":"year_search","query":"2014","params":{"authority_year":"2014"},"query_params":{"bool":false,"loose":true,"order_by":"genus,species,subspecies","filter":{"had_filter":false,"filter_params":null,"filter_literal":null}},"execution_time":1.98006629944}
    ```

2. The search is then checked for the absence of the space
   character. If no overrides are set, `common_name`, `genus`,
   `species`, `subspecies`, `major_common_type`, `major_subtype`, and
   `deprecated_scientific` columns are all searched. The returned `method` is
   `spaceless_search`. [Example](http://ssarherps.org/cndb/commonnames_api.php?q=arboreal&loose=true):

    ```json
    {"status":true,"result":{"0":{"id":"484","genus":"aneides","species":"lugubris","subspecies":"","common_name":"arboreal salamander","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"climbing salamanders","minor_type":"","linnean_order":"caudata","genus_authority":"baird","species_authority":"hallowell","authority_year":"{\"1851\": \"1849\"}","deprecated_scientific":"","notes":""}},"count":1,"method":"spaceless_search","query":"arboreal","params":{"common_name":"arboreal","genus":"arboreal","species":"arboreal","subspecies":"arboreal","major_common_type":"arboreal","major_subtype":"arboreal","deprecated_scientific":"arboreal"},"query_params":{"bool":"OR","loose":true,"order_by":"genus,species,subspecies","filter":{"had_filter":false,"filter_params":null,"filter_literal":null}},"execution_time":3.57890129089}
    ```

3. The search is then checked for spaces.
   1. If a `filter` is set (with the required `boolean_type` parameter):
      1. If there is two or three words, the first word is checked
         against the `genus` column, second against the `species` column,
         and third against the `subspecies` column. The returned `method` is `scientific`. [Example](http://ssarherps.org/cndb/commonnames_api.php?q=farancia+erytrogramma&loose=true&filter={%22species_authority%22:%22neill%22,%22boolean_type%22:%22and%22})

          ```json
          {"status":true,"result":{"0":{"id":"235","genus":"farancia","species":"erytrogramma","subspecies":"seminola","common_name":"southern florida rainbow snake","image":"","major_type":"squamata","major_common_type":"snakes","major_subtype":"mudsnakes and rainbow snakes","minor_type":"","linnean_order":"serpentes","genus_authority":"gray","species_authority":"neill","authority_year":"{\"1842\": \"1964\"}","deprecated_scientific":"","notes":""}},"count":1,"method":"scientific","query":"farancia erytrogramma","params":{"species_authority":"neill"},"query_params":{"bool":"and","loose":true,"order_by":"genus,species,subspecies","filter":{"had_filter":true,"filter_params":{"species_authority":"neill","boolean_type":"and"},"filter_literal":"{\"species_authority\":\"neill\",\"boolean_type\":\"and\"}"}},"execution_time":2.66885757446}
          ```
      2. If the above returns no results, the `deprecated_scientific`
         column is checked. At the time of this writing, there are no
         entries in this column and this check will always fail. The
         returned method is `deprecated_scientific`.

      3. If the above returns no results, the `common_name` column is
         checked. The returned method is `no_scientific_common`. [Example](http://ssarherps.org/cndb/commonnames_api.php?q=rainbow+snake&loose=true&filter={%22species_authority%22:%22neill%22,%22boolean_type%22:%22and%22}):

         ```json
         {"status":true,"result":{"0":{"id":"235","genus":"farancia","species":"erytrogramma","subspecies":"seminola","common_name":"southern florida rainbow snake","image":"","major_type":"squamata","major_common_type":"snakes","major_subtype":"mudsnakes and rainbow snakes","minor_type":"","linnean_order":"serpentes","genus_authority":"gray","species_authority":"neill","authority_year":"{\"1842\": \"1964\"}","deprecated_scientific":"","notes":""}},"count":1,"method":"no_scientific_common","query":"rainbow snake","params":{"species_authority":"neill"},"query_params":{"bool":"and","loose":true,"order_by":"genus,species,subspecies","filter":{"had_filter":true,"filter_params":{"species_authority":"neill","boolean_type":"and"},"filter_literal":"{\"species_authority\":\"neill\",\"boolean_type\":\"and\"}"}},"execution_time":1.58905982971}
         ```

    2. If the `filter` parameter isn't specified, the above scientific
       and deprecated scientific searches are executed with
       "best-guess" boolean types (with returned `method`s
       `scientific_raw` and `deprecated_scientific_raw`). [Example](http://ssarherps.org/cndb/commonnames_api.php?q=taricha+torosa&loose=true):

       ```json
       {"status":true,"result":{"0":{"id":"683","genus":"taricha","species":"torosa","subspecies":"","common_name":"california newt","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"pacific newts","minor_type":"","linnean_order":"caudata","genus_authority":"gray","species_authority":"rathke, in eschscholtz","authority_year":"{\"1850\": \"1833\"}","deprecated_scientific":"","notes":""}},"count":1,"method":"scientific_raw","query":"taricha torosa","params":{"genus":"taricha","species":"torosa"},"query_params":{"bool":"and","loose":true,"order_by":"genus,species,subspecies","filter":{"had_filter":false,"filter_params":null,"filter_literal":null}},"execution_time":0.568151473999}
       ```

       1. If all these fail, and `fuzzy` is `false`, the `fallback`
          flag is set and a search is done against `common_name`. The
          returned `method` is
          `space_common_fallback`. [Example](http://ssarherps.org/cndb/commonnames_api.php?q=rainbow+snake&loose=true):

          ```json
          {"status":true,"result":{"0":{"id":"233","genus":"farancia","species":"erytrogramma","subspecies":"","common_name":"rainbow snake","image":"","major_type":"squamata","major_common_type":"snakes","major_subtype":"mudsnakes and rainbow snakes","minor_type":"","linnean_order":"serpentes","genus_authority":"gray","species_authority":"palisot de beauvois in sonnini and latreille","authority_year":"{\"1842\": \"1801\"}","deprecated_scientific":"","notes":""},"1":{"id":"234","genus":"farancia","species":"erytrogramma","subspecies":"erytrogramma","common_name":"common rainbow snake","image":"","major_type":"squamata","major_common_type":"snakes","major_subtype":"mudsnakes and rainbow snakes","minor_type":"","linnean_order":"serpentes","genus_authority":"gray","species_authority":"palisot de beauvois in sonnini and latreille","authority_year":"{\"1842\": \"1801\"}","deprecated_scientific":"","notes":""},"2":{"id":"235","genus":"farancia","species":"erytrogramma","subspecies":"seminola","common_name":"southern florida rainbow snake","image":"","major_type":"squamata","major_common_type":"snakes","major_subtype":"mudsnakes and rainbow snakes","minor_type":"","linnean_order":"serpentes","genus_authority":"gray","species_authority":"neill","authority_year":"{\"1842\": \"1964\"}","deprecated_scientific":"","notes":""}},"count":3,"method":"space_common_fallback","query":"rainbow snake","params":{"genus":"rainbow","species":"snake","common_name":"rainbow snake"},"query_params":{"bool":"or","loose":true,"order_by":"genus,species,subspecies","filter":{"had_filter":false,"filter_params":null,"filter_literal":null}},"execution_time":0.930070877075}
          ```

      2. If the `fuzzy` flag is set, or the above still gives no
         results and the `loose` flag **is** set, a search is done
         word-wise on `common_name`, `major_common_type`, and
         `major_subtype` (eg, for all matches that contain each word
         as a substring in any of the columns). The returned `method`
         is `space_loose_fallback`. [Example](http://ssarherps.org/cndb/commonnames_api.php?q=salamander+black&loose=true)

         ```json
         {"status":true,"result":{"0":{"id":"480","genus":"aneides","species":"flavipunctatus","subspecies":"","common_name":"black salamander","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"climbing salamanders","minor_type":"","linnean_order":"caudata","genus_authority":"baird","species_authority":"strauch","authority_year":"{\"1851\": \"1870\"}","deprecated_scientific":"","notes":""},"1":{"id":"481","genus":"aneides","species":"flavipunctatus","subspecies":"flavipunctatus","common_name":"speckled black salamander","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"climbing salamanders","minor_type":"","linnean_order":"caudata","genus_authority":"baird","species_authority":"strauch","authority_year":"{\"1851\": \"1870\"}","deprecated_scientific":"","notes":""},"2":{"id":"482","genus":"aneides","species":"flavipunctatus","subspecies":"niger","common_name":"santa cruz black salamander","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"climbing salamanders","minor_type":"","linnean_order":"caudata","genus_authority":"baird","species_authority":"myers and maslin","authority_year":"{\"1851\": \"1948\"}","deprecated_scientific":"","notes":""},"3":{"id":"501","genus":"batrachoseps","species":"nigriventris","subspecies":"","common_name":"black- bellied slender salamander","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"slender salamanders","minor_type":"","linnean_order":"caudata","genus_authority":"bonaparte","species_authority":"cope","authority_year":"{\"1839\": \"1869\"}","deprecated_scientific":"","notes":""},"4":{"id":"519","genus":"desmognathus","species":"folkertsi","subspecies":"","common_name":"dwarf black-bellied salamander","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"dusky salamanders","minor_type":"","linnean_order":"caudata","genus_authority":"baird","species_authority":"camp, tilley, austin, and marshall","authority_year":"{\"1850\": \"2002\"}","deprecated_scientific":"","notes":""},"5":{"id":"529","genus":"desmognathus","species":"quadramaculatus","subspecies":"","common_name":"black-bellied salamander","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"dusky salamanders","minor_type":"","linnean_order":"caudata","genus_authority":"baird","species_authority":"holbrook","authority_year":"{\"1850\": \"1840\"}","deprecated_scientific":"","notes":""},"6":{"id":"531","genus":"desmognathus","species":"welteri","subspecies":"","common_name":"black mountain salamander","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"dusky salamanders","minor_type":"","linnean_order":"caudata","genus_authority":"baird","species_authority":"barbour","authority_year":"{\"1850\": \"1950\"}","deprecated_scientific":"","notes":""},"7":{"id":"670","genus":"pseudotriton","species":"ruber","subspecies":"schencki","common_name":"black-chinned red salamander","image":"","major_type":"caudata","major_common_type":"salamanders","major_subtype":"red and mud salamanders","minor_type":"","linnean_order":"caudata","genus_authority":"tschudi","species_authority":"brimley","authority_year":"{\"1846\": \"1912\"}","deprecated_scientific":"","notes":""}},"count":8,"method":"space_loose_fallback","query":"salamander black","params":null,"query_params":{"bool":"or","loose":true,"fuzzy":false,"order_by":"genus,species,subspecies","filter":{"had_filter":false,"filter_params":null,"filter_literal":null}},"execution_time":1.25002861023}
         ```

## Building the application

### Grunt

Tasks are managed here by [Grunt](http://gruntjs.com/). The most important tasks also have a `Cakefile` to run it directly via `cake` at the command line (for the CoffeeScript). This is the reason for `yuicompressor.jar` in the root directory, which requires the [Java JRE](http://www.oracle.com/technetwork/java/javase/downloads/index.html).

You can install Grunt from the command line by running `npm install -g grunt-cli`.

### Updating

You can update the whole application, with dependencies, by running `grunt build` at the root directory.

### Installation

Install this in the `cndb` folder below the root directory of the site. **If this is to be located elsewhere**, change the variable `searchParams.targetApi` in `/coffee/search.coffee` and recompile the coffeescript.

You can re-prepare the files by running `grunt compile` at the root directory.

### Setting up the database

#### Manually preparing the database

1. Take your root Excel file and save it as a CSV
2. Run the file [`parsers/db/clean_and_parse_to_sql.py`](https://github.com/tigerhawkvok/SSAR-species-database/blob/master/parsers/db/clean_and_parse_to_sql.py)
3. The resulting file in the directory root is ready to be imported into the database

#### Manually importing into the database

**NOTE: This will delete the existing table**

1. You can SSH into the database and paste the contents of the `sql` file generated above.
2. Otherwise, you can upload the file, then SSH into the database, and run `source FILENAME.sql` when visiting the database in the `mysql` prompt:

  ```
  mysql> \r DATABASE_NAME
  mysql> source FILENAME.sql
  ```

  This is the most reliable way to do it.

#### Manually updating the database

1. Run the file [`parsers/db/update_sql_from_csv.py`](https://github.com/tigerhawkvok/SSAR-species-database/blob/master/parsers/db/update_sql_from_csv.py) and do as above.

#### Columns

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
linnean_order # Deprecated, included for compatibility
genus_authority #  eg, "Linnaeus"
species_authority # eg, "Attenborough"
authority_year # eg, {2013:2014} in the format {"Genus Authority Year":"Species Authority Year"}
notes # Miscellaneous notes
image # hit calphotos api if this field is empty
```
