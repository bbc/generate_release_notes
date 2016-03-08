var NOT_SET = 'not set';

var params = {
    'repo': NOT_SET,
    'save-to': NOT_SET,
    'token': NOT_SET,
    'readme-location': NOT_SET,
    'style-sheet-location': NOT_SET,
    'from-tag-name': NOT_SET,
    'last-releases': NOT_SET,
    'callback': NOT_SET
}

function isParamSet(name) {
    return params[name] !== NOT_SET
}

var fs = require('fs'),
    markdown = require('marked'),
    Mustache = require('mustache'),
    github = require('octonode');

function create() {
    var notesTemplate = fs.readFileSync(__dirname + '/../templates/notes.html').toString(),
        style = fs.readFileSync(__dirname + '/../templates/notes.css').toString(),
        readme = getExtraFileData('readme-location');

    style += '\n' + getExtraFileData('style-sheet-location');

    var changelogTemplate = fs.readFileSync(__dirname + '/../templates/changelog.md').toString()
    Mustache.parse(changelogTemplate) //optimization

    var client = github.client(params.token);

    var saveFolder = process.cwd()
    if (isParamSet('save-to')) {
        var folder = params['save-to'];
        if (folder.charAt(0) === '.') {
            saveFolder = saveFolder + '/' + folder;
        } else {
            saveFolder = folder;
        }
    }
    if (saveFolder.charAt(saveFolder.length - 1) !== '/') {
        saveFolder += '/';
    }

    if (!fs.existsSync(saveFolder)) {
        console.log('Your folder:', saveFolder, 'does not exist');
        process.exit(1);
    }

    var changelogTemplate = fs.readFileSync(__dirname + '/../templates/changelog.md').toString()
    Mustache.parse(changelogTemplate) //optimization

    client.get('/repos/' + params.repo + '/releases', {}, function(err, status, body, headers) {
        if (err) {
            console.log(err);
            console.log();
            console.log('You might need a token, use --token=xxxx in order to set a token');
            console.log('Or your repo might be wrong, should be  --repo=:owner/:repo');
            process.exit(2);
        }

        var releases = body.filter(function(release) {
            return !isParamSet('from-tag-name') || versionCompare(release.tag_name, params['from-tag-name']) >= 0;
        });

        if (isParamSet('last-releases')) {
            var tmpReleases = [];
            var count = parseInt(params['last-releases']);
            if(releases.length < count) count = releases.length;
            for (var i = 0; i < count; i++) {
                tmpReleases.push(releases[i]);
            }
            releases = tmpReleases;
        }

        fs.writeFileSync(saveFolder + 'changelog.json', JSON.stringify(releases));
        console.log('Saved', saveFolder + 'changelog.json');
        fs.writeFileSync(saveFolder + 'changelog.js', 'window.changelog='+JSON.stringify(releases));
        console.log('Saved', saveFolder + 'changelog.js');


        var changelog = releases.map(function(release) {
            return Mustache.render(changelogTemplate, release) + '\n\n'
        }).join('\n');

        var notes = Mustache.render(notesTemplate, {
            readme: markdown(readme),
            changelog: markdown(changelog),
            style: style
        });

        fs.writeFileSync(saveFolder + 'notes.html', notes)
        console.log('Saved', saveFolder + 'notes.html');

        if(isParamSet('callback')) {
            params.callback({
                notes: notes,
                changelog: changelog
            })
        }
    });
}

function getExtraFileData(name) {
    var data = '';
    if (isParamSet(name)) {
        var fileName = params[name];
        if (fileName.charAt(0) === '.') {
            fileName = process.cwd() + '/' + params[name];
        }
        if (!fs.existsSync(fileName)) {
            console.log('Your file:', fileName, 'does not exist for name:', name);
            process.exit(3);
        }

        data = fs.readFileSync(fileName).toString()
    }
    return data;
}

// shamelessly taken from http://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number
function versionCompare(v1, v2, options) {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        } else if (v1parts[i] > v2parts[i]) {
            return 1;
        } else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}

module.exports = {
    create: function(options) {
        Object.keys(options).forEach(function(key) {
            params[key] = options[key];
        })
        create();
    }
}
