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

The server is expected to have the basic number of columns and types listed in `SAMPLE-CONFIG.php`. If you change any of the default mappings, be sure to update the variables.

## Installation

1. Edit `SAMPLE-CONFIG.php` to suit your configuration and re-save it as `CONFIG.php`.
2. Upload this whole directory to your webserver.
3. Where you need access to any login functions or scripts, include `path_to_dir/login.php`.
   1. If you want to actually output the login screen, be sure to print the variable `$login_output`.
4. Set `handlers/temp` as server-writeable.

You're set!

## Debugging odd behavior

The most likely reason for a misbehaving application is something else bound to the document onload handler. Anything you want to be handled on load insert into a function named `lateJS()`, and it will be called by the script.

