import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { Link, createRootRoute, useRouterState, Outlet, createRoute, notFound, createRouter, createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Menu, X, Linkedin, Facebook, Youtube, ArrowRight, Scale, Gavel, Copyright, BriefcaseBusiness, Building2, Play, Users, ShieldCheck, Award } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
const base = "/api/v1".replace(/\/+$/, "");
class PublicApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
async function request(path, init) {
  const r = await fetch(`${base}${path}`, { ...init, headers: { Accept: "application/json", ...init?.body ? { "content-type": "application/json" } : {}, ...init?.headers }, credentials: "omit" });
  if (!r.ok) {
    const b = await r.json().catch(() => ({ message: r.statusText }));
    throw new PublicApiError(typeof b.message === "string" ? b.message : "Please review your information and try again.", r.status, b.fieldErrors || b.message?.fieldErrors || {});
  }
  return r.status === 204 ? void 0 : await r.json();
}
function embeddedSnapshot() {
  if (typeof document === "undefined") return void 0;
  const node = document.getElementById("site-snapshot");
  return node?.textContent ? JSON.parse(node.textContent) : void 0;
}
async function bootstrap() {
  const s = embeddedSnapshot();
  if (s) return { ...s.bootstrap, pages: s.pages };
  return request("/website/public/bootstrap");
}
async function searchSite(q) {
  return request(`/website/public/search?q=${encodeURIComponent(q)}`);
}
async function submitLead(input) {
  return request("/website/public/leads", { method: "POST", body: JSON.stringify(input) });
}
const defaults = [["Home", "/"], ["About Us", "/about"], ["Area of Practice", "/practice-areas"], ["Our Team", "/team"], ["Insights", "/insights"], ["Contact Us", "/contact"]];
function SiteHeader({ settings }) {
  const [open, setOpen] = useState(false), [compact, setCompact] = useState(false);
  const nav = settings.navigation?.length ? settings.navigation.map((x) => [x.label, x.url]) : defaults;
  useEffect(() => {
    const fn = () => setCompact(scrollY > 24);
    addEventListener("scroll", fn, { passive: true });
    fn();
    return () => removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, []);
  const tel = settings.phone.replace(/[^+\d]/g, "");
  return /* @__PURE__ */ jsxs("header", { className: `site-header ${compact ? "is-compact" : ""}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "site-header-inner", children: [
      /* @__PURE__ */ jsxs(Link, { className: "brand", to: "/", "aria-label": `${settings.firmName} home`, children: [
        /* @__PURE__ */ jsx("span", { className: "brand-seal", "aria-hidden": true, children: "Ⅱ" }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: settings.firmName.replace(/ Advocates$/, "") }),
          /* @__PURE__ */ jsx("small", { children: "Advocates" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { "aria-label": "Primary navigation", children: nav.map(([label, to]) => /* @__PURE__ */ jsx("a", { href: to, children: label }, to)) }),
      /* @__PURE__ */ jsxs("div", { className: "header-actions", children: [
        /* @__PURE__ */ jsx(Link, { className: "search-button", to: "/search", "aria-label": "Search", children: /* @__PURE__ */ jsx(Search, { size: 17 }) }),
        /* @__PURE__ */ jsxs(Link, { className: "header-cta", to: "/contact", children: [
          "Contact Us ",
          /* @__PURE__ */ jsx("span", { children: "→" })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "menu-button", onClick: () => setOpen(true), "aria-label": "Open menu", "aria-expanded": open, children: /* @__PURE__ */ jsx(Menu, {}) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `mobile-menu ${open ? "open" : ""}`, "aria-hidden": !open, children: [
      /* @__PURE__ */ jsxs("div", { className: "mobile-menu-head", children: [
        /* @__PURE__ */ jsxs("div", { className: "brand", children: [
          /* @__PURE__ */ jsx("span", { className: "brand-seal", "aria-hidden": true, children: "Ⅱ" }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("b", { children: settings.firmName }),
            /* @__PURE__ */ jsx("small", { children: "Advocates" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setOpen(false), "aria-label": "Close menu", children: /* @__PURE__ */ jsx(X, {}) })
      ] }),
      /* @__PURE__ */ jsx("nav", { children: nav.map(([label, to], i) => /* @__PURE__ */ jsx("a", { href: to, onClick: () => setOpen(false), style: { transitionDelay: `${i * 30}ms` }, children: label }, to)) }),
      /* @__PURE__ */ jsxs("div", { className: "mobile-contact", children: [
        /* @__PURE__ */ jsx("span", { children: "Talk to the firm" }),
        /* @__PURE__ */ jsx("a", { href: `tel:${tel}`, children: settings.phone }),
        /* @__PURE__ */ jsx("a", { href: `mailto:${settings.email}`, children: settings.email })
      ] })
    ] })
  ] });
}
function Social({ label }) {
  const l = label.toLowerCase();
  if (l.includes("linkedin")) return /* @__PURE__ */ jsx(Linkedin, {});
  if (l.includes("facebook")) return /* @__PURE__ */ jsx(Facebook, {});
  if (l.includes("youtube")) return /* @__PURE__ */ jsx(Youtube, {});
  return /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: label.slice(0, 1) });
}
function SiteFooter({ settings, areas }) {
  const socials = (settings.socials || []).filter((s) => s.url && s.url !== "#");
  return /* @__PURE__ */ jsxs("footer", { className: "site-footer", children: [
    /* @__PURE__ */ jsxs("div", { className: "ui-container footer-grid", children: [
      /* @__PURE__ */ jsxs("div", { className: "footer-brand", children: [
        /* @__PURE__ */ jsxs("div", { className: "brand light", children: [
          /* @__PURE__ */ jsx("span", { className: "brand-seal", "aria-hidden": true, children: "Ⅱ" }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("b", { children: settings.firmName }),
            /* @__PURE__ */ jsx("small", { children: settings.tagline })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { children: "A dedicated law firm committed to practical, responsive and result-oriented legal service." }),
        socials.length > 0 && /* @__PURE__ */ jsx("div", { className: "socials", children: socials.map((s) => /* @__PURE__ */ jsx("a", { href: s.url, target: "_blank", rel: "noreferrer", "aria-label": s.label, children: /* @__PURE__ */ jsx(Social, { label: s.label }) }, s.label)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: "Quick Links" }),
        /* @__PURE__ */ jsx(Link, { to: "/about", children: "About Us" }),
        /* @__PURE__ */ jsx(Link, { to: "/practice-areas", children: "Area of Practice" }),
        /* @__PURE__ */ jsx(Link, { to: "/team", children: "Our Team" }),
        /* @__PURE__ */ jsx(Link, { to: "/insights", children: "Insights" }),
        /* @__PURE__ */ jsx(Link, { to: "/contact", children: "Contact Us" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: "Our Services" }),
        areas.slice(0, 6).map((a) => /* @__PURE__ */ jsx(Link, { to: "/practice-areas/$slug", params: { slug: a.slug }, children: a.title }, a.id))
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: "Contact Us" }),
        /* @__PURE__ */ jsx("a", { href: `tel:${settings.phone.replace(/[^+\d]/g, "")}`, children: settings.phone }),
        /* @__PURE__ */ jsx("a", { href: `mailto:${settings.email}`, children: settings.email }),
        /* @__PURE__ */ jsx("p", { children: settings.address })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "ui-container footer-bottom", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        ", ",
        settings.firmName,
        ". All Rights Reserved."
      ] }),
      /* @__PURE__ */ jsx("span", { children: "Justice. People. Progress." })
    ] })
  ] });
}
function upsert(name2, value, property = false) {
  const key = property ? "property" : "name";
  let node = document.head.querySelector(`meta[${key}="${name2}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(key, name2);
    document.head.appendChild(node);
  }
  node.content = value;
}
function Seo({ title, description, canonical, image, noindex, settings }) {
  useEffect(() => {
    const defaults2 = settings.defaultSeo || {};
    const finalTitle = title || defaults2.title || settings.firmName;
    const finalDescription = description || defaults2.description || settings.tagline;
    document.title = finalTitle.includes(settings.firmName) ? finalTitle : `${finalTitle} | ${settings.firmName}`;
    upsert("description", finalDescription);
    upsert("robots", noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large");
    upsert("og:title", document.title, true);
    upsert("og:description", finalDescription, true);
    upsert("og:type", "website", true);
    upsert("twitter:card", "summary_large_image");
    upsert("twitter:title", document.title);
    upsert("twitter:description", finalDescription);
    if (image) {
      upsert("og:image", new URL(image, location.origin).toString(), true);
      upsert("twitter:image", new URL(image, location.origin).toString());
    }
    const href = canonical ? new URL(canonical, location.origin).toString() : location.href.replace(/#.*$/, "");
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [title, description, canonical, image, noindex, settings]);
  return null;
}
function Eyebrow({ children, className = "" }) {
  return /* @__PURE__ */ jsx("div", { className: `ui-eyebrow ${className}`, children });
}
function Heading({ as = "h2", children, className = "" }) {
  const T = as;
  return /* @__PURE__ */ jsx(T, { className: `ui-heading ${className}`, children });
}
function Button({ children, variant = "gold", className = "", ...props }) {
  return /* @__PURE__ */ jsxs("button", { className: `ui-button ui-button-${variant} ${className}`, ...props, children: [
    /* @__PURE__ */ jsx("span", { children }),
    /* @__PURE__ */ jsx(ArrowRight, { "aria-hidden": true, size: 17 })
  ] });
}
function Rating({ value = 5 }) {
  return /* @__PURE__ */ jsx("div", { className: "ui-rating", "aria-label": `${value} out of 5 stars`, children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: i < value ? "★" : "☆" }, i)) });
}
function Container({ children, className = "", ...rest }) {
  return /* @__PURE__ */ jsx("div", { className: `ui-container ${className}`, ...rest, children });
}
function ReadingContainer({ children, className = "" }) {
  return /* @__PURE__ */ jsx("div", { className: `ui-reading ${className}`, children });
}
function Section({ children, className = "", tone: tone2 = "light", id }) {
  return /* @__PURE__ */ jsx("section", { id, className: `ui-section ui-section-${tone2} ${className}`, children });
}
function Field({ label, error, children }) {
  return /* @__PURE__ */ jsxs("label", { className: `ui-field ${error ? "ui-field-error" : ""}`, children: [
    /* @__PURE__ */ jsx("span", { children: label }),
    children,
    error && /* @__PURE__ */ jsx("em", { role: "alert", children: error })
  ] });
}
function Input(props) {
  return /* @__PURE__ */ jsx("input", { className: "ui-input", ...props });
}
function Select(props) {
  return /* @__PURE__ */ jsx("select", { className: "ui-input", ...props });
}
function Textarea(props) {
  return /* @__PURE__ */ jsx("textarea", { className: "ui-input ui-textarea", ...props });
}
function SafeImage({ asset, fallback, alt, className = "", style, ...rest }) {
  const src = asset?.url || fallback;
  const objectPosition = asset ? `${Math.round((asset.focalX ?? 0.5) * 100)}% ${Math.round((asset.focalY ?? 0.5) * 100)}%` : void 0;
  if (!src) return /* @__PURE__ */ jsx("div", { className: `image-unavailable ${className}`, role: "img", "aria-label": alt || "Portrait unavailable", children: "Portrait unavailable" });
  return /* @__PURE__ */ jsx("img", { loading: "lazy", decoding: "async", src, alt: alt ?? asset?.alt ?? "", className, style: { objectPosition, ...style }, ...rest });
}
function PartnerCard({ partner, variant = "standard" }) {
  const fallback = "";
  return /* @__PURE__ */ jsxs("article", { className: `partner-card partner-${variant}`, children: [
    /* @__PURE__ */ jsxs(Link, { to: "/team/$slug", params: { slug: partner.slug }, className: "partner-image", children: [
      /* @__PURE__ */ jsx(SafeImage, { asset: partner.image, fallback, alt: `${partner.name}, ${partner.title}` }),
      /* @__PURE__ */ jsx("span", { className: "partner-image-glow" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "partner-meta", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: partner.name }),
        /* @__PURE__ */ jsx("p", { children: partner.title })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/team/$slug", params: { slug: partner.slug }, "aria-label": `View ${partner.name}`, children: "→" })
    ] })
  ] });
}
const icons = { building: Building2, briefcase: BriefcaseBusiness, copyright: Copyright, gavel: Gavel, scale: Scale };
function PracticeCard({ area, compact = false }) {
  const I = icons[area.icon] || Scale;
  return /* @__PURE__ */ jsxs("article", { className: `practice-card ${compact ? "compact" : ""}`, children: [
    /* @__PURE__ */ jsx("div", { className: "practice-icon", children: /* @__PURE__ */ jsx(I, {}) }),
    /* @__PURE__ */ jsx("h3", { children: area.title }),
    /* @__PURE__ */ jsx("p", { children: area.summary }),
    /* @__PURE__ */ jsx(Link, { to: "/practice-areas/$slug", params: { slug: area.slug }, "aria-label": `Read about ${area.title}`, children: "→" }),
    /* @__PURE__ */ jsx("span", { className: "practice-watermark", "aria-hidden": true, children: /* @__PURE__ */ jsx(I, {}) })
  ] });
}
function TestimonialCarousel({ items }) {
  const [active, setActive] = useState(0);
  const ordered = useMemo(() => items.map((x, i) => ({ ...x, offset: (i - active + items.length) % items.length })), [items, active]);
  return /* @__PURE__ */ jsxs("div", { className: "testimonial-shell", children: [
    /* @__PURE__ */ jsx("div", { className: "testimonial-track", children: ordered.map((x) => /* @__PURE__ */ jsxs("article", { "data-offset": x.offset, children: [
      /* @__PURE__ */ jsx(Rating, { value: x.rating }),
      /* @__PURE__ */ jsxs("h3", { children: [
        "“",
        x.title,
        "”"
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        "“",
        x.quote,
        "”"
      ] }),
      /* @__PURE__ */ jsxs("small", { children: [
        "— ",
        x.source
      ] })
    ] }, x.id)) }),
    /* @__PURE__ */ jsxs("div", { className: "carousel-controls", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => setActive((active - 1 + items.length) % items.length), "aria-label": "Previous testimonial", children: "←" }),
      /* @__PURE__ */ jsx("div", { className: "carousel-dots", children: items.map((_, i) => /* @__PURE__ */ jsx("button", { className: i === active ? "active" : "", onClick: () => setActive(i), "aria-label": `Show testimonial ${i + 1}` }, i)) }),
      /* @__PURE__ */ jsx("button", { onClick: () => setActive((active + 1) % items.length), "aria-label": "Next testimonial", children: "→" })
    ] })
  ] });
}
const PdfPlacementSchema = z.object({ page: z.number().int().positive(), x: z.number().finite().nonnegative(), y: z.number().finite().nonnegative(), width: z.number().finite().positive(), height: z.number().finite().positive(), rotation: z.number().min(-180).max(180).default(0), opacity: z.number().min(0.1).max(1).default(1) });
const DocumentMarkItemSchema = z.object({ kind: z.enum(["mark", "signature"]), versionId: z.string().min(1), placement: PdfPlacementSchema });
z.object({ documentId: z.string().min(1), inputVersionId: z.string().min(1), idempotencyKey: z.string().min(8).max(150), items: z.array(DocumentMarkItemSchema).min(1).max(50), reason: z.string().min(2).max(2e3), elevationToken: z.string().optional() });
const TemplateBlockSchema = z.object({ type: z.enum(["heading", "paragraph", "table"]), text: z.string().max(2e4).default(""), rows: z.array(z.array(z.string().max(2e3))).max(100).optional() });
z.object({ header: z.string().max(5e3).default(""), footer: z.string().max(5e3).default(""), blocks: z.array(TemplateBlockSchema).min(1).max(200) });
z.object({ logo: z.enum(["active", "none"]).default("active"), logoPlacement: PdfPlacementSchema.optional(), marks: z.array(DocumentMarkItemSchema).max(50).default([]) });
z.object({ documentId: z.string().min(1), templateVersionId: z.string().min(1), idempotencyKey: z.string().min(8).max(150), inputs: z.record(z.string(), z.string().max(1e4)).default({}) });
const name = z.string().trim().min(2).max(200);
const text$1 = (max) => z.string().trim().max(max);
const expectedUpdatedAt = z.string().datetime();
z.object({
  expectedUpdatedAt,
  name,
  shortName: text$1(100)
}).strict();
z.object({
  expectedUpdatedAt,
  name,
  registrationNo: text$1(100),
  kraPin: text$1(50),
  vatRegistration: text$1(100)
}).strict();
z.object({
  expectedUpdatedAt,
  address: text$1(500),
  postalAddress: text$1(300),
  phone: text$1(50),
  email: z.union([z.literal(""), z.string().trim().email().max(254)])
}).strict();
const PublicLeadSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(250).optional().or(z.literal("")),
  phone: z.string().trim().min(7).max(50),
  practiceAreaSlug: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(8e3),
  consent: z.literal(true),
  source: z.string().trim().max(250).optional(),
  landingPage: z.string().trim().max(800).optional(),
  utm: z.object({
    utm_source: z.string().max(250).optional(),
    utm_medium: z.string().max(250).optional(),
    utm_campaign: z.string().max(250).optional(),
    utm_term: z.string().max(250).optional(),
    utm_content: z.string().max(250).optional()
  }).optional(),
  idempotencyKey: z.string().uuid().optional(),
  formVersion: z.number().int().positive().optional(),
  website: z.string().max(200).optional()
  // honeypot
});
const SettingScopeSchema = z.enum([
  "SYSTEM",
  "FIRM",
  "LEGAL_ENTITY",
  "BRANCH",
  "DEPARTMENT",
  "PRACTICE_AREA",
  "MATTER_TYPE",
  "WORKFLOW_TEMPLATE",
  "ROLE",
  "TEAM",
  "USER",
  "CLIENT",
  "MATTER",
  "DOCUMENT_TEMPLATE",
  "INTEGRATION_CONNECTION",
  "PORTAL_PROFILE"
]);
z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256)
});
z.object({
  token: z.string().min(32),
  password: z.string().min(12).max(256)
});
z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(200),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(120).optional(),
  homeBranchId: z.string().optional(),
  roleKeys: z.array(z.string().min(1)).min(1)
});
z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(24).regex(/^[A-Za-z0-9_-]+$/),
  address: z.string().max(500).optional(),
  postalAddress: z.string().max(300).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  defaultCourtStation: z.string().max(300).optional(),
  numberingPrefix: z.string().max(30).optional()
});
z.object({
  type: z.enum(["PERSON", "ORGANIZATION"]).default("PERSON"),
  displayName: z.string().min(2).max(250),
  legalName: z.string().max(250).optional(),
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
  idNumber: z.string().max(100).optional(),
  kraPin: z.string().max(50).optional(),
  phone: z.string().max(50).optional(),
  alternatePhone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  postalAddress: z.string().max(300).optional(),
  physicalAddress: z.string().max(500).optional(),
  preferredContactMethod: z.enum(["PHONE", "WHATSAPP", "EMAIL", "POSTAL"]).optional(),
  notes: z.string().max(5e3).optional()
});
z.object({
  source: z.string().max(250).optional(),
  referrerName: z.string().max(250).optional(),
  clientName: z.string().min(2).max(250),
  phone: z.string().min(5).max(50),
  email: z.string().email().optional(),
  nationalId: z.string().max(100).optional(),
  incidentDate: z.string().datetime().optional(),
  incidentLocation: z.string().max(500).optional(),
  briefDescription: z.string().min(3).max(1e4),
  practiceArea: z.string().min(2).max(120),
  matterType: z.string().max(200).optional(),
  assignedOwnerId: z.string().optional()
});
z.object({
  name: z.string().min(2).max(250),
  role: z.string().min(2).max(100),
  idOrRegNumber: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  insuranceCompany: z.string().max(250).optional(),
  policyOrClaimNumber: z.string().max(100).optional(),
  notes: z.string().max(3e3).optional()
});
z.object({
  supervisingUserId: z.string(),
  responsibleBranchId: z.string(),
  originatingBranchId: z.string(),
  legalEntityId: z.string().optional(),
  workflowVersionId: z.string().optional(),
  stageOwnerId: z.string().optional(),
  courtClerkId: z.string().optional(),
  financeContactId: z.string().optional(),
  initialAction: z.string().max(1e3).optional()
});
z.object({
  clientId: z.string(),
  legalEntityId: z.string().optional(),
  title: z.string().min(2).max(300),
  practiceArea: z.string().min(2).max(120),
  practiceCode: z.string().min(2).max(20),
  matterType: z.string().min(2).max(200),
  workflowVersionId: z.string().optional(),
  originatingBranchId: z.string(),
  responsibleBranchId: z.string(),
  supervisingUserId: z.string(),
  currentStageOwnerId: z.string().optional(),
  courtClerkId: z.string().optional(),
  financeContactId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  summary: z.string().max(1e4).optional(),
  nextAction: z.string().max(1e3).optional()
});
z.object({
  toStageNumber: z.number().int().positive(),
  newOwnerUserId: z.string(),
  handoffNotes: z.string().min(3).max(5e3),
  criticalNextAction: z.string().max(1500).optional(),
  checklistItems: z.array(z.object({
    key: z.string(),
    label: z.string(),
    completed: z.boolean()
  })).optional(),
  override: z.boolean().default(false),
  overrideReason: z.string().max(3e3).optional()
});
z.object({
  matterId: z.string().optional(),
  stageNumber: z.number().int().positive().optional(),
  title: z.string().min(2).max(300),
  description: z.string().max(1e4).optional(),
  assignedToId: z.string(),
  reviewerId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  startAt: z.string().datetime().optional(),
  dueAt: z.string().datetime(),
  officialDeadlineAt: z.string().datetime().optional(),
  dependencyIds: z.array(z.string()).default([])
});
z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "WAITING_EXTERNAL", "WAITING_REVIEW", "COMPLETED", "CANCELLED"]),
  blockedReason: z.string().max(2e3).optional(),
  force: z.boolean().default(false),
  forceReason: z.string().max(2e3).optional()
});
z.object({
  title: z.string().min(2).max(300).optional(),
  description: z.string().max(1e4).optional(),
  assignedToId: z.string().optional(),
  reviewerId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  startAt: z.string().datetime().nullable().optional(),
  dueAt: z.string().datetime().optional(),
  officialDeadlineAt: z.string().datetime().nullable().optional(),
  dependencyIds: z.array(z.string()).optional()
});
z.object({
  matterId: z.string().optional(),
  courtProceedingId: z.string().optional(),
  taskId: z.string().optional(),
  deadlineId: z.string().optional(),
  title: z.string().min(2).max(300),
  eventType: z.enum(["COURT", "CLIENT_MEETING", "INTERNAL_MEETING", "MEDICAL", "FILING", "DEADLINE", "TASK_BLOCK", "OTHER"]),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().default("Africa/Nairobi"),
  allDay: z.boolean().default(false),
  location: z.string().max(500).optional(),
  virtualMeetingUrl: z.string().url().optional(),
  assignedUserId: z.string(),
  participantUserIds: z.array(z.string()).default([]),
  sourceType: z.string().default("MANUAL"),
  editPolicy: z.enum(["FREE", "CONFIRM", "REASON_REQUIRED", "APPROVAL_REQUIRED", "LOCKED"]).default("CONFIRM"),
  notes: z.string().max(1e4).optional()
});
z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().max(3e3).optional(),
  source: z.string().max(500).optional(),
  supportingDocumentId: z.string().optional()
});
z.object({
  matterId: z.string(),
  title: z.string().min(2).max(300),
  category: z.string().min(2).max(120),
  documentType: z.string().min(2).max(180),
  confidentialityLevel: z.enum(["STANDARD", "RESTRICTED", "PARTNER_ONLY", "SEALED"]).default("STANDARD")
});
z.object({
  matterId: z.string().optional(),
  branchId: z.string(),
  category: z.string().min(2).max(100),
  description: z.string().min(2).max(2e3),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default("KES"),
  paymentSource: z.string().min(2).max(120)
});
z.object({
  matterId: z.string().optional(),
  clientId: z.string().optional(),
  accountId: z.string(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default("KES"),
  payerName: z.string().min(2).max(250),
  paymentMethod: z.string().min(2).max(80),
  referenceNumber: z.string().min(2).max(120),
  description: z.string().min(2).max(1e3),
  receivedAt: z.string().datetime()
});
const JournalLineSchema = z.object({
  accountId: z.string(),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  matterId: z.string().optional(),
  clientId: z.string().optional(),
  memo: z.string().max(1e3).optional()
}).refine((v) => v.debit > 0 !== v.credit > 0, {
  message: "Each journal line must contain either a debit or a credit, not both."
});
z.object({
  branchId: z.string().optional(),
  matterId: z.string().optional(),
  clientId: z.string().optional(),
  description: z.string().min(2).max(1e3),
  transactionDate: z.string().datetime(),
  sourceType: z.string().max(100).optional(),
  sourceId: z.string().optional(),
  lines: z.array(JournalLineSchema).min(2)
});
z.object({
  scopeType: SettingScopeSchema,
  scopeId: z.string().min(1),
  value: z.unknown().optional(),
  secretValue: z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
  changeReason: z.string().max(3e3).optional()
});
z.object({
  kind: z.enum([
    "SMTP",
    "IMAP",
    "GOOGLE_WORKSPACE",
    "MICROSOFT_365",
    "WHATSAPP_CLOUD",
    "SMS_AFRICAS_TALKING",
    "MPESA_DARAJA",
    "JUDICIARY",
    "S3_STORAGE",
    "WEBHOOK",
    "OTHER"
  ]),
  name: z.string().min(2).max(120),
  scopeType: SettingScopeSchema.default("FIRM"),
  scopeId: z.string().min(1),
  publicConfig: z.record(z.string(), z.unknown()).default({}),
  secret: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().default(false)
});
z.object({
  displayName: z.string().min(2).max(200),
  type: z.enum([
    "FIRM_SEAL",
    "BRANCH_SEAL",
    "LOGO",
    "RECEIVED_STAMP",
    "PAID_STAMP",
    "APPROVED_STAMP",
    "CERTIFIED_COPY_STAMP",
    "CONFIDENTIAL_STAMP",
    "DRAFT_STAMP",
    "COPY_STAMP",
    "INTERNAL_REVIEW_STAMP",
    "CUSTOM_OPERATIONAL_MARK"
  ]),
  branchId: z.string().optional(),
  description: z.string().max(2e3).optional(),
  intendedUse: z.string().max(2e3).optional(),
  permittedRoleKeys: z.array(z.string()).default([]),
  permittedUserIds: z.array(z.string()).default([]),
  allowedDocumentTypes: z.array(z.string()).default([]),
  allowedMatterTypes: z.array(z.string()).default([]),
  canApplyAutomatically: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  approvalRoleKeys: z.array(z.string()).default([])
});
z.object({
  documentId: z.string(),
  inputVersionId: z.string(),
  markAssetId: z.string(),
  markAssetVersionId: z.string(),
  placementPresetId: z.string().optional(),
  executionBlockVersionId: z.string().optional(),
  signerUserId: z.string().optional(),
  reason: z.string().max(2e3).optional(),
  elevationToken: z.string().optional()
});
z.object({
  projectId: z.string().optional(),
  matterId: z.string().optional(),
  title: z.string().min(2).max(300),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  location: z.string().max(500).optional(),
  agenda: z.unknown().optional(),
  participantUserIds: z.array(z.string()).default([])
});
z.object({
  type: z.string().min(2).max(100),
  title: z.string().min(2).max(300),
  summary: z.string().max(5e3).optional(),
  practiceArea: z.string().max(120).optional(),
  tags: z.array(z.string()).default([]),
  documentId: z.string().optional()
});
function LeadForm({ areas, definition, compact = false }) {
  const { register, handleSubmit, reset, setError, clearErrors, formState: { errors, isSubmitting } } = useForm({ defaultValues: { consent: false, website: "" } });
  const [result, setResult] = useState(null), [failure, setFailure] = useState("");
  const request2 = useRef(null);
  const attribution = useMemo(() => {
    const p = new URLSearchParams(typeof location === "undefined" ? "" : location.search);
    return Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].map((k) => [k, p.get(k) || ""]).filter(([, v]) => v));
  }, []);
  async function submit(raw) {
    clearErrors();
    setFailure("");
    const parsed = PublicLeadSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) setError(issue.path[0], { message: issue.message });
      setFailure("Please correct the highlighted fields.");
      return;
    }
    const input = { ...parsed.data, formVersion: definition?.version, source: document.referrer || "DIRECT", landingPage: location.pathname, utm: attribution };
    const fingerprint = JSON.stringify(input);
    if (request2.current?.fingerprint !== fingerprint) request2.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const r = await submitLead({ ...input, idempotencyKey: request2.current.key });
      if (!r.reference) throw new Error("The server did not return an enquiry reference.");
      setResult(r);
      reset();
      request2.current = null;
    } catch (e) {
      if (e instanceof PublicApiError) for (const [field, messages] of Object.entries(e.fields)) setError(field, { message: messages.join(" ") });
      setFailure(e instanceof Error ? e.message : "We could not submit your enquiry. Please try again.");
    }
  }
  if (result) return /* @__PURE__ */ jsxs("div", { className: "lead-success", role: "status", children: [
    /* @__PURE__ */ jsx("h3", { children: "Thank you. Your enquiry has been received." }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Your reference is ",
      /* @__PURE__ */ jsx("strong", { children: result.reference }),
      ". Our team will review your enquiry and contact you."
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: () => setResult(null), children: "Send another enquiry" })
  ] });
  return /* @__PURE__ */ jsxs("form", { className: `lead-form ${compact ? "compact" : ""}`, onSubmit: handleSubmit(submit), noValidate: true, children: [
    /* @__PURE__ */ jsx(Field, { label: "Full Name", error: errors.name?.message, children: /* @__PURE__ */ jsx(Input, { autoComplete: "name", ...register("name") }) }),
    /* @__PURE__ */ jsxs("div", { className: "form-two", children: [
      /* @__PURE__ */ jsx(Field, { label: "Phone", error: errors.phone?.message, children: /* @__PURE__ */ jsx(Input, { type: "tel", autoComplete: "tel", ...register("phone") }) }),
      /* @__PURE__ */ jsx(Field, { label: "Email", error: errors.email?.message, children: /* @__PURE__ */ jsx(Input, { type: "email", autoComplete: "email", ...register("email") }) })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: "Area of Interest", error: errors.practiceAreaSlug?.message, children: /* @__PURE__ */ jsxs(Select, { ...register("practiceAreaSlug"), children: [
      /* @__PURE__ */ jsx("option", { value: "", children: "Choose a practice area" }),
      areas.map((a) => /* @__PURE__ */ jsx("option", { value: a.slug, children: a.title }, a.id))
    ] }) }),
    /* @__PURE__ */ jsx(Field, { label: "Message", error: errors.message?.message, children: /* @__PURE__ */ jsx(Textarea, { rows: compact ? 4 : 6, ...register("message") }) }),
    /* @__PURE__ */ jsxs("label", { className: "honeypot", "aria-hidden": "true", children: [
      "Website",
      /* @__PURE__ */ jsx(Input, { tabIndex: -1, autoComplete: "off", ...register("website") })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "consent", children: [
      /* @__PURE__ */ jsx("input", { type: "checkbox", ...register("consent") }),
      /* @__PURE__ */ jsx("span", { children: definition?.consentText || "I consent to the firm using this information to review and respond to my enquiry." })
    ] }),
    errors.consent && /* @__PURE__ */ jsx("p", { role: "alert", children: "Please confirm your consent." }),
    failure && /* @__PURE__ */ jsx("div", { className: "form-failure", role: "alert", children: failure }),
    /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Submitting?" : "Submit Enquiry" })
  ] });
}
const metricIcons = [Users, Gavel, ShieldCheck, Award];
function Hero({ content: c = {} }) {
  return /* @__PURE__ */ jsxs("section", { className: "hero", children: [
    /* @__PURE__ */ jsx("div", { className: "hero-noise" }),
    /* @__PURE__ */ jsx("div", { className: "hero-art", children: /* @__PURE__ */ jsx("img", { src: c.asset?.url || c.imageUrl || "/assets/hero-justice.png", alt: c.asset?.alt || "Lady Justice sculpture", fetchPriority: "high" }) }),
    /* @__PURE__ */ jsxs(Container, { className: "hero-layout", children: [
      /* @__PURE__ */ jsxs("div", { className: "hero-copy", children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: c.eyebrow }),
        /* @__PURE__ */ jsx(Heading, { as: "h1", children: String(c.title || "").split("\n").map((line, i) => /* @__PURE__ */ jsx("span", { className: "hero-line", children: line }, i)) }),
        /* @__PURE__ */ jsx("p", { children: c.description }),
        /* @__PURE__ */ jsxs("div", { className: "hero-actions", children: [
          /* @__PURE__ */ jsxs("a", { href: c.ctaUrl || "/contact", className: "ui-button ui-button-gold", children: [
            /* @__PURE__ */ jsx("span", { children: c.ctaLabel || "Contact Us" }),
            /* @__PURE__ */ jsx("span", { children: "?" })
          ] }),
          c.videoUrl && /* @__PURE__ */ jsxs("a", { href: c.videoUrl, className: "watch-link", children: [
            /* @__PURE__ */ jsx("i", { children: /* @__PURE__ */ jsx(Play, { size: 15 }) }),
            c.videoLabel || "Watch Our Video"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "hero-values", children: (c.values || []).map((v, i) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("b", { children: v.title }),
          /* @__PURE__ */ jsx("span", { children: v.description })
        ] }, i)) })
      ] }),
      c.quote && /* @__PURE__ */ jsx("blockquote", { children: c.quote })
    ] }),
    /* @__PURE__ */ jsxs("a", { href: "#who-we-are", className: "hero-scroll", children: [
      "SCROLL ",
      /* @__PURE__ */ jsx("span", { children: "?" })
    ] })
  ] });
}
function WhoWeAre({ data, content: c = {} }) {
  return /* @__PURE__ */ jsx(Section, { id: "who-we-are", className: "who", children: /* @__PURE__ */ jsxs(Container, { children: [
    /* @__PURE__ */ jsx(Eyebrow, { children: c.eyebrow }),
    /* @__PURE__ */ jsxs("div", { className: "who-grid", children: [
      /* @__PURE__ */ jsxs("div", { className: "who-copy", children: [
        /* @__PURE__ */ jsx(Heading, { children: c.title }),
        /* @__PURE__ */ jsx("p", { children: c.description }),
        /* @__PURE__ */ jsx("ul", { children: (c.bullets || []).map((text2) => /* @__PURE__ */ jsx("li", { children: text2 }, text2)) }),
        /* @__PURE__ */ jsxs(Link, { className: "ui-button ui-button-outline", to: "/about", children: [
          /* @__PURE__ */ jsx("span", { children: "Know About Us" }),
          /* @__PURE__ */ jsx("span", { children: "→" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "partner-pair", children: (c.slugs?.length ? data.partners.filter((p) => c.slugs.includes(p.slug)) : data.partners).slice(0, 2).map((p) => /* @__PURE__ */ jsx(PartnerCard, { partner: p, variant: "featured" }, p.id)) }),
      /* @__PURE__ */ jsxs("aside", { className: "who-aside", children: [
        c.statement,
        /* @__PURE__ */ jsx("i", {})
      ] })
    ] })
  ] }) });
}
function Metrics({ data, content: c = {} }) {
  return /* @__PURE__ */ jsx("section", { className: "metrics", children: /* @__PURE__ */ jsx(Container, { className: "metrics-grid", children: data.metrics.map((m, i) => {
    const I = metricIcons[i % metricIcons.length] ?? Award;
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(I, {}),
      /* @__PURE__ */ jsx("strong", { children: m.value }),
      /* @__PURE__ */ jsx("span", { children: m.label })
    ] }, m.id);
  }) }) });
}
function Services({ data, content: c = {} }) {
  return /* @__PURE__ */ jsx(Section, { className: "services", children: /* @__PURE__ */ jsxs(Container, { children: [
    /* @__PURE__ */ jsxs("div", { className: "section-split-head", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: c.eyebrow }),
        /* @__PURE__ */ jsx(Heading, { children: c.title })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { children: c.description }),
        /* @__PURE__ */ jsxs(Link, { className: "ui-button ui-button-outline", to: "/practice-areas", children: [
          /* @__PURE__ */ jsx("span", { children: "View All Services" }),
          /* @__PURE__ */ jsx("span", { children: "→" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "practice-grid", children: data.practiceAreas.slice(0, 5).map((a) => /* @__PURE__ */ jsx(PracticeCard, { area: a }, a.id)) })
  ] }) });
}
function MediaInsights({ data, content: c = {} }) {
  const [feature, ...rest] = data.publications;
  return /* @__PURE__ */ jsx("section", { id: "media", className: "media-section", children: /* @__PURE__ */ jsxs(Container, { className: "media-layout", children: [
    /* @__PURE__ */ jsxs("div", { className: "media-copy", children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: c.eyebrow }),
      /* @__PURE__ */ jsx(Heading, { children: c.title }),
      /* @__PURE__ */ jsx("p", { children: c.description }),
      /* @__PURE__ */ jsxs(Link, { className: "ui-button ui-button-gold", to: "/insights", children: [
        /* @__PURE__ */ jsx("span", { children: "View All Media" }),
        /* @__PURE__ */ jsx("span", { children: "→" })
      ] })
    ] }),
    feature && /* @__PURE__ */ jsxs(Link, { to: "/insights/$slug", params: { slug: feature.slug }, className: "featured-media", children: [
      /* @__PURE__ */ jsx(SafeImage, { asset: feature.cover, fallback: "/assets/media-feature.png", alt: feature.title }),
      feature.kind === "VIDEO" && feature.videoUrl && /* @__PURE__ */ jsx("span", { className: "featured-play", "aria-hidden": true, children: /* @__PURE__ */ jsx(Play, { fill: "currentColor" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: feature.title }),
        /* @__PURE__ */ jsx("span", { children: feature.duration || "Read" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "media-list", children: rest.slice(0, 2).map((p, i) => /* @__PURE__ */ jsxs(Link, { to: "/insights/$slug", params: { slug: p.slug }, children: [
      /* @__PURE__ */ jsx(SafeImage, { asset: p.cover, fallback: i ? "/assets/media-employment.png" : "/assets/media-ip.png", alt: p.title }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("small", { children: new Date(p.publishedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) }),
        /* @__PURE__ */ jsx("h3", { children: p.title }),
        /* @__PURE__ */ jsxs("span", { children: [
          p.kind === "VIDEO" ? "Watch" : "Read Article",
          " →"
        ] })
      ] })
    ] }, p.id)) })
  ] }) });
}
function TeamPreview({ data, content: c = {} }) {
  return /* @__PURE__ */ jsx(Section, { className: "team-preview", children: /* @__PURE__ */ jsxs(Container, { className: "team-layout", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: c.eyebrow }),
      /* @__PURE__ */ jsx(Heading, { children: c.title }),
      /* @__PURE__ */ jsx("p", { children: c.description }),
      /* @__PURE__ */ jsxs(Link, { className: "ui-button ui-button-outline", to: "/team", children: [
        /* @__PURE__ */ jsx("span", { children: "View Our Team" }),
        /* @__PURE__ */ jsx("span", { children: "→" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "team-pair", children: (c.slugs?.length ? data.partners.filter((p) => c.slugs.includes(p.slug)) : data.partners).slice(0, 2).map((p) => /* @__PURE__ */ jsx(PartnerCard, { partner: p, variant: "compact" }, p.id)) }),
    /* @__PURE__ */ jsxs("blockquote", { children: [
      "“A strong team",
      /* @__PURE__ */ jsx("br", {}),
      "builds stronger",
      /* @__PURE__ */ jsx("br", {}),
      "futures.”"
    ] })
  ] }) });
}
function Testimonials({ data, content: c = {} }) {
  return /* @__PURE__ */ jsx(Section, { className: "testimonials", children: /* @__PURE__ */ jsxs(Container, { children: [
    /* @__PURE__ */ jsx("div", { className: "testimonial-heading", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: c.eyebrow }),
      /* @__PURE__ */ jsx(Heading, { children: c.title })
    ] }) }),
    /* @__PURE__ */ jsx(TestimonialCarousel, { items: data.testimonials })
  ] }) });
}
function Consultation({ data, content: c = {} }) {
  return /* @__PURE__ */ jsx(Section, { className: "consultation", children: /* @__PURE__ */ jsxs(Container, { className: "consultation-layout", children: [
    /* @__PURE__ */ jsx("div", { className: "consult-photo", children: /* @__PURE__ */ jsx("img", { src: "/assets/consultation-partner.png", alt: "A legal professional at Kariuki Kagunda & Co. Advocates" }) }),
    /* @__PURE__ */ jsxs("div", { className: "consult-form", children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: c.eyebrow }),
      /* @__PURE__ */ jsxs(Heading, { children: [
        "Let’s Start a",
        /* @__PURE__ */ jsx("br", {}),
        "Conversation!"
      ] }),
      /* @__PURE__ */ jsx("p", { children: c.description }),
      /* @__PURE__ */ jsx(LeadForm, { areas: data.practiceAreas, definition: data.forms?.find((f) => f.key === "general-enquiry"), compact: true })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "consult-statement", children: [
      /* @__PURE__ */ jsx("span", { children: c.statement }),
      /* @__PURE__ */ jsx("i", {})
    ] })
  ] }) });
}
function PartnerLeadership({ data, content: c = {} }) {
  return /* @__PURE__ */ jsx("section", { className: "partner-leadership", children: /* @__PURE__ */ jsxs(Container, { children: [
    /* @__PURE__ */ jsx(Eyebrow, { children: c.eyebrow }),
    /* @__PURE__ */ jsx(Heading, { children: c.title }),
    /* @__PURE__ */ jsx("p", { children: c.description }),
    /* @__PURE__ */ jsx("div", { className: "partner-pair", children: data.partners.filter((p) => !c.slugs?.length || c.slugs.includes(p.slug)).slice(0, 2).map((p) => /* @__PURE__ */ jsx(PartnerCard, { partner: p, variant: "featured" }, p.id)) }),
    /* @__PURE__ */ jsx("blockquote", { children: c.quote })
  ] }) });
}
function HomePage({ data }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { settings: data.settings, title: data.settings.firmName, description: data.settings.tagline, image: "/assets/hero-justice.png" }),
    /* @__PURE__ */ jsx(Hero, {}),
    /* @__PURE__ */ jsx(WhoWeAre, { data }),
    /* @__PURE__ */ jsx(Metrics, { data }),
    /* @__PURE__ */ jsx(Services, { data }),
    /* @__PURE__ */ jsx(MediaInsights, { data }),
    /* @__PURE__ */ jsx(TeamPreview, { data }),
    /* @__PURE__ */ jsx(Testimonials, { data }),
    /* @__PURE__ */ jsx(Consultation, { data })
  ] });
}
function AboutPage({ data }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { settings: data.settings, title: "About Us", description: "About Kariuki Kagunda & Co. Advocates, our leadership, values and practical approach to legal service." }),
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "About the Firm", title: "PRACTICAL COUNSEL. HUMAN SERVICE. ENDURING TRUST.", copy: "We combine disciplined legal work with a clear understanding of the people and businesses behind every instruction." }),
    /* @__PURE__ */ jsx(Section, { children: /* @__PURE__ */ jsxs(Container, { className: "about-story", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: "Who We Are" }),
        /* @__PURE__ */ jsx(Heading, { children: "A FIRM BUILT AROUND PRACTICAL SOLUTIONS." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { children: "Kariuki Kagunda & Co. Advocates provides legal services to individuals, entrepreneurs, organisations and institutions across Kenya. Our approach is deliberately practical: understand the real problem, identify the legal leverage, communicate clearly and pursue the result with discipline." }),
        /* @__PURE__ */ jsx("p", { children: "We believe clients should understand what is happening in their matter, why a recommendation is being made and what comes next." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Section, { tone: "ivory", children: /* @__PURE__ */ jsxs(Container, { children: [
      /* @__PURE__ */ jsxs("div", { className: "leadership-head", children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: "Leadership" }),
        /* @__PURE__ */ jsx(Heading, { children: "EXPERIENCED. TRUSTED. RESULTS DRIVEN." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "partner-grid-large", children: data.partners.map((p) => /* @__PURE__ */ jsx(PartnerCard, { partner: p, variant: "featured" }, p.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(Metrics, { data }),
    /* @__PURE__ */ jsx(Section, { children: /* @__PURE__ */ jsxs(Container, { className: "values-grid", children: [
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { children: "01" }),
        /* @__PURE__ */ jsx("h3", { children: "Clarity" }),
        /* @__PURE__ */ jsx("p", { children: "Plain communication about options, risks, costs and next actions." })
      ] }),
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { children: "02" }),
        /* @__PURE__ */ jsx("h3", { children: "Preparation" }),
        /* @__PURE__ */ jsx("p", { children: "Strong outcomes begin with careful records, evidence and disciplined legal work." })
      ] }),
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { children: "03" }),
        /* @__PURE__ */ jsx("h3", { children: "Responsiveness" }),
        /* @__PURE__ */ jsx("p", { children: "Legal matters move. Clients should not have to chase their advocates for basic updates." })
      ] }),
      /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("span", { children: "04" }),
        /* @__PURE__ */ jsx("h3", { children: "Integrity" }),
        /* @__PURE__ */ jsx("p", { children: "Advice must remain grounded in law, evidence and the client’s legitimate interests." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Section, { tone: "dark", className: "about-cta", children: /* @__PURE__ */ jsxs(Container, { className: "split-cta", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: "Work With Us" }),
        /* @__PURE__ */ jsx(Heading, { children: "LET’S DISCUSS YOUR LEGAL MATTER." }),
        /* @__PURE__ */ jsx("p", { children: "Send an enquiry and our team can assess the appropriate next step." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "dark-form", children: /* @__PURE__ */ jsx(LeadForm, { areas: data.practiceAreas, compact: true }) })
    ] }) })
  ] });
}
function PageHero({ eyebrow, title, copy }) {
  return /* @__PURE__ */ jsx("section", { className: "page-hero", children: /* @__PURE__ */ jsxs(Container, { children: [
    /* @__PURE__ */ jsx(Eyebrow, { children: eyebrow }),
    /* @__PURE__ */ jsx(Heading, { as: "h1", children: title }),
    /* @__PURE__ */ jsx("p", { children: copy })
  ] }) });
}
function PracticeAreasPage({ data }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { settings: data.settings, title: "Areas of Practice", description: "Explore the legal services offered by Kariuki Kagunda & Co. Advocates." }),
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "Areas of Practice", title: "LEGAL SOLUTIONS BUILT AROUND REAL-WORLD NEEDS.", copy: "From personal injury and employment disputes to property, intellectual property and digital business, our work combines legal rigor with practical execution." }),
    /* @__PURE__ */ jsx(Section, { children: /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsx("div", { className: "practice-index-grid", children: data.practiceAreas.map((a) => /* @__PURE__ */ jsx(PracticeCard, { area: a }, a.id)) }) }) }),
    /* @__PURE__ */ jsx(Section, { tone: "dark", children: /* @__PURE__ */ jsxs(Container, { className: "split-cta", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: "Not sure where your matter fits?" }),
        /* @__PURE__ */ jsx(Heading, { children: "TELL US WHAT HAPPENED." }),
        /* @__PURE__ */ jsx("p", { children: "You do not need to diagnose the legal category before contacting us. Give us the essential facts and our team can route the enquiry appropriately." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "dark-form", children: /* @__PURE__ */ jsx(LeadForm, { areas: data.practiceAreas, compact: true }) })
    ] }) })
  ] });
}
function PracticeDetailPage({ area, data }) {
  const related = data.partners.filter((p) => p.practiceAreas.includes(area.slug));
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { settings: data.settings, title: area.title, description: area.summary }),
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "Area of Practice", title: area.title.toUpperCase(), copy: area.summary }),
    /* @__PURE__ */ jsx(Section, { children: /* @__PURE__ */ jsxs(Container, { className: "detail-two-col", children: [
      /* @__PURE__ */ jsxs("article", { className: "prose", children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: "How We Help" }),
        /* @__PURE__ */ jsx(Heading, { children: area.title }),
        /* @__PURE__ */ jsx("p", { children: area.description }),
        /* @__PURE__ */ jsx("h2", { children: "Services" }),
        /* @__PURE__ */ jsx("ul", { children: area.services.map((x) => /* @__PURE__ */ jsx("li", { children: x }, x)) }),
        area.faqs.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("h2", { children: "Frequently Asked Questions" }),
          area.faqs.map((f) => /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: f.q }),
            /* @__PURE__ */ jsx("p", { children: f.a })
          ] }, f.q))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "detail-aside", children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: "Talk to the Firm" }),
        /* @__PURE__ */ jsx(LeadForm, { areas: data.practiceAreas, compact: true })
      ] })
    ] }) }),
    related.length > 0 && /* @__PURE__ */ jsx(Section, { tone: "ivory", children: /* @__PURE__ */ jsxs(Container, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: "Relevant Professionals" }),
      /* @__PURE__ */ jsx(Heading, { children: "PEOPLE WHO CAN HELP." }),
      /* @__PURE__ */ jsx("div", { className: "mini-partners", children: related.map((p, i) => /* @__PURE__ */ jsxs(Link, { to: "/team/$slug", params: { slug: p.slug }, children: [
        /* @__PURE__ */ jsx(SafeImage, { asset: p.image, fallback: i === 1 ? "/assets/partner-wanjiru.png" : "/assets/partner-kariuki.png", alt: p.name }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: p.name }),
          /* @__PURE__ */ jsx("small", { children: p.title })
        ] })
      ] }, p.id)) })
    ] }) })
  ] });
}
function TeamPage({ data }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { settings: data.settings, title: "Our Team", description: "Meet the professionals behind Kariuki Kagunda & Co. Advocates." }),
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "Our Team", title: "THE PEOPLE BEHIND THE COUNSEL.", copy: "Our public team profiles put the people responsible for client service at the centre of the firm’s digital experience." }),
    /* @__PURE__ */ jsx(Section, { children: /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsx("div", { className: "partner-grid-large", children: data.partners.map((p) => /* @__PURE__ */ jsx(PartnerCard, { partner: p, variant: "featured" }, p.id)) }) }) }),
    /* @__PURE__ */ jsx(Section, { tone: "dark", children: /* @__PURE__ */ jsxs(Container, { className: "team-manifesto", children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: "How We Work" }),
      /* @__PURE__ */ jsx(Heading, { children: "LEGAL WORK IS A TEAM SPORT WITH INDIVIDUAL ACCOUNTABILITY." }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "Each instruction should have clear ownership, active supervision and a transparent next action. The public site reflects the people; the LawFirm OS provides the machinery behind their work." }) })
    ] }) })
  ] });
}
function PartnerPage({ partner, data }) {
  const areas = data.practiceAreas.filter((a) => partner.practiceAreas.includes(a.slug));
  const posts = data.publications.filter((p) => p.author?.id === partner.id || p.practiceAreas.some((x) => partner.practiceAreas.includes(x)));
  const fallback = partner.slug.includes("wanjiru") ? "/assets/partner-wanjiru.png" : "/assets/partner-kariuki.png";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { settings: data.settings, title: `${partner.name} | ${partner.title}`, description: partner.summary, image: partner.image?.url }),
    /* @__PURE__ */ jsx("section", { className: "partner-hero", children: /* @__PURE__ */ jsxs(Container, { className: "partner-hero-grid", children: [
      /* @__PURE__ */ jsxs("div", { className: "partner-hero-copy", children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: partner.title }),
        /* @__PURE__ */ jsx(Heading, { as: "h1", children: partner.name.toUpperCase() }),
        /* @__PURE__ */ jsx("p", { children: partner.summary }),
        /* @__PURE__ */ jsxs("div", { className: "partner-contact-links", children: [
          partner.email && /* @__PURE__ */ jsx("a", { href: `mailto:${partner.email}`, children: partner.email }),
          partner.phone && /* @__PURE__ */ jsx("a", { href: `tel:${partner.phone}`, children: partner.phone })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "partner-portrait", children: /* @__PURE__ */ jsx(SafeImage, { asset: partner.image, fallback, alt: `${partner.name}, ${partner.title}` }) })
    ] }) }),
    /* @__PURE__ */ jsx(Section, { children: /* @__PURE__ */ jsxs(Container, { className: "detail-two-col", children: [
      /* @__PURE__ */ jsxs("article", { className: "prose", children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: "Profile" }),
        /* @__PURE__ */ jsx(Heading, { children: "CLIENT-FIRST. PRACTICAL. PREPARED." }),
        /* @__PURE__ */ jsx("p", { children: partner.bio }),
        areas.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("h2", { children: "Practice Areas" }),
          /* @__PURE__ */ jsx("div", { className: "tag-links", children: areas.map((a) => /* @__PURE__ */ jsx(Link, { to: "/practice-areas/$slug", params: { slug: a.slug }, children: a.title }, a.id)) })
        ] }),
        " ",
        partner.credentials.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("h2", { children: "Credentials" }),
          /* @__PURE__ */ jsx("ul", { children: partner.credentials.map((x) => /* @__PURE__ */ jsx("li", { children: x }, x)) })
        ] }),
        " ",
        partner.memberships.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("h2", { children: "Professional Memberships" }),
          /* @__PURE__ */ jsx("ul", { children: partner.memberships.map((x) => /* @__PURE__ */ jsx("li", { children: x }, x)) })
        ] }),
        " ",
        partner.education.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("h2", { children: "Education" }),
          /* @__PURE__ */ jsx("ul", { children: partner.education.map((x) => /* @__PURE__ */ jsx("li", { children: x }, x)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "detail-aside", children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: "Start a Conversation" }),
        /* @__PURE__ */ jsx(LeadForm, { areas: data.practiceAreas, compact: true })
      ] })
    ] }) }),
    posts.length > 0 && /* @__PURE__ */ jsx(Section, { tone: "ivory", children: /* @__PURE__ */ jsxs(Container, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: "Insights" }),
      /* @__PURE__ */ jsx(Heading, { children: "RELATED READING." }),
      /* @__PURE__ */ jsx("div", { className: "article-grid", children: posts.slice(0, 6).map((p) => /* @__PURE__ */ jsxs(Link, { className: "article-card", to: "/insights/$slug", params: { slug: p.slug }, children: [
        /* @__PURE__ */ jsx(SafeImage, { asset: p.cover, fallback: "/assets/media-ip.png", alt: p.title }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("small", { children: p.kind }),
          /* @__PURE__ */ jsx("h3", { children: p.title }),
          /* @__PURE__ */ jsx("p", { children: p.excerpt }),
          /* @__PURE__ */ jsx("span", { children: "Read →" })
        ] })
      ] }, p.id)) })
    ] }) })
  ] });
}
function InsightsPage({ data }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { settings: data.settings, title: "Legal Insights", description: "Articles, explainers, video and commentary from Kariuki Kagunda & Co. Advocates." }),
    /* @__PURE__ */ jsx(PageHero, { eyebrow: "Legal Insights", title: "PRACTICAL LEGAL THINKING FOR A CHANGING KENYA.", copy: "Articles, explainers, video and commentary from the firm." }),
    /* @__PURE__ */ jsx(Section, { children: /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsx("div", { className: "article-grid featured-grid", children: data.publications.map((p, i) => /* @__PURE__ */ jsxs(Link, { className: `article-card ${i === 0 ? "feature" : ""}`, to: "/insights/$slug", params: { slug: p.slug }, children: [
      /* @__PURE__ */ jsx(SafeImage, { asset: p.cover, fallback: i === 0 ? "/assets/media-feature.png" : "/assets/media-ip.png", alt: p.title }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("small", { children: [
          p.kind,
          " · ",
          new Date(p.publishedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
        ] }),
        /* @__PURE__ */ jsx("h3", { children: p.title }),
        /* @__PURE__ */ jsx("p", { children: p.excerpt }),
        /* @__PURE__ */ jsxs("span", { children: [
          p.kind === "VIDEO" ? "Watch" : "Read",
          " →"
        ] })
      ] })
    ] }, p.id)) }) }) })
  ] });
}
function InsightPage({ publication, data }) {
  const related = data.publications.filter((p) => p.id !== publication.id && p.practiceAreas.some((a) => publication.practiceAreas.includes(a))).slice(0, 3);
  const seo = publication.seo || {};
  return /* @__PURE__ */ jsxs("article", { className: "article-page", children: [
    /* @__PURE__ */ jsx(Seo, { settings: data.settings, title: seo.title || publication.title, description: seo.description || publication.excerpt, image: publication.cover?.url }),
    /* @__PURE__ */ jsx("header", { className: "article-header", children: /* @__PURE__ */ jsxs(ReadingContainer, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: publication.kind === "VIDEO" ? "Video" : "Legal Insight" }),
      /* @__PURE__ */ jsx(Heading, { as: "h1", children: publication.title }),
      /* @__PURE__ */ jsx("p", { children: publication.excerpt }),
      /* @__PURE__ */ jsxs("div", { className: "article-meta", children: [
        /* @__PURE__ */ jsx("span", { children: new Date(publication.publishedAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) }),
        publication.duration && /* @__PURE__ */ jsx("span", { children: publication.duration }),
        publication.author && /* @__PURE__ */ jsxs(Link, { to: "/team/$slug", params: { slug: publication.author.slug }, children: [
          "By ",
          publication.author.name
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "article-cover", children: [
      /* @__PURE__ */ jsx(SafeImage, { asset: publication.cover, fallback: "/assets/media-feature.png", alt: publication.title }),
      publication.kind === "VIDEO" && /* @__PURE__ */ jsx("div", { className: "video-play-overlay", "aria-hidden": true, children: "▶" })
    ] }),
    /* @__PURE__ */ jsx(Section, { children: /* @__PURE__ */ jsxs(ReadingContainer, { className: "prose article-body", children: [
      publication.body.split(/\n\n+/).filter(Boolean).map((p, i) => /* @__PURE__ */ jsx("p", { children: p }, i)),
      /* @__PURE__ */ jsx("p", { className: "legal-note", children: "This publication is general information and is not a substitute for advice on a specific matter." })
    ] }) }),
    related.length > 0 && /* @__PURE__ */ jsx(Section, { tone: "ivory", children: /* @__PURE__ */ jsxs(Container, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: "Related" }),
      /* @__PURE__ */ jsx(Heading, { children: "MORE FROM THE FIRM." }),
      /* @__PURE__ */ jsx("div", { className: "article-grid", children: related.map((p) => /* @__PURE__ */ jsxs(Link, { className: "article-card", to: "/insights/$slug", params: { slug: p.slug }, children: [
        /* @__PURE__ */ jsx(SafeImage, { asset: p.cover, fallback: "/assets/media-ip.png", alt: p.title }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("small", { children: p.kind }),
          /* @__PURE__ */ jsx("h3", { children: p.title }),
          /* @__PURE__ */ jsx("p", { children: p.excerpt }),
          /* @__PURE__ */ jsx("span", { children: "Read →" })
        ] })
      ] }, p.id)) })
    ] }) })
  ] });
}
function ContactPage({ data }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { settings: data.settings, title: "Contact Us", description: "Contact Kariuki Kagunda & Co. Advocates for a legal enquiry or consultation." }),
    /* @__PURE__ */ jsx("section", { className: "contact-hero", children: /* @__PURE__ */ jsxs(Container, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: "Contact Us" }),
      /* @__PURE__ */ jsx(Heading, { as: "h1", children: "LET’S START A CONVERSATION." }),
      /* @__PURE__ */ jsx("p", { children: "Tell us the essential facts. Our team can review the enquiry and route it to the appropriate practice area." })
    ] }) }),
    /* @__PURE__ */ jsx(Section, { children: /* @__PURE__ */ jsxs(Container, { className: "contact-layout", children: [
      /* @__PURE__ */ jsxs("div", { className: "contact-form-wrap", children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: "Work With Us" }),
        /* @__PURE__ */ jsx(Heading, { children: "HOW CAN WE HELP?" }),
        /* @__PURE__ */ jsx(LeadForm, { areas: data.practiceAreas })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "contact-info", children: [
        /* @__PURE__ */ jsx("div", { className: "contact-image", children: /* @__PURE__ */ jsx("img", { src: "/assets/consultation-partner.png", alt: "Legal professional at Kariuki Kagunda & Co. Advocates" }) }),
        /* @__PURE__ */ jsx("div", { className: "contact-gold", children: /* @__PURE__ */ jsx(Heading, { children: "YOUR LEGAL PARTNER FOR A BRIGHTER TOMORROW." }) }),
        /* @__PURE__ */ jsxs("div", { className: "contact-details", children: [
          /* @__PURE__ */ jsx("h3", { children: "Contact information" }),
          /* @__PURE__ */ jsx("a", { href: `tel:${data.settings.phone.replace(/\s/g, "")}`, children: data.settings.phone }),
          /* @__PURE__ */ jsx("a", { href: `mailto:${data.settings.email}`, children: data.settings.email }),
          /* @__PURE__ */ jsx("p", { children: data.settings.address })
        ] })
      ] })
    ] }) })
  ] });
}
function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      setResults(await searchSite(q.trim()));
    } catch (e2) {
      setResults([]);
      setError(e2 instanceof Error ? e2.message : "Search is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("section", { className: "page-hero small", children: /* @__PURE__ */ jsxs(Container, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: "Search" }),
      /* @__PURE__ */ jsx(Heading, { as: "h1", children: "FIND A PRACTICE, PROFESSIONAL OR INSIGHT." })
    ] }) }),
    /* @__PURE__ */ jsx(Section, { children: /* @__PURE__ */ jsxs(Container, { children: [
      /* @__PURE__ */ jsxs("form", { className: "search-form", onSubmit: submit, children: [
        /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search the firm...", "aria-label": "Search" }),
        /* @__PURE__ */ jsx("button", { children: loading ? "Searching…" : "Search" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "search-results", "aria-live": "polite", children: [
        error && /* @__PURE__ */ jsx("p", { role: "alert", children: error }),
        searched && !loading && !error && !results.length && /* @__PURE__ */ jsx("p", { children: "No matching public content was found." }),
        results.map((r, i) => /* @__PURE__ */ jsxs("a", { href: r.url, children: [
          /* @__PURE__ */ jsx("small", { children: r.type }),
          /* @__PURE__ */ jsx("h3", { children: r.title }),
          /* @__PURE__ */ jsx("p", { children: r.excerpt })
        ] }, `${r.url}-${i}`))
      ] })
    ] }) })
  ] });
}
const allowedTones = /* @__PURE__ */ new Set(["light", "ivory", "dark", "gold"]);
function tone(v) {
  return allowedTones.has(v) ? v : "light";
}
function text(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function strings(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}
function SiteBlockRenderer({ block, data }) {
  const c = block.content || {};
  const sectionTone = tone(block.theme);
  switch (block.blockType) {
    case "HERO_JUSTICE":
      return /* @__PURE__ */ jsx(Hero, { content: c });
    case "FIRM_INTRODUCTION":
      return /* @__PURE__ */ jsx(WhoWeAre, { data, content: c });
    case "PARTNER_LEADERSHIP":
      return /* @__PURE__ */ jsx(PartnerLeadership, { data, content: c });
    case "MEDIA_FEATURE":
      return /* @__PURE__ */ jsx(MediaInsights, { data, content: c });
    case "TEAM_FEATURE":
      return /* @__PURE__ */ jsx(TeamPreview, { data, content: c });
    case "TESTIMONIALS":
      return /* @__PURE__ */ jsx(Testimonials, { data, content: c });
    case "CONSULTATION":
      return /* @__PURE__ */ jsx(Consultation, { data, content: c });
    case "HERO":
      return /* @__PURE__ */ jsx("section", { className: `page-hero cms-hero hero-${block.variant || "default"}`, children: /* @__PURE__ */ jsxs(Container, { children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: text(c.eyebrow, "Kariuki Kagunda & Co. Advocates") }),
        /* @__PURE__ */ jsx(Heading, { as: "h1", children: text(c.title, "Practical legal counsel.") }),
        c.description && /* @__PURE__ */ jsx("p", { children: text(c.description) }),
        c.ctaUrl && /* @__PURE__ */ jsxs(Link, { to: text(c.ctaUrl), className: "ui-button ui-button-gold", children: [
          /* @__PURE__ */ jsx("span", { children: text(c.ctaLabel, "Contact Us") }),
          /* @__PURE__ */ jsx("span", { children: "→" })
        ] })
      ] }) });
    case "RICH_TEXT":
      return /* @__PURE__ */ jsx(Section, { tone: sectionTone, children: /* @__PURE__ */ jsxs(ReadingContainer, { className: "prose cms-rich", children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: text(c.eyebrow) }),
        c.title && /* @__PURE__ */ jsx(Heading, { children: text(c.title) }),
        text(c.body).split(/\n\n+/).filter(Boolean).map((p, i) => /* @__PURE__ */ jsx("p", { children: p }, i))
      ] }) });
    case "QUOTE":
      return /* @__PURE__ */ jsx(Section, { tone: sectionTone, className: "cms-quote", children: /* @__PURE__ */ jsxs(ReadingContainer, { children: [
        /* @__PURE__ */ jsx("blockquote", { children: text(c.quote) }),
        c.attribution && /* @__PURE__ */ jsx("cite", { children: text(c.attribution) })
      ] }) });
    case "IMAGE_TEXT":
      return /* @__PURE__ */ jsx(Section, { tone: sectionTone, children: /* @__PURE__ */ jsxs(Container, { className: `cms-image-text ${block.variant || ""}`, children: [
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(SafeImage, { asset: c.asset || null, fallback: text(c.fallbackImage, "/assets/partner-kariuki.png"), alt: text(c.alt, c.title || "") }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Eyebrow, { children: text(c.eyebrow) }),
          /* @__PURE__ */ jsx(Heading, { children: text(c.title) }),
          text(c.body).split(/\n\n+/).filter(Boolean).map((p, i) => /* @__PURE__ */ jsx("p", { children: p }, i)),
          c.ctaUrl && /* @__PURE__ */ jsxs("a", { className: "ui-button ui-button-outline", href: text(c.ctaUrl), children: [
            /* @__PURE__ */ jsx("span", { children: text(c.ctaLabel, "Learn More") }),
            /* @__PURE__ */ jsx("span", { children: "→" })
          ] })
        ] })
      ] }) });
    case "PRACTICE_GRID": {
      if (block.variant === "home") return /* @__PURE__ */ jsx(Services, { data, content: c });
      const requested = strings(c.slugs);
      const items = requested.length ? data.practiceAreas.filter((a) => requested.includes(a.slug)) : data.practiceAreas;
      return /* @__PURE__ */ jsx(Section, { tone: sectionTone, children: /* @__PURE__ */ jsxs(Container, { children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: text(c.eyebrow, "Our Services") }),
        /* @__PURE__ */ jsx(Heading, { children: text(c.title, "AREAS OF PRACTICE") }),
        c.description && /* @__PURE__ */ jsx("p", { className: "cms-section-copy", children: text(c.description) }),
        /* @__PURE__ */ jsx("div", { className: "practice-index-grid", children: items.map((a) => /* @__PURE__ */ jsx(PracticeCard, { area: a }, a.id)) })
      ] }) });
    }
    case "PROFESSIONAL_GRID": {
      const requested = strings(c.slugs);
      const items = requested.length ? data.partners.filter((p) => requested.includes(p.slug)) : data.partners;
      return /* @__PURE__ */ jsx(Section, { tone: sectionTone, children: /* @__PURE__ */ jsxs(Container, { children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: text(c.eyebrow, "Our Team") }),
        /* @__PURE__ */ jsx(Heading, { children: text(c.title, "MEET THE TEAM") }),
        /* @__PURE__ */ jsx("div", { className: "partner-grid-large", children: items.map((p) => /* @__PURE__ */ jsx(PartnerCard, { partner: p, variant: "featured" }, p.id)) })
      ] }) });
    }
    case "INSIGHTS_GRID": {
      const requested = strings(c.slugs);
      const items = requested.length ? data.publications.filter((p) => requested.includes(p.slug)) : data.publications;
      return /* @__PURE__ */ jsx(Section, { tone: sectionTone, children: /* @__PURE__ */ jsxs(Container, { children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: text(c.eyebrow, "Insights") }),
        /* @__PURE__ */ jsx(Heading, { children: text(c.title, "LEGAL INSIGHTS & UPDATES") }),
        /* @__PURE__ */ jsx("div", { className: "article-grid", children: items.slice(0, Number(c.limit) || 12).map((p) => /* @__PURE__ */ jsxs(Link, { className: "article-card", to: "/insights/$slug", params: { slug: p.slug }, children: [
          /* @__PURE__ */ jsx(SafeImage, { asset: p.cover, fallback: "/assets/media-feature.png", alt: p.title }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("small", { children: p.kind }),
            /* @__PURE__ */ jsx("h3", { children: p.title }),
            /* @__PURE__ */ jsx("p", { children: p.excerpt }),
            /* @__PURE__ */ jsxs("span", { children: [
              p.kind === "VIDEO" ? "Watch" : "Read",
              " →"
            ] })
          ] })
        ] }, p.id)) })
      ] }) });
    }
    case "METRICS":
      return /* @__PURE__ */ jsx("section", { className: `metrics cms-metrics theme-${sectionTone}`, children: /* @__PURE__ */ jsx(Container, { className: "metrics-grid", children: data.metrics.map((m) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: m.value }),
        /* @__PURE__ */ jsx("span", { children: m.label })
      ] }, m.id)) }) });
    case "FAQ": {
      const faqs = Array.isArray(c.items) ? c.items : [];
      return /* @__PURE__ */ jsx(Section, { tone: sectionTone, children: /* @__PURE__ */ jsxs(ReadingContainer, { className: "faq-list", children: [
        /* @__PURE__ */ jsx(Eyebrow, { children: text(c.eyebrow, "Questions") }),
        /* @__PURE__ */ jsx(Heading, { children: text(c.title, "FREQUENTLY ASKED QUESTIONS") }),
        faqs.map((f, i) => /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsx("summary", { children: text(f.q) }),
          /* @__PURE__ */ jsx("p", { children: text(f.a) })
        ] }, i))
      ] }) });
    }
    case "CTA":
      return /* @__PURE__ */ jsx(Section, { tone: sectionTone, children: /* @__PURE__ */ jsxs(Container, { className: "cms-cta", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Eyebrow, { children: text(c.eyebrow, "Let's Talk") }),
          /* @__PURE__ */ jsx(Heading, { children: text(c.title, "LET'S START A CONVERSATION.") }),
          c.description && /* @__PURE__ */ jsx("p", { children: text(c.description) })
        ] }),
        c.form === false ? /* @__PURE__ */ jsxs("a", { href: text(c.ctaUrl, "/contact"), className: "ui-button ui-button-gold", children: [
          /* @__PURE__ */ jsx("span", { children: text(c.ctaLabel, "Contact Us") }),
          /* @__PURE__ */ jsx("span", { children: "→" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "cms-cta-form", children: /* @__PURE__ */ jsx(LeadForm, { areas: data.practiceAreas, compact: true }) })
      ] }) });
    case "SPACER":
      return /* @__PURE__ */ jsx("div", { "aria-hidden": true, style: { height: `clamp(1rem, ${Math.min(Math.max(Number(c.size) || 4, 1), 12)}vw, 8rem)` } });
    default:
      throw new Error(`Unsupported public block: ${block.blockType}`);
  }
}
function NotFoundPage() {
  return /* @__PURE__ */ jsx("section", { className: "not-found", children: /* @__PURE__ */ jsxs(Container, { children: [
    /* @__PURE__ */ jsx(Eyebrow, { children: "404" }),
    /* @__PURE__ */ jsx(Heading, { as: "h1", children: "THIS PAGE HAS LEFT THE COURTROOM." }),
    /* @__PURE__ */ jsx("p", { children: "The page you requested could not be found." }),
    /* @__PURE__ */ jsxs(Link, { className: "ui-button ui-button-gold", to: "/", children: [
      /* @__PURE__ */ jsx("span", { children: "Return Home" }),
      /* @__PURE__ */ jsx("span", { children: "→" })
    ] })
  ] }) });
}
function ContentPage({ slug, data, fallback }) {
  const record = data.pages?.find((p) => p.slug === slug);
  if (!record?.blocks.length) return /* @__PURE__ */ jsx(Fragment, { children: fallback ?? /* @__PURE__ */ jsx(NotFoundPage, {}) });
  const seo = record.seo || {};
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Seo, { settings: data.settings, title: seo.title || record.title, description: seo.description || record.description, canonical: seo.canonical, noindex: seo.noindex }),
    record.blocks.map((b, i) => /* @__PURE__ */ jsx(SiteBlockRenderer, { block: b, data }, b.id || `${b.blockType}-${i}`))
  ] });
}
const DynamicPage = ContentPage;
function createSiteRouter(snapshot, url) {
  const dataPromise = snapshot ? Promise.resolve({ ...snapshot.bootstrap, pages: snapshot.pages }) : bootstrap();
  const rootRoute = createRootRoute({ loader: () => dataPromise, component: Root, notFoundComponent: NotFoundPage, errorComponent: ({ error }) => /* @__PURE__ */ jsxs("section", { className: "not-found", role: "alert", children: [
    /* @__PURE__ */ jsx("h1", { children: "Website temporarily unavailable" }),
    /* @__PURE__ */ jsx("p", { children: "Please try again shortly." }),
    /* @__PURE__ */ jsx("button", { onClick: () => location.reload(), children: "Retry" })
  ] }) });
  const find = async (key, slug) => {
    const data = await dataPromise;
    const value = data[key].find((x) => x.slug === slug);
    if (!value) throw notFound();
    return value;
  };
  function Root() {
    const data = rootRoute.useLoaderData();
    const path = useRouterState({ select: (s) => s.location.pathname });
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Seo, { settings: data.settings }),
      /* @__PURE__ */ jsx("a", { className: "skip-link", href: "#main", children: "Skip to content" }),
      /* @__PURE__ */ jsx(SiteHeader, { settings: data.settings }),
      /* @__PURE__ */ jsx("main", { id: "main", "data-path": path, children: /* @__PURE__ */ jsx(Outlet, {}) }),
      /* @__PURE__ */ jsx(SiteFooter, { settings: data.settings, areas: data.practiceAreas })
    ] });
  }
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => {
    const data = rootRoute.useLoaderData();
    return /* @__PURE__ */ jsx(ContentPage, { slug: "home", data, fallback: /* @__PURE__ */ jsx(HomePage, { data }) });
  } });
  const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: "/about", component: () => {
    const data = rootRoute.useLoaderData();
    return /* @__PURE__ */ jsx(ContentPage, { slug: "about", data, fallback: /* @__PURE__ */ jsx(AboutPage, { data }) });
  } });
  const practiceIndex = createRoute({ getParentRoute: () => rootRoute, path: "/practice-areas", component: () => {
    const data = rootRoute.useLoaderData();
    return /* @__PURE__ */ jsx(PracticeAreasPage, { data });
  } });
  const practiceDetail = createRoute({ getParentRoute: () => rootRoute, path: "/practice-areas/$slug", loader: ({ params }) => find("practiceAreas", params.slug), component: () => {
    const area = practiceDetail.useLoaderData();
    const data = rootRoute.useLoaderData();
    return /* @__PURE__ */ jsx(PracticeDetailPage, { area, data });
  } });
  const teamIndex = createRoute({ getParentRoute: () => rootRoute, path: "/team", component: () => {
    const data = rootRoute.useLoaderData();
    return /* @__PURE__ */ jsx(TeamPage, { data });
  } });
  const partnerDetail = createRoute({ getParentRoute: () => rootRoute, path: "/team/$slug", loader: ({ params }) => find("partners", params.slug), component: () => {
    const p = partnerDetail.useLoaderData();
    const data = rootRoute.useLoaderData();
    return /* @__PURE__ */ jsx(PartnerPage, { partner: p, data });
  } });
  const insightsIndex = createRoute({ getParentRoute: () => rootRoute, path: "/insights", component: () => {
    const data = rootRoute.useLoaderData();
    return /* @__PURE__ */ jsx(InsightsPage, { data });
  } });
  const insightDetail = createRoute({ getParentRoute: () => rootRoute, path: "/insights/$slug", loader: ({ params }) => find("publications", params.slug), component: () => {
    const p = insightDetail.useLoaderData();
    const data = rootRoute.useLoaderData();
    return /* @__PURE__ */ jsx(InsightPage, { publication: p, data });
  } });
  const contactRoute = createRoute({ getParentRoute: () => rootRoute, path: "/contact", component: () => {
    const data = rootRoute.useLoaderData();
    return /* @__PURE__ */ jsx(ContentPage, { slug: "contact", data, fallback: /* @__PURE__ */ jsx(ContactPage, { data }) });
  } });
  const searchRoute = createRoute({ getParentRoute: () => rootRoute, path: "/search", component: SearchPage });
  const cmsPageRoute = createRoute({ getParentRoute: () => rootRoute, path: "/$slug", loader: async ({ params }) => {
    const data = await dataPromise;
    if (!data.pages?.some((p) => p.slug === params.slug)) throw notFound();
  }, component: () => {
    const { slug } = cmsPageRoute.useParams();
    const data = rootRoute.useLoaderData();
    return /* @__PURE__ */ jsx(DynamicPage, { slug, data });
  } });
  const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, practiceIndex, practiceDetail, teamIndex, partnerDetail, insightsIndex, insightDetail, contactRoute, searchRoute, cmsPageRoute]);
  return createRouter({ routeTree, history: url ? createMemoryHistory({ initialEntries: [url] }) : void 0, defaultPreload: "intent", defaultPreloadStaleTime: 3e4, scrollRestoration: true });
}
async function render(url, snapshot) {
  const router = createSiteRouter(snapshot, url);
  await router.load();
  return renderToString(/* @__PURE__ */ jsx(RouterProvider, { router }));
}
export {
  render
};
//# sourceMappingURL=entry-server.js.map
