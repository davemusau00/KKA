import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
export function Field({label,error,children}:{label:string;error?:string;children:React.ReactNode}){return <label className={`ui-field ${error?'ui-field-error':''}`}><span>{label}</span>{children}{error&&<em role="alert">{error}</em>}</label>}
export function Input(props:InputHTMLAttributes<HTMLInputElement>){return <input className="ui-input" {...props}/>}
export function Select(props:SelectHTMLAttributes<HTMLSelectElement>){return <select className="ui-input" {...props}/>}
export function Textarea(props:TextareaHTMLAttributes<HTMLTextAreaElement>){return <textarea className="ui-input ui-textarea" {...props}/>}
