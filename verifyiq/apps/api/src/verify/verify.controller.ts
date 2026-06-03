// apps/api/src/verify/verify.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ArrayMaxSize, IsBase64, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VerifyService } from './verify.service';
import { DocumentType } from '../../../../libs/types/src/index';

class VerifyDocumentDto {
  @IsEnum(DocumentType)
  documentType: DocumentType = DocumentType.AADHAAR;

  @IsOptional()
  @IsBase64()
  imageBase64?: string;

  @IsOptional()
  manualFields?: Record<string, string>;

  @IsOptional()
  @IsString()
  consentToken?: string;
}

class BatchVerifyDto {
  @ValidateNested({ each: true })
  @Type(() => VerifyDocumentDto)
  @ArrayMaxSize(10)
  documents: VerifyDocumentDto[] = [];
}

@ApiTags('verify')
@Controller('verify')
export class VerifyController {
  constructor(private readonly verify: VerifyService) {}

  @Post()
  @ApiOperation({ summary: 'Run an anonymous stateless document verification' })
  @ApiResponse({ status: 200, description: 'Verification result returned without persistence' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file'))
  async submit(
    @Body() dto: VerifyDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const payload: {
      documentType: DocumentType;
      imageBase64?: string;
      imageBuffer?: Buffer;
      manualFields?: Record<string, string>;
      consentToken?: string;
    } = {
      documentType: dto.documentType,
    };
    if (dto.imageBase64) payload.imageBase64 = dto.imageBase64;
    if (file?.buffer) payload.imageBuffer = file.buffer;
    if (dto.manualFields) payload.manualFields = dto.manualFields;
    if (dto.consentToken) payload.consentToken = dto.consentToken;
    return this.verify.submit(payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Explain why persisted result lookup is unavailable' })
  async getResult(@Param('id') _requestId: string) {
    return this.verify.getResult();
  }

  @Get(':id/reasoning')
  @ApiOperation({ summary: 'Explain why persisted reasoning lookup is unavailable' })
  async getReasoning(@Param('id') _requestId: string) {
    return this.verify.getReasoning();
  }

  @Post('batch')
  @HttpCode(200)
  @ApiOperation({ summary: 'Run up to 10 stateless document verifications' })
  async batch(@Body() dto: BatchVerifyDto) {
    return this.verify.submitBatch({
      documents: dto.documents,
    });
  }
}
