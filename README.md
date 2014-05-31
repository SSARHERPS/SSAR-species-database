#PHP-Userhandler

This is a repo meant to deal with the vast majority of handling cases for user work:

- Creation
- Login
- Authentication after-the-fact
- Forgotten passwords
- One-Time Passwords
- Etc

## Libraries

Libraries that may need minor tweaking to "play nice" have been included as subtrees, and those that should be used verbatim have been included as submodules.

Considering replacing the "current" [reCAPTCHA](https://developers.google.com/recaptcha/docs/php) API v1.11 [provided by Google in 2010](https://code.google.com/p/recaptcha/downloads/list?q=label:phplib-Latest) with the [php5 version on GitHub](https://github.com/AlekseyKorzun/reCaptcha-PHP-5).

### Subtrees

- [otphp](https://github.com/Spomky-Labs/otphp) is a subtree in the `totp/` directory. The relevant files are in `totp/lib/OTPHP`. The command to update this is `git subtree pull --prefix totp otphp master --squash`
- [base32](https://github.com/ChristianRiesen/base32) is a subtree in the `base32/` directory. The relevant files are in `base32/src/Base32/Base32.php`. The command to update this is `git subtree pull --prefix base32 base32 master --squash`
- [phpqrcode](https://github.com/t0k4rt/phpqrcode) is a subtree in the `qr/` directory. The relevant files are in `qr/qrlib.php`. The command to update this is `git subtree pull --prefix q master --squash`

### Submodules

Submodules have their own dependencies -- see the submodule pages for their included modules. These are updated by calling `git pull origin master` in their directories.

- [php-stronghash](https://github.com/tigerhawkvok/php-stronghash) in the `stronghash/` directory.
- [php-multioauth](https://github.com/tigerhawkvok/php-multioauth) in the `oauth/` directory. **This is a work in progress and is not yet fully integrated**.


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
secret
emergency_code
```
