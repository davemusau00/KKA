import assert from 'node:assert/strict';
import test from 'node:test';
import { SavePageSchema, SaveFormSchema } from '../src/modules/website/website.schemas';

test('website pages preserve nested JSON and custom SEO fields', () => {
  const seo = { title: 'Practice', structuredData: { tags: ['law', null], enabled: true } };
  const content = { sections: [{ text: 'Welcome', count: 2 }], image: null };
  const page = SavePageSchema.parse({ title: 'Practice', seo, blocks: [{ blockType: 'RICH_TEXT', content }] });
  assert.deepEqual(page.seo, seo);
  assert.deepEqual(page.blocks[0]?.content, content);
});

test('website JSON fields reject values that cannot be stored as JSON', () => {
  for (const invalid of [undefined, () => {}, BigInt(1), new Date(), Infinity]) {
    assert.equal(SavePageSchema.safeParse({ title: 'Practice', seo: { custom: invalid } }).success, false);
    assert.equal(SavePageSchema.safeParse({ title: 'Practice', blocks: [{ blockType: 'RICH_TEXT', content: { invalid } }] }).success, false);
  }
});

test('form definitions preserve JSON routing and schema defaults', () => {
  const form = { key: 'enquiry', name: 'Enquiry', consentText: 'I agree to be contacted.' };
  const defaults = SaveFormSchema.parse(form);
  assert.deepEqual(defaults.schema, {});
  assert.deepEqual(defaults.routing, {});
  const routing = { rules: [{ area: 'family', assignee: null }] };
  assert.deepEqual(SaveFormSchema.parse({ ...form, routing }).routing, routing);
  assert.equal(SaveFormSchema.safeParse({ ...form, routing: { handler: () => {} } }).success, false);
});
