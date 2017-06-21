const fs = require('fs');
const path = require('path');

var time = Date.now();

// Load the shrinkwrap
const SHRINKWRAP_FILE = path.join(__dirname, '..', 'npm-shrinkwrap.json');
const shrinkwrap = JSON.parse(fs.readFileSync(SHRINKWRAP_FILE, 'utf8'));

// Fix up an issue with the shrinkwrap caused by npm@5.0.3,
// where nested dependencies in the shrinkwrap have the "resolved"
// URL as "version" key, and are missing the "resolved" key
function fixup(dependency) {

  // If the dependency version is a URL and
  // the "resolved" key is missing, we need to fix it
  if (!dependency.resolved && /^http(s):/i.test(dependency.version)) {

    // Extract the version number from the registry URL
    var match = dependency.version.match(/(\d+\.\d+\.\d+(\-.+)?)\.tgz$/);

    // If something goes wrong, we do not want
    // this to continue in any way; so we crash
    if (!match || !match[1]) {
      throw new Error(`Unable to extract version from "${dependency.version}"`);
    }

    // We need to do some property magic here to
    // maintain the same order of keys as npm generates
    // when writing out, to not swap lines and create a diff
    var integrity = dependency.integrity;
    var dependencies = dependency.dependencies;

    dependency.integrity = void 0;
    dependency.dependencies = void 0;

    delete dependency.integrity;
    delete dependency.dependencies;

    // Set "resolved" to the registry URL,
    // and "version" to the extracted version:
    dependency.resolved = dependency.version;
    dependency.version = match[1];

    // Put deleted properties back to maintain key order
    dependency.integrity = integrity;
    dependency.dependencies = dependencies;

    return true;

  }

  return false;

}

// Walk the shrinkwrap dependency tree,
// and fix up any mangled versions along the way
// while counting how many have been fixed (because, why not?)
function walk(tree) {

  if (!tree.dependencies) {
    return 0; // Nothing to do here
  }

  var keys = Object.keys(tree.dependencies);
  var fixes = 0;
  var dep = null;

  for (var i = 0; i < keys.length; i++) {
    dep = tree.dependencies[keys[i]];
    fixes += fixup(dep) ? 1 : 0;
    fixes += walk(dep);
  }

  return fixes;

}

const fixes = walk(shrinkwrap);

// Save the shrinkwrap back
fs.writeFileSync(SHRINKWRAP_FILE, JSON.stringify(shrinkwrap, null, 2) + '\n');

time = (Date.now() - time) / 1000;

console.log( `Fixed up ${fixes} dependencies in ${time.toFixed(2)}s` )
