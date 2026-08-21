import assert from'node:assert/strict';
import{existsSync,readFileSync}from'node:fs';
import{spellHdAssets,equipmentHdAssets,hdAssetManifestMeta}from'../assets/js/data/hd-asset-manifest.js';

assert.equal(Object.keys(spellHdAssets).length,189);
assert.equal(Object.keys(equipmentHdAssets).length,130);
assert.deepEqual(hdAssetManifestMeta,{spell:189,equipment:130,total:319});

for(const [kind,map] of [['spell',spellHdAssets],['equipment',equipmentHdAssets]]){
  for(const [key,url] of Object.entries(map)){
    assert.ok(url.startsWith('./assets/hd/'),`${kind}:${key} is not local: ${url}`);
    assert.ok(existsSync(url.slice(2)),`${kind}:${key} missing file ${url}`);
  }
}
const spellSource=readFileSync('assets/js/data/spell-assets.js','utf8');
const equipSource=readFileSync('assets/v8/equipment-images.js','utf8');
assert.ok(spellSource.includes('spellHdAssets'));
assert.ok(equipSource.includes('equipmentHdAssets'));
assert.ok(spellSource.includes('data-spell-primary'));
assert.ok(equipSource.includes('data-equipment-primary'));
assert.ok(!spellSource.includes('v82-final-spell-img"))load(img)'), 'final spell images must not be forced eager');
console.log('V8.2.5 image fast-path validation: PASS');
console.log('spell local direct paths: 189');
console.log('equipment local direct paths: 130');
