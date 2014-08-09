DBHelper PHP class
===================

## Configuration:

### Short way

```php
$db = new DBHelper(DATABASE,DATABASE_USER,DATABASE_USER_PASSWORD[,$url = "localhost",$table = null]);
# Highly reccommended
$db->setCols(array(col1,col2,...));
```


### Long way

```php
$db = new DBHelper();
$db->setSQLUser($default_sql_user);
$db->setDB($default_user_database);
$db->setSQLPW($default_sql_password);
$db->setSQLURL($sql_url);
$db->setCols($db_cols);
$db->setTable($default_user_table);
```

## Usage

If you want to change the table being used, be sure to use the `setTable` method.
