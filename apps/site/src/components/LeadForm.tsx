import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PublicLeadSchema } from '@kka/contracts';
import { Button, Field, Input, Select, Textarea } from '@kka/site-ui';
import type { PracticeArea, PublicForm, PublicFormField } from '../types';
import { PublicApiError, submitLead } from '../lib/api';
type Form={name:string;email:string;phone:string;practiceAreaSlug:string;message:string;consent:boolean;website:string};
const defaultFields:PublicFormField[]=[
 {key:'name',label:'Full name',helpText:'',placeholder:'Your full name',visible:true,required:true,order:0},
 {key:'phone',label:'Phone number',helpText:'',placeholder:'0712 345 678',visible:true,required:true,order:1},
 {key:'email',label:'Email address',helpText:'',placeholder:'you@example.com',visible:true,required:false,order:2},
 {key:'practiceAreaSlug',label:'Area of interest',helpText:'',placeholder:'Choose a practice area',visible:true,required:false,order:3},
 {key:'message',label:'How can we help?',helpText:'',placeholder:'Briefly tell us how we can help.',visible:true,required:true,order:4},
 {key:'consent',label:'Consent confirmation',helpText:'',placeholder:'',visible:true,required:true,order:5},
 {key:'website',label:'Spam protection',helpText:'',placeholder:'',visible:false,required:false,order:99},
];
export function LeadForm({areas,definition,compact=false}:{areas:PracticeArea[];definition?:PublicForm;compact?:boolean}){
 const {register,handleSubmit,reset,setError,clearErrors,formState:{errors,isSubmitting}}=useForm<Form>({defaultValues:{consent:false,website:''}});
 const [result,setResult]=useState<{reference:string}|null>(null),[failure,setFailure]=useState('');
 const request=useRef<{fingerprint:string;key:string}|null>(null);
 const attribution=useMemo(()=>{const p=new URLSearchParams(typeof location==='undefined'?'':location.search);return Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].map(k=>[k,p.get(k)||'']).filter(([,v])=>v));},[]);
 const fields=useMemo(()=>[...defaultFields.map(field=>({...field})),...(definition?.fields||[])].reduce<PublicFormField[]>((all,field)=>{const index=all.findIndex(item=>item.key===field.key);if(index>=0)all[index]={...all[index],...field};else all.push(field);return all;},[]).filter(field=>field.key==='website'||field.visible!==false).sort((a,b)=>a.order-b.order),[definition]);
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
 {fields.map(field=>field.key==='website'?<label key={field.key} className="honeypot" aria-hidden="true">Website<Input tabIndex={-1} autoComplete="off" {...register('website')}/></label>:field.key==='consent'?<ConsentField key={field.key} label={field.label} helpText={field.helpText} definition={definition} register={register} error={(errors as any).consent?.message}/>:<ConfiguredField key={field.key} field={field} areas={areas} compact={compact} register={register} error={(errors as any)[field.key]?.message}/>)}
 {failure&&<div className="form-failure" role="alert">{failure}</div>}<Button type="submit" disabled={isSubmitting}>{isSubmitting?'Submitting...':'Submit Enquiry'}</Button></form>;
}
function ConsentField({label,helpText,definition,register,error}:{label:string;helpText?:string;definition?:PublicForm;register:any;error?:string}){
 return <div className="consent"><label><input type="checkbox" {...register('consent')}/><span>{definition?.consentText||label||'I consent to the firm using this information to review and respond to my enquiry.'}</span></label>{helpText&&<small className="field-help">{helpText}</small>}{error&&<p role="alert">Please confirm your consent.</p>}</div>;
}
function ConfiguredField({field,areas,compact,register,error}:{field:PublicFormField;areas:PracticeArea[];compact:boolean;register:any;error?:string}){
 const child=field.key==='name'?<Input autoComplete="name" placeholder={field.placeholder} {...register('name')}/>:field.key==='phone'?<Input type="tel" autoComplete="tel" placeholder={field.placeholder} {...register('phone')}/>:field.key==='email'?<Input type="email" autoComplete="email" placeholder={field.placeholder} {...register('email')}/>:field.key==='practiceAreaSlug'?<Select {...register('practiceAreaSlug')}><option value="">{field.placeholder||'Choose a practice area'}</option>{areas.map(a=><option value={a.slug} key={a.id}>{a.title}</option>)}</Select>:<Textarea rows={compact?4:6} placeholder={field.placeholder} {...register('message')}/>;
 return <Field label={field.label} error={error}>{child}{field.helpText&&<small className="field-help">{field.helpText}</small>}</Field>;
}
