import type { Job } from 'bullmq';
import type { KkaPrismaClient } from '@kka/database';
import nodemailer from 'nodemailer';
export async function processWebsiteAcknowledgement(job:Job,prisma:KkaPrismaClient){
 const event=await prisma.websiteLeadEvent.findUnique({where:{id:String(job.data.eventId)},include:{lead:true}});
 if(!event||event.type==='lead.ack_captured')return;
 const host=process.env.WEBSITE_SMTP_CAPTURE_HOST;
 if(!host||!['127.0.0.1','localhost'].includes(host))throw new Error('Local SMTP capture is not configured. No external email was sent.');
 if(!event.lead.email)throw new Error('Enquiry has no email address');
 try{
  const transport=nodemailer.createTransport({host,port:Number(process.env.WEBSITE_SMTP_CAPTURE_PORT||11025),secure:false,ignoreTLS:true});
  const result=await transport.sendMail({from:'Kariuki Kagunda <enquiries@kka.local>',to:event.lead.email,messageId:`<${event.id}@kka.local>`,subject:`Enquiry received: ${event.lead.reference}`,text:`Thank you. Your enquiry has been received.\nReference: ${event.lead.reference}\nOur team will review your enquiry and contact you.`});
  if(!result.accepted?.length)throw new Error('Local mail capture rejected acknowledgement');
  await prisma.websiteLeadEvent.update({where:{id:event.id},data:{type:'lead.ack_captured',note:'Acknowledgement accepted by local SMTP capture; external delivery unverified',metadata:{messageId:result.messageId,capturedAt:new Date().toISOString()}}});
 }catch(error){await prisma.websiteLeadEvent.update({where:{id:event.id},data:{metadata:{lastError:error instanceof Error?error.message:String(error)}}});throw error;}
}
