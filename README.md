#PHP-Userhandler

This is a repo meant to deal with the vast majority of handling cases for user work:

- Creation
- Login
- Authentication after-the-fact
- Forgotten passwords
- Etc


## Server configuration

The database is expected to have the following columns:

```
username
password
pass_meta
creation
status_tracker
name
flag
admin_flag
su_flag
disabled
dtime
last_ip
last_login
auth_key
data
secdata
special_1
special_2
dblink
defaults
public_key
private_key
```
