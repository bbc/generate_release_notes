var generate = require('./generate_release_notes.js');

var NOT_SET = 'not set';

var params = {
    repo: NOT_SET,
    'save-to': NOT_SET,
    token: NOT_SET,
    'readme-location': NOT_SET,
    'style-sheet-location': NOT_SET,
    'from-tag-name': NOT_SET,
    'last-releases': NOT_SET
}

function isParamSet(name) {
    return params[name] !== NOT_SET
}

process.argv.forEach(function(arg) {
    Object.keys(params).forEach(function(key) {
        setParam(arg, key)
    })
    if (~arg.indexOf('--usage') || ~arg.indexOf('--help')) {
        printUseage();
    }
})

function setParam(arg, name) {
    if (~arg.indexOf('--' + name)) {
        params[name] = arg.split('=')[1];
    }
}

function printUseage(exitNum) {
    exitNum = exitNum || 0;
    console.log('This generates two files');
    console.log('notes.html: a view of your change logs and readme');
    console.log('changelogs.json: the github dump');
    console.log('You need the following params');
    console.log('    --repo=:owner/:repo');
    console.log('The following params are optional');
    console.log('    --save-to=folder_location saves notes.html and changelog.json to this folder, defaults to ./');
    console.log('    --token=xxx the github oatuh token');
    console.log('    --from-tag-name=x.x.x.x.x.x... assumption it is a versioned number');
    console.log('    --last-releases=X gets the last X releases');
    console.log('    --readme-location=file_location this will be in the top of notes.html, will not be present when not given');
    console.log('    --usage or --help exits and displays this message');
    console.log('    --style-sheet-location adds style sheet for notes.html, will still look like readme');
    process.exit(exitNum);
}


if (!isParamSet('repo')) {
    printUseage(1);
} else {
    generate.create(params);
}
