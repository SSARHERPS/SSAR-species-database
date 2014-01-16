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

## Libraries
Submodules have their own dependencies -- see the submodule pages for their included modules.

Considering replacing the "current" [reCAPTCHA](https://developers.google.com/recaptcha/docs/php) API v1.11 [provided by Google in 2010](https://code.google.com/p/recaptcha/downloads/list?q=label:phplib-Latest) with the [php5 version o GitHub](https://github.com/AlekseyKorzun/reCaptcha-PHP-5).

## To Do
Refactor to play nice with a default user made when instantiating class.
