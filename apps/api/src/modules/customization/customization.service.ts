import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { StorageService } from "../../platform/storage/storage.service";

@Injectable()
export class CustomizationService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly storage: StorageService) {}

  fields(firmId:string, entityType?:string) { return this.prisma.client.customFieldDefinition.findMany({ where:{ firmId, ...(entityType?{entityType}:{}) }, orderBy:[{entityType:"asc"},{label:"asc"}] }); }
  async createField(firmId:string, actorId:string, input:any) {
    const row=await this.prisma.client.customFieldDefinition.create({ data:{ firmId, ...input } });
    await this.audit.record({ firmId,actorUserId:actorId,action:"custom_field.created",entityType:"custom_field_definition",entityId:row.id,metadata:{key:row.key,entityType:row.entityType} });
    return row;
  }
  async updateField(firmId:string, actorId:string, id:string, input:any) {
    const found=await this.prisma.client.customFieldDefinition.findFirst({where:{id,firmId}}); if(!found) throw new NotFoundException("Custom field not found");
    const row=await this.prisma.client.customFieldDefinition.update({where:{id},data:input});
    await this.audit.record({firmId,actorUserId:actorId,action:"custom_field.updated",entityType:"custom_field_definition",entityId:id,metadata:{changedKeys:Object.keys(input)}}); return row;
  }
  async setFieldValue(firmId:string, actorId:string, fieldId:string, entityType:string, entityId:string, value:unknown, matterId?:string) {
    const field=await this.prisma.client.customFieldDefinition.findFirst({where:{id:fieldId,firmId,active:true}}); if(!field) throw new NotFoundException("Custom field not found");
    if(field.entityType!==entityType) throw new BadRequestException("Field is not configured for this entity type");
    const row=await this.prisma.client.customFieldValue.upsert({
      where:{fieldId_entityType_entityId:{fieldId,entityType,entityId}},
      create:{fieldId,entityType,entityId,matterId,value:value as any,updatedById:actorId},
      update:{value:value as any,matterId,updatedById:actorId}
    });
    await this.audit.record({firmId,actorUserId:actorId,action:"custom_field.value_set",entityType,entityId,matterId,metadata:{fieldKey:field.key}}); return row;
  }

  forms(firmId:string) { return this.prisma.client.formDefinition.findMany({where:{firmId},include:{versions:{orderBy:{version:"desc"}}},orderBy:{name:"asc"}}); }
  async createForm(firmId:string, actorId:string, input:any) {
    return this.prisma.client.formDefinition.create({data:{firmId,key:input.key,name:input.name,purpose:input.purpose,scopeType:input.scopeType,scopeId:input.scopeId,active:true,versions:{create:{version:1,schema:input.schema,createdById:actorId,publishedAt:input.publish?new Date():undefined}}},include:{versions:true}});
  }
  async addFormVersion(firmId:string, actorId:string, formId:string, schema:any, publish:boolean) {
    const form=await this.prisma.client.formDefinition.findFirst({where:{id:formId,firmId}}); if(!form) throw new NotFoundException("Form not found");
    const latest=await this.prisma.client.formVersion.findFirst({where:{formId},orderBy:{version:"desc"}});
    return this.prisma.client.formVersion.create({data:{formId,version:(latest?.version??0)+1,schema,createdById:actorId,publishedAt:publish?new Date():undefined}});
  }
  async submitForm(firmId:string, actorId:string, versionId:string, input:{entityType:string;entityId:string;data:unknown;status?:string}) {
    const version=await this.prisma.client.formVersion.findFirst({where:{id:versionId,form:{firmId}}}); if(!version) throw new NotFoundException("Form version not found");
    return this.prisma.client.formSubmission.create({data:{formVersionId:versionId,entityType:input.entityType,entityId:input.entityId,submittedById:actorId,data:input.data as any,status:input.status??"SUBMITTED"}});
  }

  templates(firmId:string) { return this.prisma.client.documentTemplate.findMany({where:{firmId},include:{versions:{orderBy:{version:"desc"}}},orderBy:{name:"asc"}}); }
  async createTemplate(firmId:string, actorId:string, input:any) {
    return this.prisma.client.documentTemplate.create({data:{firmId,key:input.key,name:input.name,category:input.category,practiceArea:input.practiceArea,matterType:input.matterType,versions:{create:{version:1,status:input.publish?"PUBLISHED":"DRAFT",mergeSchema:input.mergeSchema,content:input.content,createdById:actorId,publishedAt:input.publish?new Date():undefined}}},include:{versions:true}});
  }
  async uploadTemplateVersion(firmId:string, actorId:string, templateId:string, file:{filename:string;mimetype:string;buffer:Buffer}, mergeSchema?:unknown, publish=false) {
    const template=await this.prisma.client.documentTemplate.findFirst({where:{id:templateId,firmId}}); if(!template) throw new NotFoundException("Document template not found");
    const stored=await this.storage.putDocument({filename:file.filename,mimeType:file.mimetype,buffer:file.buffer});
    const latest=await this.prisma.client.documentTemplateVersion.findFirst({where:{templateId},orderBy:{version:"desc"}});
    const row=await this.prisma.client.documentTemplateVersion.create({data:{templateId,version:(latest?.version??0)+1,status:publish?"PUBLISHED":"DRAFT",sourceStoragePath:stored.path,sourceMimeType:stored.mimeType,mergeSchema:mergeSchema as any,createdById:actorId,publishedAt:publish?new Date():undefined}});
    await this.audit.record({firmId,actorUserId:actorId,action:"document_template.version_uploaded",entityType:"document_template_version",entityId:row.id,metadata:{templateId,version:row.version,checksum:stored.checksumSha256}}); return row;
  }
}
