import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PublicLeadSchema } from '@kka/contracts';
import { Button, Field, Input, Select, Textarea } from '@kka/site-ui';
import type { PracticeArea, PublicForm } from '../types';
import { PublicApiError, submitLead } from '../lib/api';
type Form={name:string;email:string;phone:string;practiceAreaSlug:string;message:string;consent:boolean;website:string};
export function LeadForm({areas,definition,compact=false}:{areas:PracticeArea[];definition?:PublicForm;compact?:boolean}){
 const {register,handleSubmit,reset,setError,clearErrors,formState:{errors,isSubmitting}}=useForm<Form>({defaultValues:{consent:false,website:''}});
 const [result,setResult]=useState<{reference:string}|null>(null),[failure,setFailure]=useState('');
 const request=useRef<{fingerprint:string;key:string}|null>(null);
 const attribution=useMemo(()=>{const p=new URLSearchParams(typeof location==='undefined'?'':location.search);return Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].map(k=>[k,p.get(k)||'']).filter(([,v])=>v));},[]);
 async function submit(raw:Form){
  clearErrors();setFailure('');const parsed=PublicLeadSchema.safeParse(raw);
  if(!parsed.success){for(const issue of parsed.error.issues)setError(issue.path[0] as keyof Form,{message:issue.message});setFailure('Please correct the highlighted fields.');return;}
  const input={...parsed.data,formVersion:definition?.version,source:document.referrer||'DIRECT',landingPage:location.pathname,utm:attribution};
  const fingerprint=JSON.stringify(input);if(request.current?.fingerprint!==fingerprint)request.current={fingerprint,key:crypto.randomUUID()};
  try{const r=await submitLead({...input,idempotencyKey:request.current.key});if(!r.reference)throw new Error('The server did not return an enquiry reference.');setResult(r);reset();request.current=null;}
  catch(e){if(e instanceof PublicApiError)for(const [field,messages]of Object.entries(e.fields))setError(field as keyof Form,{message:messages.join(' ')});setFailure(e instanceof Error?e.message:'We could not submit your enquiry. Please try again.');}
 }
 if(result)return <div className="lead-success" role="status"><h3>Thank you. Your enquiry has been received.</h3><p>Your reference is <strong>{result.reference}</strong>. Our team will review your enquiry and contact you.</p><button onClick={()=>setResult(null)}>Send another enquiry</button></div>;
 return <form className={`lead-form ${compact?'compact':''}`} onSubmit={handleSubmit(submit)} noValidate>
 <Field label="Full Name" error={errors.name?.message}><Input autoComplete="name" {...register('name')}/></Field>
 <div className="form-two"><Field label="Phone" error={errors.phone?.message}><Input type="tel" autoComplete="tel" {...register('phone')}/></Field><Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register('email')}/></Field></div>
 <Field label="Area of Interest" error={errors.practiceAreaSlug?.message}><Select {...register('practiceAreaSlug')}><option value="">Choose a practice area</option>{areas.map(a=><option value={a.slug} key={a.id}>{a.title}</option>)}</Select></Field>
 <Field label="Message" error={errors.message?.message}><Textarea rows={compact?4:6} {...register('message')}/></Field>
 <label className="honeypot" aria-hidden="true">Website<Input tabIndex={-1} autoComplete="off" {...register('website')}/></label>
 <label className="consent"><input type="checkbox" {...register('consent')}/><span>{definition?.consentText||'I consent to the firm using this information to review and respond to my enquiry.'}</span></label>{errors.consent&&<p role="alert">Please confirm your consent.</p>}
 {failure&&<div className="form-failure" role="alert">{failure}</div>}<Button type="submit" disabled={isSubmitting}>{isSubmitting?'Submitting...':'Submit Enquiry'}</Button></form>;
}
