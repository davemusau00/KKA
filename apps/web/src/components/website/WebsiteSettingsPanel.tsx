import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, AtSign, Check, ExternalLink, Facebook, Instagram, Link2, Linkedin, Loader2, Plus, Save, Trash2, Youtube } from 'lucide-react';
import { websiteApi } from '../../lib/websiteApi';
import { useApp } from '../../context/AppContext';
import {
  PUBLIC_ROUTES,
  SOCIAL_PLATFORMS,
  type NavigationItem,
  type SocialLink,
  type WebsiteSettingsEditor,
  normalizeSettings,
  serializeSettings,
} from './websiteEditorModels';
import { WebsitePreview } from './WebsitePreview';

export const WebsiteSettingsPanel: React.FC = () => {
  const { hasUserPermission } = useApp();
  const [value, setValue] = useState<WebsiteSettingsEditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    websiteApi.settings()
      .then(raw => setValue(normalizeSettings(raw)))
      .catch((reason: any) => setError(reason.message || String(reason)))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !value) return <div className="admin-card min-h-56 grid place-items-center"><Loader2 className="animate-spin text-amber-500" /></div>;

  const update = (patch: Partial<WebsiteSettingsEditor>) => {
    setValue(current => current ? { ...current, ...patch } : current);
    setSaved('');
  };
  const updateSeo = (patch: Partial<WebsiteSettingsEditor['defaultSeo']>) => update({ defaultSeo: { ...value.defaultSeo, ...patch } });
  const updateFooter = (patch: Partial<WebsiteSettingsEditor['footer']>) => update({ footer: { ...value.footer, ...patch } });

  async function save() {
    setError('');
    setSaved('');
    const validation = validateSettings(value);
    if (validation) { setError(validation); return; }
    setSaving(true);
    try {
      await websiteApi.saveSettings(serializeSettings(value));
      setSaved('Website settings saved. Publish the website when the changes are ready for visitors.');
    } catch (reason: any) {
      setError(reason.message || String(reason));
    } finally {
      setSaving(false);
    }
  }

  return <div className="space-y-5 min-w-0">
    <div className="admin-card overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[.14em] text-amber-600 dark:text-amber-400 font-semibold">Website identity</p>
          <h2 className="text-xl font-semibold mt-1">Public website settings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Keep the firm’s contact details, navigation, search appearance, and footer copy up to date. Public visual styling is managed centrally.</p>
        </div>
        <button className="admin-btn-primary min-h-11 shrink-0" disabled={saving} onClick={save}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settings</button>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        <SettingsSection title="Firm identity" description="The information visitors see in the header, contact areas, and search results.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Firm name" required><input className="admin-input" value={value.firmName} onChange={e => update({ firmName: e.target.value })} /></Field>
            <Field label="Tagline"><input className="admin-input" value={value.tagline} onChange={e => update({ tagline: e.target.value })} placeholder="Justice Today. A Stronger Tomorrow." /></Field>
            <Field label="Phone number"><input className="admin-input" value={value.phone} onChange={e => update({ phone: e.target.value })} placeholder="0722 333 569" /></Field>
            <Field label="Email address" required><input className="admin-input" type="email" value={value.email} onChange={e => update({ email: e.target.value })} placeholder="info@yourfirm.co.ke" /></Field>
            <Field label="Office address" wide hint="Use line breaks for floor, building, city, and country."><textarea className="admin-input min-h-24" value={value.address} onChange={e => update({ address: e.target.value })} /></Field>
          </div>
        </SettingsSection>

        <SettingsSection title="Navigation" description="Choose the pages visitors can reach from the public site menu.">
          <div className="space-y-3">
            {value.navigation.map((item, index) => <NavigationRow key={`${index}-${item.url}`} item={item} index={index} total={value.navigation.length} onChange={next => update({ navigation: replaceAt(value.navigation, index, next) })} onMove={delta => update({ navigation: moveItem(value.navigation, index, delta) })} onRemove={() => update({ navigation: value.navigation.filter((_, itemIndex) => itemIndex !== index) })} />)}
          </div>
          <button type="button" className="admin-btn-secondary min-h-11 mt-4" onClick={() => update({ navigation: [...value.navigation, { label: '', url: '/' }] })}><Plus className="w-4 h-4" /> Add menu item</button>
        </SettingsSection>

        <SettingsSection title="Social links" description="Add the firm profiles shown in the public footer.">
          <div className="space-y-3">
            {value.socials.map((item, index) => <SocialRow key={`${index}-${item.url}`} item={item} index={index} total={value.socials.length} onChange={next => update({ socials: replaceAt(value.socials, index, next) })} onMove={delta => update({ socials: moveItem(value.socials, index, delta) })} onRemove={() => update({ socials: value.socials.filter((_, itemIndex) => itemIndex !== index) })} />)}
          </div>
          <button type="button" className="admin-btn-secondary min-h-11 mt-4" onClick={() => update({ socials: [...value.socials, { label: 'LinkedIn', platform: 'LinkedIn', url: '' }] })}><Plus className="w-4 h-4" /> Add social link</button>
        </SettingsSection>

        <SettingsSection title="Search appearance" description="These defaults apply when an individual page does not have its own search settings.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Default search title"><input className="admin-input" value={value.defaultSeo.title} onChange={e => updateSeo({ title: e.target.value })} placeholder={value.firmName || 'Your firm name'} /></Field>
            <Field label="Canonical site address" hint="Leave blank to use the current page address."><input className="admin-input" type="url" value={value.defaultSeo.canonical} onChange={e => updateSeo({ canonical: e.target.value })} placeholder="https://www.example.co.ke" /></Field>
            <Field label="Default search description" wide><textarea className="admin-input min-h-24" value={value.defaultSeo.description} onChange={e => updateSeo({ description: e.target.value })} placeholder="A short description of the firm and its legal services." /></Field>
            <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-sm cursor-pointer hover:border-amber-400 dark:hover:border-amber-700"><input className="mt-1 h-4 w-4 accent-amber-600" type="checkbox" checked={value.defaultSeo.noindex} onChange={e => updateSeo({ noindex: e.target.checked })} /><span><strong className="block">Hide the public site from search engines</strong><span className="text-xs text-slate-500">Use this only while the site is intentionally private or under review.</span></span></label>
          </div>
        </SettingsSection>

        <SettingsSection title="Footer statement" description="The short closing statement shown beside the firm logo in the public footer.">
          <Field label="Footer statement" wide><textarea className="admin-input min-h-24" value={value.footer.statement} onChange={e => updateFooter({ statement: e.target.value })} placeholder={value.tagline || 'Justice Today. A Stronger Tomorrow.'} /></Field>
          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 flex gap-2"><Link2 className="w-4 h-4 text-amber-500 shrink-0" /> Contact details and service links are managed from the firm settings and Content sections so they stay consistent across the public site.</div>
        </SettingsSection>
      </div>

      {(error || saved) && <div className={`mx-4 sm:mx-6 mb-5 rounded-xl p-4 text-sm flex items-start gap-2 ${error ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'}`} role={error ? 'alert' : 'status'}>{error ? <ExternalLink className="w-4 h-4 mt-0.5" /> : <Check className="w-4 h-4 mt-0.5" />}{error || saved}</div>}
    </div>
    {hasUserPermission('website.edit' as any) ? <WebsitePreview slug="/" draft={{ settings: serializeSettings(value) }} /> : <div className="admin-card p-4 text-sm text-slate-500">Live preview is available to website editors. You can still save settings for review.</div>}
  </div>;
};

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4"><div><h3 className="font-semibold text-base">{title}</h3><p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{description}</p></div>{children}</section>;
}

function Field({ label, hint, required, wide, children }: { label: string; hint?: string; required?: boolean; wide?: boolean; children: React.ReactNode }) {
  return <label className={`grid gap-1.5 text-sm text-slate-700 dark:text-slate-300 ${wide ? 'md:col-span-2' : ''}`}><span className="font-medium">{label}{required && <span className="text-amber-600 ml-1" aria-hidden="true">*</span>}</span>{children}{hint && <span className="text-xs text-slate-500">{hint}</span>}</label>;
}

function RowActions({ index, total, onMove, onRemove }: { index: number; total: number; onMove: (delta: number) => void; onRemove: () => void }) {
  return <div className="flex items-center gap-1 shrink-0"><button type="button" className="admin-btn-ghost min-h-10 px-2" aria-label="Move item up" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="w-4 h-4" /></button><button type="button" className="admin-btn-ghost min-h-10 px-2" aria-label="Move item down" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown className="w-4 h-4" /></button><button type="button" className="admin-btn-ghost min-h-10 px-2 text-rose-500" aria-label="Remove item" onClick={onRemove}><Trash2 className="w-4 h-4" /></button></div>;
}

function NavigationRow({ item, index, total, onChange, onMove, onRemove }: { item: NavigationItem; index: number; total: number; onChange: (item: NavigationItem) => void; onMove: (delta: number) => void; onRemove: () => void }) {
  const known = PUBLIC_ROUTES.some(route => route.url === item.url);
  return <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_auto] items-end rounded-xl border border-slate-200 dark:border-slate-800 p-3"><Field label="Menu label" required><input className="admin-input" value={item.label} onChange={e => onChange({ ...item, label: e.target.value })} placeholder="About the firm" /></Field><Field label="Page or link"><select className="admin-input" value={known ? item.url : '__custom__'} onChange={e => onChange({ ...item, url: e.target.value === '__custom__' ? '' : e.target.value })}><option value="__custom__">Custom or external link</option>{PUBLIC_ROUTES.map(route => <option key={route.url} value={route.url}>{route.label} ({route.url})</option>)}</select>{!known && <input className="admin-input mt-2" value={item.url} onChange={e => onChange({ ...item, url: e.target.value })} placeholder="https://example.co.ke or /campaign" />}</Field><RowActions index={index} total={total} onMove={onMove} onRemove={onRemove} /></div>;
}

function SocialRow({ item, index, total, onChange, onMove, onRemove }: { item: SocialLink; index: number; total: number; onChange: (item: SocialLink) => void; onMove: (delta: number) => void; onRemove: () => void }) {
  return <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto] items-end rounded-xl border border-slate-200 dark:border-slate-800 p-3"><Field label="Platform"><div className="flex items-center gap-2"><PlatformIcon platform={item.platform} /><select className="admin-input" value={item.platform} onChange={e => onChange({ ...item, platform: e.target.value as SocialLink['platform'], label: e.target.value === 'Other' ? item.label : e.target.value })}>{SOCIAL_PLATFORMS.map(platform => <option key={platform}>{platform}</option>)}</select></div></Field><Field label={item.platform === 'Other' ? 'Display label' : `${item.platform} profile URL`} required><input className="admin-input" type="url" value={item.url} onChange={e => onChange({ ...item, url: e.target.value })} placeholder="https://" /></Field><RowActions index={index} total={total} onMove={onMove} onRemove={onRemove} /></div>;
}

function PlatformIcon({ platform }: { platform: SocialLink['platform'] }) { const props = { className: 'h-4 w-4 shrink-0 text-amber-600', 'aria-hidden': true as const }; if (platform === 'LinkedIn') return <Linkedin {...props} />; if (platform === 'Facebook') return <Facebook {...props} />; if (platform === 'Instagram') return <Instagram {...props} />; if (platform === 'YouTube') return <Youtube {...props} />; return <AtSign {...props} />; }

function replaceAt<T>(items: T[], index: number, value: T) { return items.map((item, itemIndex) => itemIndex === index ? value : item); }
function moveItem<T>(items: T[], index: number, delta: number) { const next = [...items]; const target = index + delta; if (target < 0 || target >= next.length) return next; [next[index], next[target]] = [next[target], next[index]]; return next; }
function validateSettings(value: WebsiteSettingsEditor) {
  if (value.firmName.trim().length < 2) return 'Enter the firm name.';
  if (!/^\S+@\S+\.\S+$/.test(value.email.trim())) return 'Enter a valid firm email address.';
  const labels = value.navigation.map(item => item.label.trim().toLowerCase()).filter(Boolean);
  if (labels.length !== new Set(labels).size) return 'Each navigation item needs a unique label.';
  for (const item of value.navigation) {
    if (!item.label.trim() || !item.url.trim()) return 'Complete each navigation item or remove it.';
    if (!/^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(item.url.trim())) return `The link for “${item.label}” is not a supported web address.`;
  }
  for (const item of value.socials) {
    if (!item.url.trim()) return `Enter a profile URL for ${item.platform}.`;
    if (!/^https?:\/\//i.test(item.url.trim())) return `Enter a complete https:// address for ${item.platform}.`;
  }
  if (value.defaultSeo.canonical && !/^https?:\/\//i.test(value.defaultSeo.canonical.trim())) return 'The canonical site address must begin with https:// or http://.';
  return '';
}
